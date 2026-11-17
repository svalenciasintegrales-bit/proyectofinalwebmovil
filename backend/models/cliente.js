// =====================================================================
// models/cliente.js -> MODELO: molde de como se guarda un cliente en MongoDB
// =====================================================================

'use strict' // modo estricto de javascript

var mongoose = require('mongoose'); // libreria para trabajar con MongoDB
var Schema = mongoose.Schema; // Schema: sirve para definir la estructura de los documentos

// estructura de cada documento de la coleccion 'Clientes' (campo: tipo de dato)
// RESTRICCIONES DEL ESQUEMA: Mongoose las revisa al guardar y al actualizar (runValidators: true).
var ClienteSchema = Schema({

    nombre: { type: String, required: true, trim: true }, // nombre completo del cliente
    telefono: { type: String, required: true, trim: true }, // celular o telefono de contacto
    correo: { type: String, trim: true }, // correo electronico (opcional)
    fecha: { type: Date, default: Date.now } // fecha en que se registro

}, { timestamps: true }); // timestamps: Mongoose agrega createdAt (creado) y updatedAt (ultima modificacion)

// crear y exportar el modelo:
// 'Cliente' -> nombre del modelo | ClienteSchema -> estructura | 'Clientes' -> coleccion en la base de datos
module.exports = mongoose.model('Cliente', ClienteSchema, 'Clientes');
