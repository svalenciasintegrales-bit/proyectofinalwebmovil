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
var os = require('os'); // os: modulo de node para saber la IP del computador en la red (para el codigo QR)

// esc: cambia los caracteres especiales de HTML para que un texto guardado (ej: el titulo) no se ejecute como codigo
function esc(texto) {
    return String(texto == null ? '' : texto)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// saca el id de un video de YouTube (11 letras/numeros) de cualquier enlace comun:
// youtube.com/watch?v=ID, youtu.be/ID, youtube.com/shorts/ID, youtube.com/embed/ID. Devuelve '' si no es valido.
function idYoutube(enlace) {
    var t = String(enlace || '').trim();
    var partes = t.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return partes ? partes[1] : '';
}

// convierte lo que escribio el administrador en el enlace normal de YouTube.
// devuelve '' si lo dejo vacio y null si escribio algo que no es de YouTube
function videoNormal(enlace) {
    if (!String(enlace || '').trim()) return '';
    var id = idYoutube(enlace);
    return id ? 'https://www.youtube.com/watch?v=' + id : null;
}

// borra del disco las fotos que ya no se usan (si no existen no pasa nada)
function borrarArchivos(nombres) {
    for (var nombre of nombres) {
        if (nombre) fs.unlink(path.resolve(__dirname, '../upload/inmuebles', path.basename(nombre)), () => { });
    }
}

// precio con puntos de miles. Ej: 250000000 -> $250.000.000
function precioTexto(valor) {
    return '$' + String(Math.round(Number(valor) || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

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

        // el video es opcional, pero si llega debe ser un enlace de YouTube
        var video = videoNormal(params.video);
        if (video === null) {
            return res.status(400).send({
                status: 'error',
                message: 'El enlace del video debe ser de YouTube !!!'
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
            inmueble.imagen = null; // las fotos se suben despues con /upload-image/:id (la primera queda de portada)
            inmueble.imagenes = [];
            inmueble.video = video;

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

    // ---------------- PAGINA DEL CODIGO QR (GET /api/qr/:codigo) ----------------
    // El QR del aviso lleva esta direccion. Al escanearlo, la camara del celular abre esta pagina:
    // - en Android salta sola a la app (enlace caracoli://inmueble/CODIGO) y la app muestra el inmueble
    // - si la app no esta instalada (o no es Android) se quedan los datos basicos y los telefonos
    paginaQr: async (req, res) => {
        var codigo = String(req.params.codigo || '').trim().toUpperCase();

        try {
            const inmueble = await Inmueble.findOne({ codigo: codigo });

            // intent://: Chrome en Android abre la app con ese enlace; si no la encuentra vuelve a esta pagina con ?app=0
            var volver = 'http://' + req.headers.host + '/api/qr/' + encodeURIComponent(codigo) + '?app=0';
            var enlaceApp = 'intent://inmueble/' + encodeURIComponent(codigo) +
                '#Intent;scheme=caracoli;package=com.example.caracoli;S.browser_fallback_url=' + encodeURIComponent(volver) + ';end';
            var abrirSolo = req.query.app != '0'; // con ?app=0 no se intenta abrir otra vez (evita un ciclo)
            var enlaceDirecto = 'caracoli://inmueble/' + encodeURIComponent(codigo); // otra forma, para lectores de QR que no aceptan intent://
            // ?app=0 = el celular volvio aqui porque no encontro la app (no instalada o version vieja sin el enlace del QR)
            var sinApp = !abrirSolo ? '<p class="aviso">No se pudo abrir la app Caracoli en este celular. ' +
                'Instala la versión más reciente de la app y vuelve a escanear el código. ' +
                'Si escaneaste con otra app de QR, abre el enlace en Chrome.</p>' : '';

            var cuerpo = '';
            if (!inmueble) {
                cuerpo = '<h1>Inmueble no encontrado</h1><p>El código <b>' + esc(codigo) + '</b> no existe en Caracoli Inmobiliaria.</p>';
            } else {
                var operacion = inmueble.operacion == 'arriendo' ? 'SE ARRIENDA' : 'SE VENDE';
                var foto = inmueble.imagen ? '<img src="/api/get-image/' + encodeURIComponent(inmueble.imagen) + '" alt="">' : '';
                var aviso = inmueble.estado != 'disponible' ? '<p class="aviso">Este inmueble ya no está disponible (' + esc(inmueble.estado) + ').</p>' : '';
                cuerpo = foto +
                    '<span class="etiqueta ' + (inmueble.operacion == 'arriendo' ? 'negra' : '') + '">' + operacion + '</span>' +
                    '<h1>' + esc(inmueble.titulo) + '</h1>' +
                    '<p class="lugar">' + esc(inmueble.barrio) + ', ' + esc(inmueble.ciudad) + ' · Código ' + esc(inmueble.codigo) + '</p>' +
                    '<p class="precio">' + precioTexto(inmueble.precio) + (inmueble.operacion == 'arriendo' ? ' /mes' : '') + '</p>' +
                    '<p>' + esc(inmueble.area) + ' m² · ' + esc(inmueble.habitaciones) + ' hab. · ' + esc(inmueble.banos) + ' baños</p>' +
                    aviso + sinApp +
                    '<a class="boton" href="' + esc(enlaceApp) + '">Abrir en la app Caracoli</a>' +
                    '<a class="enlace" href="' + esc(enlaceDirecto) + '">¿No se abrió? Toca aquí</a>';
            }

            var html = '<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">' +
                '<meta name="viewport" content="width=device-width, initial-scale=1">' +
                '<title>Caracoli Inmobiliaria · ' + esc(codigo) + '</title>' +
                '<style>body{margin:0;font-family:Arial,sans-serif;background:#f4f4f4;color:#111}' +
                '.marca{background:#e3141b;color:#fff;padding:14px 18px;font-weight:bold;letter-spacing:1px}' +
                '.caja{max-width:520px;margin:0 auto;padding:18px;background:#fff}' +
                'img{width:100%;border-radius:10px;margin-bottom:12px}' +
                '.etiqueta{background:#e3141b;color:#fff;font-weight:800;padding:4px 10px;font-size:13px;letter-spacing:1px}' +
                '.etiqueta.negra{background:#111}h1{font-family:Georgia,serif;font-size:24px;margin:12px 0 4px}' +
                '.lugar{color:#4a4a4a;margin:0 0 8px}.precio{color:#e3141b;font-family:Georgia,serif;font-size:26px;font-weight:bold;margin:6px 0}' +
                '.aviso{background:#fde8e8;color:#8b0000;padding:8px 10px;border-radius:6px}' +
                '.boton{display:block;text-align:center;background:#e3141b;color:#fff;text-decoration:none;font-weight:bold;padding:14px;border-radius:26px;margin:16px 0}' +
                '.enlace{display:block;text-align:center;color:#e3141b;font-weight:bold;margin-bottom:8px}' +
                '.pie{color:#4a4a4a;font-size:14px;text-align:center;padding:12px}</style></head><body>' +
                '<div class="marca">CARACOLI INMOBILIARIA</div><div class="caja">' + cuerpo + '</div>' +
                '<div class="pie">Cra 3 # 11-89 Centro, Cartago<br>Tel. 314 780 2883 · 310 650 1884</div>' +
                // en Android se abre la app sola al cargar la pagina
                (inmueble && abrirSolo ? '<script>if (/Android/i.test(navigator.userAgent)) { location.href = ' + JSON.stringify(enlaceApp) + '; }</script>' : '') +
                '</body></html>';

            return res.status(inmueble ? 200 : 404).type('html').send(html);
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al buscar el inmueble !!!'
            });
        }
    },

    // ---------------- IP DEL SERVIDOR EN LA RED (GET /api/red) ----------------
    // El panel la usa para armar la direccion del QR: con "localhost" el celular no encontraria el servidor
    red: (req, res) => {
        var ips = [];
        var redes = os.networkInterfaces();
        for (var nombre in redes) {
            for (var r of redes[nombre]) {
                if (r.family == 'IPv4' && !r.internal) ips.push(r.address); // IPv4 y que no sea 127.0.0.1
            }
        }
        return res.status(200).send({
            status: 'success',
            ips: ips,
            puerto: Number(process.env.PORT) || 3900
        });
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

                const actual = await Inmueble.findById(inmuebleId);
                if (!actual) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No existe el inmueble !!!'
                    });
                }

                // solo se cambian estos campos (asi nadie puede cambiar otros datos enviando campos de mas)
                var CAMPOS = ['codigo', 'titulo', 'tipo', 'operacion', 'precio', 'barrio', 'ciudad', 'area', 'habitaciones', 'banos', 'descripcion', 'estado'];
                var cambios = {};
                for (var campo of CAMPOS) {
                    if (params[campo] !== undefined) cambios[campo] = params[campo];
                }

                // video de YouTube: vacio lo quita, y si llega debe ser de YouTube
                if (params.video !== undefined) {
                    var video = videoNormal(params.video);
                    if (video === null) {
                        return res.status(400).send({
                            status: 'error',
                            message: 'El enlace del video debe ser de YouTube !!!'
                        });
                    }
                    cambios.video = video;
                }

                // portada: debe ser una de las fotos que ya tiene el inmueble
                if (params.imagen !== undefined && params.imagen !== actual.imagen) {
                    var fotos = actual.imagenes || [];
                    if (fotos.indexOf(params.imagen) < 0) {
                        return res.status(400).send({
                            status: 'error',
                            message: 'La portada debe ser una de las fotos del inmueble !!!'
                        });
                    }
                    cambios.imagen = params.imagen;
                }

                // findOneAndUpdate(condicion, datos nuevos, opciones)
                // { returnDocument: 'after' } -> devuelve el inmueble ya actualizado (sin esto devuelve el viejo)
                const inmuebleUpdated = await Inmueble.findOneAndUpdate({ _id: inmuebleId }, cambios, { returnDocument: 'after' });

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

            // se borran del disco sus fotos
            borrarArchivos([inmuebleRemoved.imagen].concat(inmuebleRemoved.imagenes || []));

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

    // ---------------- METODO SUBIR FOTOS (POST /api/upload-image/:id) ----------------
    // en postman: Body -> form-data -> key: file0 (tipo File) -> elegir una o varias fotos (maximo 10)
    // las fotos se AGREGAN al carrusel; si el inmueble no tenia portada, la primera queda de portada
    upload: async (req, res) => {

        // comprobar que llego al menos un archivo (multer ya reviso el formato y el tamaño en la ruta)
        var archivos = req.files || [];
        if (archivos.length == 0) {
            return res.status(400).send({
                status: 'error',
                message: 'No se ha subido ningun archivo (key file0) !!!'
            });
        }

        // nombres con los que multer guardo las fotos (ej: 1730600000000-123456.jpg)
        var nombres = [];
        for (var archivo of archivos) nombres.push(archivo.filename);

        // sacar el id del inmueble de la url
        var inmuebleId = req.params.id;

        // el id debe tener el formato de MongoDB, si no se responde 400
        if (!validator.isMongoId(String(inmuebleId))) {
            borrarArchivos(nombres); // se borran las fotos que se subieron
            return res.status(400).send({
                status: 'error',
                message: 'El id no es valido !!!'
            });
        }

        try {
            const inmueble = await Inmueble.findById(inmuebleId);

            if (!inmueble) {
                borrarArchivos(nombres); // si el inmueble no existe se borran las fotos que se subieron
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el inmueble !!!'
                });
            }

            // inmuebles viejos tienen solo la portada: se pasa tambien al carrusel
            var fotos = inmueble.imagenes || [];
            if (inmueble.imagen && fotos.indexOf(inmueble.imagen) < 0) fotos.unshift(inmueble.imagen);
            for (var nombre of nombres) fotos.push(nombre);

            inmueble.imagenes = fotos;
            if (!inmueble.imagen) inmueble.imagen = nombres[0]; // sin portada: la primera foto nueva
            const inmuebleUpdated = await inmueble.save();

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

    // ---------------- METODO BORRAR UNA FOTO (DELETE /api/inmueble/:id/imagen/:image) ----------------
    // la quita del carrusel y del disco; si era la portada, la siguiente foto queda de portada
    borrarImagen: async (req, res) => {
        var inmuebleId = req.params.id;
        var nombre = path.basename(String(req.params.image || ''));

        if (!validator.isMongoId(String(inmuebleId))) {
            return res.status(400).send({
                status: 'error',
                message: 'El id no es valido !!!'
            });
        }

        try {
            const inmueble = await Inmueble.findById(inmuebleId);
            if (!inmueble) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No existe el inmueble !!!'
                });
            }

            var fotos = inmueble.imagenes || [];
            if (inmueble.imagen && fotos.indexOf(inmueble.imagen) < 0) fotos.unshift(inmueble.imagen);
            if (fotos.indexOf(nombre) < 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'El inmueble no tiene esa foto !!!'
                });
            }

            var quedan = [];
            for (var foto of fotos) {
                if (foto != nombre) quedan.push(foto);
            }
            inmueble.imagenes = quedan;
            if (inmueble.imagen == nombre) inmueble.imagen = quedan.length > 0 ? quedan[0] : null;
            const inmuebleUpdated = await inmueble.save();
            borrarArchivos([nombre]);

            return res.status(200).send({
                status: 'success',
                inmueble: inmuebleUpdated
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al borrar la foto !!!'
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
