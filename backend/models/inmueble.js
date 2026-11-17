// =====================================================================
// models/inmueble.js -> MODELO: molde de como se guarda un inmueble en MongoDB
// =====================================================================

'use strict' // modo estricto de javascript

var mongoose = require('mongoose'); // libreria para trabajar con MongoDB
var Schema = mongoose.Schema; // Schema: sirve para definir la estructura de los documentos

// estructura de cada documento de la coleccion 'Inmuebles' (campo: tipo de dato)
// RESTRICCIONES DEL ESQUEMA: Mongoose las revisa antes de guardar (save) y al actualizar (runValidators: true),
// asi un dato malo no entra aunque llegue por un camino distinto al controlador.
// required = obligatorio | enum = solo esos valores | min = valor minimo | trim = quita espacios | unique = indice unico en MongoDB
var InmuebleSchema = Schema({

    codigo: { type: String, required: true, trim: true, unique: true }, // codigo del letrero (ej: CAR-102). unique: MongoDB no deja repetirlo
    titulo: { type: String, required: true, trim: true }, // nombre corto (ej: Casa amplia en el centro)
    tipo: { type: String, enum: ['casa', 'apartamento', 'local', 'lote', 'finca'] }, // solo esos tipos
    operacion: { type: String, required: true, enum: ['venta', 'arriendo'] }, // venta o arriendo
    precio: { type: Number, required: true, min: 1 }, // precio en pesos, mayor que 0
    barrio: String, // barrio donde queda
    ciudad: String, // ciudad (ej: Cartago)
    area: { type: Number, min: 0 }, // area en metros cuadrados (no negativa)
    habitaciones: { type: Number, min: 0 }, // numero de habitaciones (no negativo)
    banos: { type: Number, min: 0 }, // numero de baños (no negativo)
    descripcion: String, // descripcion larga del inmueble
    imagen: String, // PORTADA: nombre del archivo de la foto principal (la que sale en la tarjeta y en el aviso)
    imagenes: [String], // todas las fotos del inmueble (carrusel), en el orden en que se subieron
    video: String, // enlace de YouTube (ej: https://www.youtube.com/watch?v=XXXXXXXXXXX) o vacio
    estado: { type: String, default: 'disponible', enum: ['disponible', 'arrendado', 'vendido'] }, // disponible, arrendado o vendido
    fecha: { type: Date, default: Date.now } // fecha en que se publico

}, { timestamps: true }); // timestamps: Mongoose agrega createdAt (creado) y updatedAt (ultima modificacion)

// crear y exportar el modelo:
// 'Inmueble' -> nombre del modelo | InmuebleSchema -> estructura | 'Inmuebles' -> coleccion en la base de datos
module.exports = mongoose.model('Inmueble', InmuebleSchema, 'Inmuebles');
