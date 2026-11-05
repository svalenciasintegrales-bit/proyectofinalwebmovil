// =====================================================================
// models/inmueble.js -> MODELO: molde de como se guarda un inmueble en MongoDB
// =====================================================================

'use strict' // modo estricto de javascript

var mongoose = require('mongoose'); // libreria para trabajar con MongoDB
var Schema = mongoose.Schema; // Schema: sirve para definir la estructura de los documentos

// estructura de cada documento de la coleccion 'Inmuebles' (campo: tipo de dato)
var InmuebleSchema = Schema({

    codigo: String, // codigo del inmueble que va en el letrero (ej: CAR-102)
    titulo: String, // nombre corto (ej: Casa amplia en el centro)
    tipo: String, // casa, apartamento, local, lote, finca
    operacion: String, // venta o arriendo
    precio: Number, // precio en pesos
    barrio: String, // barrio donde queda
    ciudad: String, // ciudad (ej: Cartago)
    area: Number, // area en metros cuadrados
    habitaciones: Number, // numero de habitaciones
    banos: Number, // numero de baños
    descripcion: String, // descripcion larga del inmueble
    imagen: String, // nombre del archivo de la foto (se sube con upload-image)
    estado: { type: String, default: 'disponible' }, // disponible, arrendado o vendido
    fecha: { type: Date, default: Date.now } // fecha en que se publico

}, { timestamps: true }); // timestamps: Mongoose agrega createdAt (creado) y updatedAt (ultima modificacion)

// crear y exportar el modelo:
// 'Inmueble' -> nombre del modelo | InmuebleSchema -> estructura | 'Inmuebles' -> coleccion en la base de datos
module.exports = mongoose.model('Inmueble', InmuebleSchema, 'Inmuebles');
