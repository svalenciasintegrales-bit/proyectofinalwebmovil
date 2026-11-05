// =====================================================================
// models/cliente.js -> MODELO: molde de como se guarda un cliente en MongoDB
// =====================================================================

'use strict' // modo estricto de javascript

var mongoose = require('mongoose'); // libreria para trabajar con MongoDB
var Schema = mongoose.Schema; // Schema: sirve para definir la estructura de los documentos

// estructura de cada documento de la coleccion 'Clientes' (campo: tipo de dato)
var ClienteSchema = Schema({

    nombre: String, // nombre completo del cliente
    telefono: String, // celular o telefono de contacto
    correo: String, // correo electronico
    fecha: { type: Date, default: Date.now } // fecha en que se registro

}, { timestamps: true }); // timestamps: Mongoose agrega createdAt (creado) y updatedAt (ultima modificacion)

// crear y exportar el modelo:
// 'Cliente' -> nombre del modelo | ClienteSchema -> estructura | 'Clientes' -> coleccion en la base de datos
module.exports = mongoose.model('Cliente', ClienteSchema, 'Clientes');
