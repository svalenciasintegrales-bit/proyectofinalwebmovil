// =====================================================================
// routers/citaroutes.js -> RUTAS de citas
// =====================================================================

'use strict' // modo estricto de javascript

var express = require('express'); // cargamos express
var router = express.Router(); // Router: objeto de express para definir rutas

// traemos el controlador donde esta la logica de citas
var citaController = require('../controller/citacontroller');

// rutas de prueba (van antes de las rutas con :id)
router.post('/cita/probando', citaController.probando); // POST /api/cita/probando
router.get('/cita/test', citaController.test); // GET  /api/cita/test

// rutas del CRUD
router.post('/save-cita', citaController.save); // POST   /api/save-cita -> agenda una visita
router.get('/citas', citaController.getCitas); // GET    /api/citas -> lista (?estado=pendiente, ?last=N)
router.get('/citas-inmueble/:id', citaController.getCitasInmueble); // GET /api/citas-inmueble/:id -> citas de un inmueble
router.get('/citas-cliente/:id', citaController.getCitasCliente); // GET /api/citas-cliente/:id -> solicitudes de un cliente (app)
router.get('/cita/:id', citaController.getCita); // GET    /api/cita/:id -> consulta una
router.put('/cita/:id', citaController.update); // PUT    /api/cita/:id -> cambia el estado
router.delete('/cita/:id', citaController.delete); // DELETE /api/cita/:id -> elimina

// exportar las rutas para usarlas en app.js
module.exports = router;
