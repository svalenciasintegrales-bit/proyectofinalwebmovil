// =====================================================================
// routers/inmuebleroutes.js -> RUTAS: une cada URL con su metodo del controlador
// =====================================================================

'use strict' // modo estricto de javascript

var express = require('express'); // cargamos express
var router = express.Router(); // Router: objeto de express para definir rutas

var path = require('path');

// multer: recibe la foto (key file0) y la guarda en la carpeta upload/inmuebles
var multer = require('multer');
var EXTENSIONES = ['png', 'jpg', 'jpeg', 'gif', 'webp']; // formatos de imagen permitidos
var storage = multer.diskStorage({
    destination: './upload/inmuebles',
    // nombre unico: fecha + numero al azar + extension (ej: 1730600000000-123456.jpg)
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1000000) + path.extname(file.originalname).toLowerCase());
    }
});
var upload = multer({
    storage: storage,
    limits: { fileSize: (Number(process.env.MAX_FOTO_MB) || 5) * 1024 * 1024 }, // tamaño maximo (por defecto 5 MB)
    // solo deja pasar imagenes
    fileFilter: (req, file, cb) => {
        var ext = path.extname(file.originalname).replace('.', '').toLowerCase();
        if (EXTENSIONES.includes(ext) && file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('FORMATO'));
        }
    }
});

// middleware: sube la foto y, si multer da error (formato o tamaño), responde con un mensaje claro
var md_upload = (req, res, next) => {
    upload.array('file0', 10)(req, res, (err) => { // hasta 10 fotos por envio (key file0)
        if (!err) return next();
        var message = 'No se pudo subir la imagen !!!';
        if (err.message == 'FORMATO') message = 'La imagen debe ser ' + EXTENSIONES.join(', ') + ' !!!';
        if (err.code == 'LIMIT_UNEXPECTED_FILE') message = 'Se pueden subir maximo 10 fotos a la vez !!!';
        if (err.code == 'LIMIT_FILE_SIZE') message = 'La imagen pesa mas de ' + (Number(process.env.MAX_FOTO_MB) || 5) + ' MB !!!';
        return res.status(400).send({ status: 'error', message: message });
    });
};

// traemos el controlador donde esta la logica de inmuebles
var inmuebleController = require('../controller/inmueblecontroller');

// rutas de prueba (van antes de las rutas con :id para que no se confundan)
router.post('/inmueble/probando', inmuebleController.probando); // POST http://localhost:3900/api/inmueble/probando
router.get('/inmueble/test', inmuebleController.test); // GET  http://localhost:3900/api/inmueble/test

// rutas del CRUD (con el prefijo /api que se pone en app.js)
// :id -> parametro de la url, se lee en el controlador con req.params.id
router.post('/save-inmueble', inmuebleController.save); // POST   /api/save-inmueble -> guarda un inmueble
router.get('/inmuebles', inmuebleController.getInmuebles); // GET    /api/inmuebles -> lista (?last=N, ?operacion=venta)
router.get('/inmueble/:id', inmuebleController.getInmueble); // GET    /api/inmueble/:id -> consulta uno
router.put('/inmueble/:id', inmuebleController.update); // PUT    /api/inmueble/:id -> actualiza
router.delete('/inmueble/:id', inmuebleController.delete); // DELETE /api/inmueble/:id -> elimina

// rutas extra
router.get('/inmueble-codigo/:codigo', inmuebleController.getInmuebleCodigo); // GET /api/inmueble-codigo/CAR-102 -> la app busca por el codigo del letrero
router.post('/upload-image/:id', md_upload, inmuebleController.upload); // POST /api/upload-image/:id -> sube una o varias fotos (key file0, max 10)
router.delete('/inmueble/:id/imagen/:image', inmuebleController.borrarImagen); // DELETE /api/inmueble/:id/imagen/:image -> quita una foto del carrusel
router.get('/get-image/:image', inmuebleController.getImage); // GET  /api/get-image/:image -> devuelve la foto
router.get('/qr/:codigo', inmuebleController.paginaQr); // GET  /api/qr/CAR-102 -> pagina del codigo QR del aviso (abre la app)
router.get('/red', inmuebleController.red); // GET  /api/red -> IP del computador en la red (para armar el QR)
router.get('/search/:search', inmuebleController.search); // GET  /api/search/:search -> busca por titulo, barrio o tipo

// exportar las rutas para usarlas en app.js
module.exports = router;
