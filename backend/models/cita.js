// =====================================================================
// models/cita.js -> MODELO: molde de como se guarda una cita (visita a un inmueble)
// =====================================================================

'use strict' // modo estricto de javascript

var mongoose = require('mongoose'); // libreria para trabajar con MongoDB
var Schema = mongoose.Schema; // Schema: sirve para definir la estructura de los documentos

// estructura de cada documento de la coleccion 'Citas' (campo: tipo de dato)
var CitaSchema = Schema({

    inmueble_id: Schema.ObjectId, // id del inmueble por el que pregunta (de la coleccion 'Inmuebles')
    cliente_id: Schema.ObjectId, // id del cliente que hace la solicitud (de la coleccion 'Clientes')
    tipo: { type: String, default: 'visita' }, // 'visita' (agendar visita) o 'informacion' (pedir informacion)
    fecha_cita: Date, // dia de la visita (solo cuando tipo = visita)
    hora: String, // hora de la visita (ej: 10:00 a.m.)
    observaciones: String, // mensaje o pregunta del cliente
    respuesta: String, // respuesta del administrador (el cliente la ve en la app)
    estado: { type: String, default: 'pendiente' }, // pendiente, confirmada, realizada o cancelada
    fecha: { type: Date, default: Date.now } // fecha en que se agendo

}, { timestamps: true }); // timestamps: Mongoose agrega createdAt (creado) y updatedAt (ultima modificacion)

// crear y exportar el modelo:
// 'Cita' -> nombre del modelo | CitaSchema -> estructura | 'Citas' -> coleccion en la base de datos
module.exports = mongoose.model('Cita', CitaSchema, 'Citas');
