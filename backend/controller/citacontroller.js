// =====================================================================
// controller/citacontroller.js -> CONTROLADOR: la logica de citas (visitas a inmuebles)
// CRUD completo + citas de un inmueble
// =====================================================================

'use strict' // modo estricto de javascript

var validator = require('validator'); // validator: libreria para validar datos
var Cita = require('../models/cita'); // traemos el modelo Cita para usarlo aqui
var Inmueble = require('../models/inmueble'); // para revisar que el inmueble exista y este disponible
var Cliente = require('../models/cliente'); // para revisar que el cliente exista

// estados de una solicitud y a cuales se puede pasar desde cada uno
// realizada y cancelada son finales: ya no cambian
var TRANSICIONES = {
    pendiente: ['confirmada', 'realizada', 'cancelada'],
    confirmada: ['realizada', 'cancelada'],
    realizada: [],
    cancelada: []
};

// fecha de hoy en formato AAAA-MM-DD (hora de Colombia) para comparar con fecha_cita
function hoy() {
    return new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString().substring(0, 10);
}

// minutos que van del dia en Colombia (UTC-5). Ej: 9:30 a.m. -> 570
function minutosAhora() {
    var ahora = new Date(Date.now() - 5 * 60 * 60 * 1000);
    return ahora.getUTCHours() * 60 + ahora.getUTCMinutes();
}

// convierte la hora de la visita a minutos del dia. Ej: '8:00 a.m.' -> 480, '2:00 p.m.' -> 840
// devuelve -1 si el texto no tiene el formato 'H:MM a.m.' o 'H:MM p.m.'
function minutosDeHora(texto) {
    var partes = String(texto || '').trim().toLowerCase().match(/^(\d{1,2}):(\d{2})\s*(a\.?\s?m\.?|p\.?\s?m\.?)$/);
    if (!partes) return -1;
    var horas = parseInt(partes[1], 10);
    var minutos = parseInt(partes[2], 10);
    if (horas < 1 || horas > 12 || minutos > 59) return -1;
    var esTarde = partes[3].charAt(0) == 'p';
    if (horas == 12) horas = 0; // 12:xx a.m. = 0:xx y 12:xx p.m. = 12:xx
    return (horas + (esTarde ? 12 : 0)) * 60 + minutos;
}

// objeto controller: guarda todos los metodos de citas
var controller = {

    // ---------------- METODO DE PRUEBA (POST /api/cita/probando) ----------------
    probando: (req, res) => {
        return res.status(200).send({
            curso: 'web de desarrollo con node',
            proyecto: 'InmoConecta - Caracoli Inmobiliaria',
            modulo: 'citas'
        });
    },

    // ---------------- METODO DE PRUEBA DEL CONTROLADOR (GET /api/cita/test) ----------------
    test: (req, res) => {
        return res.status(200).send({
            message: 'soy la accion test de mi controlador de citas'
        });
    },

    // ---------------- METODO GUARDAR SOLICITUD (POST /api/save-cita) ----------------
    // la envia la app del cliente. tipo = 'visita' (con fecha y hora) o 'informacion' (con mensaje)
    save: async (req, res) => {
        var params = req.body;
        var tipo = params.tipo || 'visita';

        // 1. validar que los datos obligatorios existan
        if (!params.inmueble_id || !params.cliente_id) {
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        // 2. validar con validator: los ids deben tener formato de MongoDB
        //    si es visita: fecha valida (AAAA-MM-DD) y hora | si es informacion: el mensaje no puede ir vacio
        try {
            var validate_inmueble = validator.isMongoId(params.inmueble_id);
            var validate_cliente = validator.isMongoId(params.cliente_id);
            var validate_tipo = tipo == 'visita' || tipo == 'informacion';
            var validate_detalle = false;
            if (tipo == 'visita') {
                // la fecha debe venir exactamente como AAAA-MM-DD (con '/' se colaban fechas pasadas)
                // y la hora como '8:00 a.m.' o '2:00 p.m.'
                validate_detalle = validator.isDate(String(params.fecha_cita), { format: 'YYYY-MM-DD', delimiters: ['-'], strictMode: true }) &&
                    minutosDeHora(params.hora) >= 0;
            } else {
                validate_detalle = !validator.isEmpty(String(params.observaciones || '').trim());
            }
        } catch (err) {
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        // 3. si los datos son validos se revisan las reglas del negocio y se guarda la solicitud
        if (validate_inmueble && validate_cliente && validate_tipo && validate_detalle) {
            try {
                // REGLA: la visita no puede ser en un dia que ya paso
                if (tipo == 'visita' && String(params.fecha_cita).substring(0, 10) < hoy()) {
                    return res.status(400).send({
                        status: 'error',
                        message: 'La fecha de la visita no puede ser anterior a hoy !!!'
                    });
                }

                // REGLA: si la visita es para hoy, la hora no puede haber pasado ya
                if (tipo == 'visita' && String(params.fecha_cita).substring(0, 10) == hoy() && minutosDeHora(params.hora) <= minutosAhora()) {
                    return res.status(400).send({
                        status: 'error',
                        message: 'Esa hora ya pasó. Elige una hora más tarde u otro día !!!'
                    });
                }

                // REGLA: el inmueble y el cliente deben existir, y el inmueble debe estar disponible
                const inmueble = await Inmueble.findById(params.inmueble_id);
                const cliente = await Cliente.findById(params.cliente_id);
                if (!inmueble || !cliente) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'El inmueble o el cliente no existen !!!'
                    });
                }
                if (inmueble.estado != 'disponible') {
                    return res.status(409).send({
                        status: 'error',
                        message: 'El inmueble ' + inmueble.codigo + ' ya no esta disponible (' + inmueble.estado + ') !!!'
                    });
                }

                // REGLA: un cliente no puede tener dos solicitudes abiertas del mismo tipo para el mismo inmueble
                // (asi la app no crea duplicados si reintenta un envio)
                const abierta = await Cita.findOne({
                    inmueble_id: params.inmueble_id,
                    cliente_id: params.cliente_id,
                    tipo: tipo,
                    estado: { $in: ['pendiente', 'confirmada'] }
                });
                if (abierta) {
                    return res.status(409).send({
                        status: 'error',
                        message: 'Ya tienes una solicitud abierta para este inmueble, espera la respuesta de la inmobiliaria !!!',
                        cita: abierta
                    });
                }
            } catch (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al revisar la solicitud !!!'
                });
            }

            var cita = new Cita();

            cita.inmueble_id = params.inmueble_id;
            cita.cliente_id = params.cliente_id;
            cita.tipo = tipo;
            if (tipo == 'visita') {
                cita.fecha_cita = params.fecha_cita;
                cita.hora = params.hora;
            }
            cita.observaciones = params.observaciones;

            try {
                const citaStored = await cita.save(); // save(): inserta el documento en la coleccion Citas
                return res.status(201).send({
                    status: 'success',
                    cita: citaStored
                });
            } catch (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'La cita no se ha guardado !!!'
                });
            }
        } else {
            return res.status(400).send({
                status: 'error',
                message: 'Los datos no son validos !!!'
            });
        }
    },

    // ---------------- METODO LISTAR CITAS (GET /api/citas) ----------------
    // opcional: ?estado=pendiente filtra por estado | ?last=N trae las N ultimas
    getCitas: async (req, res) => {
        var filtro = {};
        if (req.query.estado) {
            filtro.estado = req.query.estado;
        }

        var query = Cita.find(filtro);

        var last = parseInt(req.query.last || 0, 10);
        if (last > 0) {
            query.limit(last);
        }

        try {
            const citas = await query.sort('-_id');

            if (!citas || citas.length === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay citas para mostrar !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                citas
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al devolver las citas !!!'
            });
        }
    },

    // ---------------- METODO CITAS DE UN INMUEBLE (GET /api/citas-inmueble/:id) ----------------
    // "relacion manual": buscamos en Citas las que tengan ese inmueble_id
    getCitasInmueble: async (req, res) => {
        var inmuebleId = req.params.id;

        try {
            const citas = await Cita.find({ inmueble_id: inmuebleId }).sort('fecha_cita'); // de la mas proxima a la mas lejana

            if (!citas || citas.length === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Este inmueble no tiene citas !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                citas
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al devolver las citas del inmueble !!!'
            });
        }
    },

    // ---------------- METODO SOLICITUDES DE UN CLIENTE (GET /api/citas-cliente/:id) ----------------
    // la usa la app para mostrarle al cliente el estado y la respuesta de sus solicitudes
    getCitasCliente: async (req, res) => {
        var clienteId = req.params.id;

        try {
            const citas = await Cita.find({ cliente_id: clienteId }).sort('-_id'); // de la mas nueva a la mas vieja

            if (!citas || citas.length === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'Este cliente no tiene solicitudes !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                citas
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al devolver las solicitudes del cliente !!!'
            });
        }
    },

    // ---------------- METODO CONSULTAR UNA CITA POR ID (GET /api/cita/:id) ----------------
    getCita: async (req, res) => {
        var citaId = req.params.id;

        try {
            const cita = await Cita.findById(citaId);

            if (!cita) {
                return res.status(404).send({
                    status: 'error',
                    message: 'La cita no existe !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                cita
            });
        } catch (err) {
            return res.status(404).send({
                status: 'error',
                message: 'La cita no existe !!!'
            });
        }
    },

    // ---------------- METODO ACTUALIZAR CITA (PUT /api/cita/:id) ----------------
    // se usa sobre todo para cambiar el estado (confirmada, realizada, cancelada)
    update: async (req, res) => {
        var citaId = req.params.id;
        var params = req.body;

        try {
            var validate_estado = Object.keys(TRANSICIONES).includes(params.estado); // pendiente, confirmada, realizada o cancelada
        } catch (err) {
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        if (validate_estado) {
            try {
                const cita = await Cita.findById(citaId);

                if (!cita) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No existe la cita !!!'
                    });
                }

                // REGLA: solo se permiten los cambios de estado de la tabla TRANSICIONES
                // (si el estado no cambia, solo se actualiza la respuesta)
                var actual = cita.estado || 'pendiente';
                var nuevo = params.estado;
                if (nuevo != actual && !(TRANSICIONES[actual] || []).includes(nuevo)) {
                    return res.status(409).send({
                        status: 'error',
                        message: 'No se puede pasar una solicitud de ' + actual + ' a ' + nuevo + ' !!!'
                    });
                }

                // REGLA: una visita no se puede dar por realizada sin haberla confirmado antes
                if (nuevo == 'realizada' && actual == 'pendiente' && cita.tipo == 'visita') {
                    return res.status(409).send({
                        status: 'error',
                        message: 'Primero confirma la visita con el cliente antes de marcarla como realizada !!!'
                    });
                }

                // solo se cambian el estado y la respuesta (el resto lo envio el cliente y no se toca)
                var cambios = { estado: nuevo };
                if (params.respuesta != undefined) {
                    cambios.respuesta = String(params.respuesta).trim();
                }
                const citaUpdated = await Cita.findOneAndUpdate({ _id: citaId }, cambios, { returnDocument: 'after' });

                return res.status(200).send({
                    status: 'success',
                    cita: citaUpdated
                });
            } catch (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al actualizar la cita !!!'
                });
            }
        } else {
            return res.status(400).send({
                status: 'error',
                message: 'La validacion no es correcta !!!'
            });
        }
    },

    // ---------------- METODO ELIMINAR CITA (DELETE /api/cita/:id) ----------------
    delete: async (req, res) => {
        var citaId = req.params.id;

        try {
            const citaRemoved = await Cita.findOneAndDelete({ _id: citaId });

            if (!citaRemoved) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha borrado la cita, posiblemente no exista !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                cita: citaRemoved
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al borrar la cita !!!'
            });
        }
    }
};

// exportar el controlador para usarlo en las rutas
module.exports = controller;
