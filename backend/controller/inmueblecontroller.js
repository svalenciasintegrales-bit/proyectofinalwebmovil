// =====================================================================
// controller/inmueblecontroller.js -> CONTROLADOR: la logica de inmuebles
// CRUD completo + subir foto + ver foto + buscar
// =====================================================================

'use strict' // modo estricto de javascript

var validator = require('validator'); // validator: libreria para validar datos (ej: que no esten vacios)
var fs = require('fs'); // fs: modulo de node para trabajar con archivos (borrar, comprobar si existe)
var path = require('path'); // path: modulo de node para trabajar con rutas de archivos
var Inmueble = require('../models/inmueble'); // traemos el modelo Inmueble para usarlo aqui
var Cita = require('../models/cita'); // para saber si un inmueble tiene solicitudes antes de borrarlo

// objeto controller: guarda todos los metodos de inmuebles
var controller = {

    // ---------------- METODO DE PRUEBA (POST /api/inmueble/probando) ----------------
    // sirve para comprobar que el servidor y las rutas funcionan
    probando: (req, res) => {
        return res.status(200).send({
            curso: 'web de desarrollo con node',
            proyecto: 'InmoConecta - Caracoli Inmobiliaria',
            modulo: 'inmuebles' // para saber de que controlador viene la respuesta
        });
    },

    // ---------------- METODO DE PRUEBA DEL CONTROLADOR (GET /api/inmueble/test) ----------------
    test: (req, res) => {
        return res.status(200).send({
            message: 'soy la accion test de mi controlador de inmuebles'
        });
    },

    // ---------------- METODO GUARDAR INMUEBLE (POST /api/save-inmueble) ----------------
    // async: el metodo espera (await) a que la base de datos responda
    save: async (req, res) => {
        // recoger los parametros que llegan en el body desde postman o angular
        var params = req.body;

        // 1. validar que los datos obligatorios existan (codigo, titulo, operacion y precio)
        if (!params.codigo || !params.titulo || !params.operacion || !params.precio) {
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        // 2. validar con validator: titulo y operacion no vacios, precio debe ser un numero
        try {
            var validate_titulo = !validator.isEmpty(params.titulo);
            var validate_operacion = !validator.isEmpty(params.operacion);
            var validate_precio = validator.isNumeric(String(params.precio)) && Number(params.precio) > 0; // REGLA: precio mayor que 0
        } catch (err) {
            // si validator falla (ej: llega un numero en vez de texto) devolvemos error
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        // 3. si los datos son validos se guarda el inmueble
        if (validate_titulo && validate_operacion && validate_precio) {
            // el codigo va en el letrero: se guarda en mayusculas y NO se puede repetir
            var codigo = String(params.codigo).trim().toUpperCase();
            const repetido = await Inmueble.findOne({ codigo: codigo });
            if (repetido) {
                return res.status(409).send({
                    status: 'error',
                    message: 'Ya existe un inmueble con el codigo ' + codigo + ' !!!'
                });
            }

            // crear el objeto a guardar con el modelo
            var inmueble = new Inmueble();

            // asignar los valores que llegaron al objeto
            inmueble.codigo = codigo;
            inmueble.titulo = params.titulo;
            inmueble.tipo = params.tipo;
            inmueble.operacion = params.operacion;
            inmueble.precio = params.precio;
            inmueble.barrio = params.barrio;
            inmueble.ciudad = params.ciudad;
            inmueble.area = params.area;
            inmueble.habitaciones = params.habitaciones;
            inmueble.banos = params.banos;
            inmueble.descripcion = params.descripcion;
            inmueble.imagen = null; // la foto se sube despues con /upload-image/:id

            // guardar en la base de datos
            try {
                const inmuebleStored = await inmueble.save(); // save(): inserta el documento en la coleccion Inmuebles
                return res.status(201).send({ // 201 = creado, devolvemos el inmueble guardado
                    status: 'success',
                    inmueble: inmuebleStored
                });
            } catch (err) {
                return res.status(404).send({ // si no se pudo guardar
                    status: 'error',
                    message: 'El inmueble no se ha guardado !!!'
                });
            }
        } else {
            // si algun dato llego vacio o el precio no es un numero
            return res.status(400).send({
                status: 'error',
                message: 'Los datos no son validos !!!'
            });
        }
    },

    // ---------------- METODO LISTAR INMUEBLES (GET /api/inmuebles) ----------------
    // opcional: ?last=N trae solo los N ultimos | ?operacion=venta o ?operacion=arriendo filtra
    getInmuebles: async (req, res) => {
        // armar el filtro: si llega ?operacion en la url se filtra por ese campo
        var filtro = {};
        if (req.query.operacion) {
            filtro.operacion = req.query.operacion;
        }

        // find(filtro): busca los inmuebles (llaves vacias = todos)
        var query = Inmueble.find(filtro);

        // si en la url llega ?last=N se muestran solo los N ultimos
        var last = parseInt(req.query.last || 0, 10); // convierte el texto a numero, si no llega vale 0
        if (last > 0) {
            query.limit(last); // limit: limita la cantidad de resultados
        }

        // ejecutar la busqueda
        try {
            const inmuebles = await query.sort('-_id'); // sort('-_id'): ordena del mas nuevo al mas viejo

            // si no hay inmuebles guardados
            if (!inmuebles || inmuebles.length === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay inmuebles para mostrar !!!'
                });
            }

            // si hay inmuebles se devuelven en formato JSON
            return res.status(200).send({
                status: 'success',
                inmuebles
            });
        } catch (err) {
            return res.status(500).send({ // 500 = error del servidor
                status: 'error',
                message: 'Error al devolver los inmuebles !!!'
            });
        }
    },

    // ---------------- METODO CONSULTAR UN INMUEBLE POR ID (GET /api/inmueble/:id) ----------------
    getInmueble: async (req, res) => {
        // recoger el id que llega en la url
        var inmuebleId = req.params.id;

        // el id debe tener el formato de MongoDB, si no se responde 400
        if (!validator.isMongoId(String(inmuebleId))) {
            return res.status(400).send({
                status: 'error',
                message: 'El id no es valido !!!'
            });
        }

        try {
            const inmueble = await Inmueble.findById(inmuebleId); // findById: busca un documento por su _id

            // si no existe un inmueble con ese id
            if (!inmueble) {
                return res.status(404).send({
                    status: 'error',
                    message: 'El inmueble no existe !!!'
                });
            }

            // si existe se devuelve en formato JSON
            return res.status(200).send({
                status: 'success',
                inmueble
            });
        } catch (err) {
            // entra aqui si el id no tiene un formato valido de MongoDB
            return res.status(404).send({
                status: 'error',
                message: 'El inmueble no existe !!!'
            });
        }
    },

    // ---------------- METODO CONSULTAR POR CODIGO (GET /api/inmueble-codigo/:codigo) ----------------
    // lo usa la app: el cliente escribe el codigo que ve en el letrero (ej: CAR-102) y aqui se busca el inmueble
    getInmuebleCodigo: async (req, res) => {
        var codigo = req.params.codigo;

        try {
            const inmueble = await Inmueble.findOne({ codigo: String(codigo).trim().toUpperCase() }); // findOne: el primero que cumpla la condicion

            if (!inmueble) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe un inmueble con ese codigo !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                inmueble
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al buscar el inmueble !!!'
            });
        }
    },

    // ---------------- METODO ACTUALIZAR INMUEBLE (PUT /api/inmueble/:id) ----------------
    update: async (req, res) => {
        // recoger el id que llega en la url
        var inmuebleId = req.params.id;

        // el id debe tener el formato de MongoDB, si no se responde 400
        if (!validator.isMongoId(String(inmuebleId))) {
            return res.status(400).send({
                status: 'error',
                message: 'El id no es valido !!!'
            });
        }

        // recoger los datos nuevos que llegan en el body
        var params = req.body;

        // validar con validator que los datos obligatorios no esten vacios
        try {
            var validate_titulo = !validator.isEmpty(params.titulo);
            var validate_operacion = !validator.isEmpty(params.operacion);
            var validate_precio = validator.isNumeric(String(params.precio)) && Number(params.precio) > 0; // REGLA: precio mayor que 0
        } catch (err) {
            // si no llegan los datos obligatorios validator falla
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        if (validate_titulo && validate_operacion && validate_precio) {
            try {
                // si llega un codigo, no puede ser el de OTRO inmueble ($ne = distinto de)
                if (params.codigo) {
                    params.codigo = String(params.codigo).trim().toUpperCase();
                    const repetido = await Inmueble.findOne({ codigo: params.codigo, _id: { $ne: inmuebleId } });
                    if (repetido) {
                        return res.status(409).send({
                            status: 'error',
                            message: 'Ya existe un inmueble con el codigo ' + params.codigo + ' !!!'
                        });
                    }
                }

                // findOneAndUpdate(condicion, datos nuevos, opciones)
                // { returnDocument: 'after' } -> devuelve el inmueble ya actualizado (sin esto devuelve el viejo)
                const inmuebleUpdated = await Inmueble.findOneAndUpdate({ _id: inmuebleId }, params, { returnDocument: 'after' });

                // si no encontro un inmueble con ese id
                if (!inmuebleUpdated) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No existe el inmueble !!!'
                    });
                }

                // si se actualizo se devuelve el inmueble con los datos nuevos
                return res.status(200).send({
                    status: 'success',
                    inmueble: inmuebleUpdated
                });
            } catch (err) {
                return res.status(500).send({ // 500 = error del servidor (ej: id con formato invalido)
                    status: 'error',
                    message: 'Error al actualizar el inmueble !!!'
                });
            }
        } else {
            // si algun dato llego vacio
            return res.status(400).send({
                status: 'error',
                message: 'La validacion no es correcta !!!'
            });
        }
    },

    // ---------------- METODO ELIMINAR INMUEBLE (DELETE /api/inmueble/:id) ----------------
    delete: async (req, res) => {
        // recoger el id que llega en la url
        var inmuebleId = req.params.id;

        // el id debe tener el formato de MongoDB, si no se responde 400
        if (!validator.isMongoId(String(inmuebleId))) {
            return res.status(400).send({
                status: 'error',
                message: 'El id no es valido !!!'
            });
        }

        try {
            // si el inmueble tiene solicitudes no se borra (se perderia el historial de los clientes)
            const solicitudes = await Cita.countDocuments({ inmueble_id: inmuebleId });
            if (solicitudes > 0) {
                return res.status(409).send({
                    status: 'error',
                    message: 'No se puede eliminar: el inmueble tiene ' + solicitudes + ' solicitudes. Cambia su estado a vendido o arrendado.'
                });
            }

            // findOneAndDelete: busca el inmueble por su id y lo borra de la coleccion Inmuebles
            const inmuebleRemoved = await Inmueble.findOneAndDelete({ _id: inmuebleId });

            // si no encontro un inmueble con ese id
            if (!inmuebleRemoved) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha borrado el inmueble, posiblemente no exista !!!'
                });
            }

            // si se borro se devuelve el inmueble que se elimino
            return res.status(200).send({
                status: 'success',
                inmueble: inmuebleRemoved
            });
        } catch (err) {
            return res.status(500).send({ // 500 = error del servidor (ej: id con formato invalido)
                status: 'error',
                message: 'Error al borrar el inmueble !!!'
            });
        }
    },

    // ---------------- METODO SUBIR FOTO (POST /api/upload-image/:id) ----------------
    // en postman: Body -> form-data -> key: file0 (tipo File) -> elegir la foto
    upload: async (req, res) => {

        // comprobar que llego un archivo (multer ya reviso el formato y el tamaño en la ruta)
        if (!req.file) {
            return res.status(400).send({
                status: 'error',
                message: 'No se ha subido ningun archivo (key file0) !!!'
            });
        }

        var file_name = req.file.filename; // nombre con el que multer guardo la foto (ej: 1730600000000-123456.jpg)

        // sacar el id del inmueble de la url
        var inmuebleId = req.params.id;

        // el id debe tener el formato de MongoDB, si no se responde 400
        if (!validator.isMongoId(String(inmuebleId))) {
            fs.unlink(req.file.path, () => { }); // se borra la foto que se subio
            return res.status(400).send({
                status: 'error',
                message: 'El id no es valido !!!'
            });
        }

        try {
            // buscar el inmueble, asignarle el nombre de la imagen y actualizarlo
            const inmuebleUpdated = await Inmueble.findOneAndUpdate(
                { _id: inmuebleId },
                { imagen: file_name },
                { returnDocument: 'after' }
            );

            if (!inmuebleUpdated) {
                fs.unlink(req.file.path, () => { }); // si el inmueble no existe se borra la foto que se subio
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el inmueble !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                inmueble: inmuebleUpdated
            });

        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al guardar la imagen del inmueble !!!'
            });
        }
    },

    // ---------------- METODO VER FOTO (GET /api/get-image/:image) ----------------
    // devuelve el archivo de la foto para mostrarlo en <img src="...">
    getImage: (req, res) => {
        var file = path.basename(req.params.image.trim()); // nombre del archivo que llega en la url
        var pathFile = path.resolve(__dirname, '../upload/inmuebles', file); // ruta completa del archivo

        // fs.access: comprueba si el archivo existe
        fs.access(pathFile, fs.constants.F_OK, (err) => {
            if (err) {
                return res.status(404).send({
                    status: 'error',
                    message: 'La imagen no existe !!!'
                });
            }

            return res.sendFile(pathFile); // envia la imagen
        });
    },

    // ---------------- METODO BUSCAR (GET /api/search/:search) ----------------
    // busca por titulo, barrio o tipo (ej: /api/search/centro)
    search: async (req, res) => {
        // sacar el texto a buscar
        var searchString = req.params.search;

        try {
            // $or: que cumpla cualquiera de las condiciones
            // $regex: que contenga el texto | $options: 'i' -> sin importar mayusculas o minusculas
            const inmuebles = await Inmueble.find({
                "$or": [
                    { "titulo": { "$regex": searchString, "$options": "i" } },
                    { "barrio": { "$regex": searchString, "$options": "i" } },
                    { "tipo": { "$regex": searchString, "$options": "i" } }
                ]
            }).sort('-_id');

            if (!inmuebles || inmuebles.length <= 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay inmuebles que coincidan con tu busqueda !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                inmuebles
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error en la peticion !!!'
            });
        }
    }
};

// exportar el controlador para usarlo en las rutas
module.exports = controller;
