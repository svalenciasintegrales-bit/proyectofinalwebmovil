// =====================================================================
// controller/usuariocontroller.js -> CONTROLADOR: usuarios del panel y login
// Las contraseñas se guardan ENCRIPTADAS con el modulo crypto que ya trae Node (no se instala nada).
// =====================================================================

'use strict' // modo estricto de javascript

var validator = require('validator'); // validator: libreria para validar datos
var crypto = require('crypto'); // crypto: modulo de node para encriptar
var Usuario = require('../models/usuario'); // traemos el modelo Usuario para usarlo aqui

// ---------------- ENCRIPTAR CONTRASEÑAS ----------------
// se guarda "sal:resultado". La sal es un texto al azar distinto para cada usuario,
// asi dos usuarios con la misma contraseña quedan con resultados distintos.
function encriptar(contrasena) {
    var sal = crypto.randomBytes(8).toString('hex');
    var resultado = crypto.createHash('sha256').update(sal + contrasena).digest('hex');
    return sal + ':' + resultado;
}

// compara la contraseña escrita con la guardada
function comprobar(contrasena, guardada) {
    if (!guardada || guardada.indexOf(':') === -1) return false;
    var partes = guardada.split(':');
    var resultado = crypto.createHash('sha256').update(partes[0] + contrasena).digest('hex');
    return resultado === partes[1];
}

// objeto controller: guarda todos los metodos de usuarios
var controller = {

    // ---------------- METODO DE PRUEBA (POST /api/usuario/probando) ----------------
    probando: (req, res) => {
        return res.status(200).send({
            curso: 'web de desarrollo con node',
            proyecto: 'InmoConecta - Caracoli Inmobiliaria',
            modulo: 'usuarios'
        });
    },

    // ---------------- METODO GUARDAR USUARIO (POST /api/save-usuario) ----------------
    save: async (req, res) => {
        var params = req.body;

        if (!params.nombre || !params.usuario || !params.contrasena) {
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        try {
            var validate_nombre = !validator.isEmpty(params.nombre.trim());
            var validate_usuario = !validator.isEmpty(params.usuario.trim());
            var validate_contrasena = validator.isLength(params.contrasena, { min: 4 }); // minimo 4 caracteres
            var rol = params.rol || 'asesor';
            var validate_rol = rol == 'administrador' || rol == 'asesor';
        } catch (err) {
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        if (validate_nombre && validate_usuario && validate_contrasena && validate_rol) {
            try {
                // comprobar que no exista otro usuario con el mismo nombre de usuario
                const existe = await Usuario.findOne({ usuario: params.usuario.trim() });
                if (existe) {
                    return res.status(409).send({
                        status: 'error',
                        message: 'Ese usuario ya existe !!!'
                    });
                }

                var usuario = new Usuario();
                usuario.nombre = params.nombre.trim();
                usuario.usuario = params.usuario.trim();
                usuario.contrasena = encriptar(params.contrasena); // nunca se guarda la contraseña tal cual
                usuario.rol = rol;

                const usuarioStored = await usuario.save();
                return res.status(201).send({
                    status: 'success',
                    usuario: { _id: usuarioStored._id, nombre: usuarioStored.nombre, usuario: usuarioStored.usuario, rol: usuarioStored.rol } // sin la contraseña
                });
            } catch (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'El usuario no se ha guardado !!!'
                });
            }
        } else {
            return res.status(400).send({
                status: 'error',
                message: 'Los datos no son validos !!!'
            });
        }
    },

    // ---------------- METODO LISTAR USUARIOS (GET /api/usuarios) ----------------
    getUsuarios: async (req, res) => {
        try {
            // el segundo parametro de find es la proyeccion: -contrasena = no traer la contraseña
            const usuarios = await Usuario.find({}, '-contrasena').sort('-_id');

            if (!usuarios || usuarios.length === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay usuarios para mostrar !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                usuarios
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al devolver los usuarios !!!'
            });
        }
    },

    // ---------------- METODO LOGIN (POST /api/login) ----------------
    // angular envia usuario y contrasena; si coinciden devolvemos los datos para guardarlos en sessionStorage
    login: async (req, res) => {
        var params = req.body;

        if (!params.usuario || !params.contrasena) {
            return res.status(400).send({
                status: 'error',
                message: 'Escribe el usuario y la contraseña !!!'
            });
        }

        try {
            // 1. buscar el usuario | 2. comparar la contraseña escrita con la encriptada
            const usuario = await Usuario.findOne({ usuario: params.usuario });

            if (!usuario || !comprobar(params.contrasena, usuario.contrasena)) {
                return res.status(401).send({
                    status: 'error',
                    message: 'Usuario o contraseña incorrectos !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                usuario: { _id: usuario._id, nombre: usuario.nombre, usuario: usuario.usuario, rol: usuario.rol || 'administrador' }
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al iniciar sesion !!!'
            });
        }
    },

    // ---------------- METODO ELIMINAR USUARIO (DELETE /api/usuario/:id?actual=ID) ----------------
    // actual = id del usuario que tiene la sesion abierta (no se puede borrar a si mismo)
    delete: async (req, res) => {
        var usuarioId = req.params.id;

        // el id debe tener el formato de MongoDB, si no se responde 400
        if (!validator.isMongoId(String(usuarioId))) {
            return res.status(400).send({
                status: 'error',
                message: 'El id no es valido !!!'
            });
        }

        if (req.query.actual && req.query.actual == usuarioId) {
            return res.status(409).send({
                status: 'error',
                message: 'No puedes eliminar el usuario con el que iniciaste sesion !!!'
            });
        }

        try {
            // no dejar el panel sin ningun administrador
            const usuario = await Usuario.findById(usuarioId);
            if (usuario && usuario.rol == 'administrador') {
                const administradores = await Usuario.countDocuments({ rol: 'administrador' });
                if (administradores <= 1) {
                    return res.status(409).send({
                        status: 'error',
                        message: 'Debe quedar al menos un administrador !!!'
                    });
                }
            }

            const usuarioRemoved = await Usuario.findOneAndDelete({ _id: usuarioId });

            if (!usuarioRemoved) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha borrado el usuario, posiblemente no exista !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                usuario: { _id: usuarioRemoved._id, nombre: usuarioRemoved.nombre }
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al borrar el usuario !!!'
            });
        }
    }
};

// exportar el controlador para usarlo en las rutas
module.exports = controller;
