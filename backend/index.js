// =====================================================================
// index.js -> ARCHIVO PRINCIPAL: conecta a la base de datos y prende el servidor
// Se ejecuta con: npm start (nodemon index.js)
// =====================================================================

'use strict' // modo estricto: obliga a escribir javascript de forma mas correcta

// variables de entorno: process.loadEnvFile() (ya viene en Node 22) lee el archivo .env
// si no existe el .env se usan los valores por defecto de abajo
try { process.loadEnvFile(); } catch (err) { console.log('no hay archivo .env, se usan los valores por defecto'); }

var mongoose = require('mongoose'); // mongoose: libreria para trabajar con MongoDB desde node
var app = require('./app'); // traemos la configuracion de express que esta en app.js
var port = process.env.PORT || 3900; // puerto donde va a escuchar el servidor (http://localhost:3900)
var mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/InmoConecta';

// conectar a MongoDB (la direccion sale del .env: servidor, puerto y base de datos InmoConecta)
mongoose.connect(mongoUri).then(() => {

  // .then -> se ejecuta si la conexion salio bien
  console.log('conexion a la base de datos InmoConecta correcta');

  // solo si hay conexion prendemos el servidor en el puerto 3900
  app.listen(port, () => {

    console.log('servidor corriendo en http://localhost:' + port);
  });

})

  // .catch -> se ejecuta si la conexion fallo (por ejemplo mongo apagado)
  .catch(err => {

    console.error('error de conexion:', err)

  });
