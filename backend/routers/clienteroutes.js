// =====================================================================
// routers/clienteroutes.js -> RUTAS de clientes
// =====================================================================

'use strict' // modo estricto de javascript

var express = require('express'); // cargamos express
var router = express.Router(); // Router: objeto de express para definir rutas
var validarId = require('./validarid'); // revisa que el :id tenga formato de MongoDB

// antes de cualquier ruta con :id se revisa el formato del id (si no sirve responde 400)
router.param('id', validarId);

// traemos el controlador donde esta la logica de clientes
var clienteController = require('../controller/clientecontroller');

// rutas de prueba (van antes de las rutas con :id)
router.post('/cliente/probando', clienteController.probando); // POST /api/cliente/probando
router.get('/cliente/test', clienteController.test); // GET  /api/cliente/test

// rutas del CRUD
router.post('/save-cliente', clienteController.save); // POST   /api/save-cliente -> guarda un cliente
router.get('/clientes', clienteController.getClientes); // GET    /api/clientes -> lista (?last=N)
router.get('/cliente/:id', clienteController.getCliente); // GET    /api/cliente/:id -> consulta uno
router.put('/cliente/:id', clienteController.update); // PUT    /api/cliente/:id -> actualiza
router.delete('/cliente/:id', clienteController.delete); // DELETE /api/cliente/:id -> elimina

// exportar las rutas para usarlas en app.js
module.exports = router;
