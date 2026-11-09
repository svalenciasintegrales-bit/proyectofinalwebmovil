// =====================================================================
// app.js -> CONFIGURACION DE EXPRESS: crea la aplicacion, middlewares, CORS y rutas
// =====================================================================

'use strict' // modo estricto de javascript

// cargar modulos de node para crear el servidor y las rutas
var express = require('express'); // express: framework para crear el servidor y las rutas
var bodyParser = require('body-parser'); // body-parser: permite leer los datos que llegan por POST

// ejecutar express (crea la aplicacion http)
var app = express();

// cargar los ficheros de rutas de cada coleccion
var inmuebleRoutes = require('./routers/inmuebleroutes'); // rutas de inmuebles
var clienteRoutes = require('./routers/clienteroutes'); // rutas de clientes
var citaRoutes = require('./routers/citaroutes'); // rutas de citas
var usuarioRoutes = require('./routers/usuarioroutes'); // rutas de usuarios (login del panel)

// middlewares: se ejecutan antes de llegar a las rutas
app.use(bodyParser.urlencoded({ extended: false })); // lee datos enviados como formulario
app.use(bodyParser.json()); // lee datos enviados en formato JSON (lo que mandamos desde postman o angular)

// CORS: permite que Angular (http://localhost:4200) pueda hacer peticiones a esta api
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*'); // cualquier origen puede pedir datos
    res.header('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE'); // metodos permitidos
    res.header('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
    // el navegador manda primero una peticion OPTIONS para preguntar si puede, le decimos que si
    if (req.method === 'OPTIONS') return res.sendStatus(200);
    next();
});

// añadir el prefijo /api a todas las rutas -> ej: http://localhost:3900/api/inmuebles
app.use('/api', inmuebleRoutes);
app.use('/api', clienteRoutes);
app.use('/api', citaRoutes);
app.use('/api', usuarioRoutes);

// exportar app para usarla en index.js
module.exports = app;
