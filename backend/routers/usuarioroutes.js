// =====================================================================
// routers/usuarioroutes.js -> RUTAS de usuarios del panel y login
// =====================================================================

'use strict' // modo estricto de javascript

var express = require('express'); // cargamos express
var router = express.Router(); // Router: objeto de express para definir rutas
var validarId = require('./validarid'); // revisa que el :id tenga formato de MongoDB

// antes de cualquier ruta con :id se revisa el formato del id (si no sirve responde 400)
router.param('id', validarId);

// traemos el controlador donde esta la logica de usuarios
var usuarioController = require('../controller/usuariocontroller');

router.post('/usuario/probando', usuarioController.probando); // POST /api/usuario/probando
router.post('/save-usuario', usuarioController.save); // POST   /api/save-usuario -> crea un usuario del panel
router.get('/usuarios', usuarioController.getUsuarios); // GET    /api/usuarios -> lista (sin contraseñas)
router.post('/login', usuarioController.login); // POST   /api/login -> inicia sesion
router.delete('/usuario/:id', usuarioController.delete); // DELETE /api/usuario/:id -> elimina

// exportar las rutas para usarlas en app.js
module.exports = router;
