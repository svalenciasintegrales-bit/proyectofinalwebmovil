// =====================================================================
// models/usuario.js -> MODELO: usuarios que entran al panel administrativo
// =====================================================================

'use strict' // modo estricto de javascript

var mongoose = require('mongoose'); // libreria para trabajar con MongoDB
var Schema = mongoose.Schema; // Schema: sirve para definir la estructura de los documentos

// estructura de cada documento de la coleccion 'Usuarios' (campo: tipo de dato)
var UsuarioSchema = Schema({

    nombre: String, // nombre de la persona (ej: asesor de la inmobiliaria)
    usuario: String, // nombre de usuario para iniciar sesion
    contrasena: String, // contraseña ENCRIPTADA (sal:resultado), nunca se guarda tal cual
    rol: { type: String, default: 'asesor' }, // 'administrador' (todo el panel) o 'asesor' (sin usuarios ni reportes)
    fecha: { type: Date, default: Date.now } // fecha en que se creo

}, { timestamps: true }); // timestamps: Mongoose agrega createdAt (creado) y updatedAt (ultima modificacion)

// crear y exportar el modelo:
// 'Usuario' -> nombre del modelo | UsuarioSchema -> estructura | 'Usuarios' -> coleccion en la base de datos
module.exports = mongoose.model('Usuario', UsuarioSchema, 'Usuarios');
