// =====================================================================
// controller/clientecontroller.js -> CONTROLADOR: la logica de clientes
// CRUD completo: guardar, listar, consultar uno, actualizar y eliminar
// =====================================================================

'use strict' // modo estricto de javascript

var validator = require('validator'); // validator: libreria para validar datos
var Cliente = require('../models/cliente'); // traemos el modelo Cliente para usarlo aqui
var Cita = require('../models/cita'); // para saber si el cliente tiene solicitudes antes de borrarlo

// objeto controller: guarda todos los metodos de clientes
var controller = {

    // ---------------- METODO DE PRUEBA (POST /api/cliente/probando) ----------------
    probando: (req, res) => {
        return res.status(200).send({
            curso: 'web de desarrollo con node',
            proyecto: 'InmoConecta - Caracoli Inmobiliaria',
            modulo: 'clientes'
        });
    },

    // ---------------- METODO DE PRUEBA DEL CONTROLADOR (GET /api/cliente/test) ----------------
    test: (req, res) => {
        return res.status(200).send({
            message: 'soy la accion test de mi controlador de clientes'
        });
    },

    // ---------------- METODO GUARDAR CLIENTE (POST /api/save-cliente) ----------------
    save: async (req, res) => {
        // recoger los parametros que llegan en el body
        var params = req.body;

        // 1. validar que los datos obligatorios existan (nombre y telefono)
        if (!params.nombre || !params.telefono) {
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        // 2. validar con validator: nombre y telefono no vacios, correo valido (si lo envian)
        try {
            var validate_nombre = !validator.isEmpty(params.nombre);
            var validate_telefono = !validator.isEmpty(params.telefono);
            var validate_correo = !params.correo || validator.isEmail(params.correo); // el correo es opcional
        } catch (err) {
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        // 3. si los datos son validos se guarda el cliente
        if (validate_nombre && validate_telefono && validate_correo) {
            var cliente = new Cliente();

            cliente.nombre = params.nombre;
            cliente.telefono = params.telefono;
            cliente.correo = params.correo;

            try {
                const clienteStored = await cliente.save(); // save(): inserta el documento en la coleccion Clientes
                return res.status(201).send({
                    status: 'success',
                    cliente: clienteStored
                });
            } catch (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'El cliente no se ha guardado !!!'
                });
            }
        } else {
            return res.status(400).send({
                status: 'error',
                message: 'Los datos no son validos !!!'
            });
        }
    },

    // ---------------- METODO LISTAR CLIENTES (GET /api/clientes) ----------------
    getClientes: async (req, res) => {
        var query = Cliente.find({}); // find({}): todos los clientes

        // si en la url llega ?last=N se muestran solo los N ultimos
        var last = parseInt(req.query.last || 0, 10);
        if (last > 0) {
            query.limit(last);
        }

        try {
            const clientes = await query.sort('-_id'); // del mas nuevo al mas viejo

            if (!clientes || clientes.length === 0) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No hay clientes para mostrar !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                clientes
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al devolver los clientes !!!'
            });
        }
    },

    // ---------------- METODO CONSULTAR UN CLIENTE POR ID (GET /api/cliente/:id) ----------------
    getCliente: async (req, res) => {
        var clienteId = req.params.id;

        // el id debe tener el formato de MongoDB, si no se responde 400
        if (!validator.isMongoId(String(clienteId))) {
            return res.status(400).send({
                status: 'error',
                message: 'El id no es valido !!!'
            });
        }

        try {
            const cliente = await Cliente.findById(clienteId);

            if (!cliente) {
                return res.status(404).send({
                    status: 'error',
                    message: 'El cliente no existe !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                cliente
            });
        } catch (err) {
            return res.status(404).send({
                status: 'error',
                message: 'El cliente no existe !!!'
            });
        }
    },

    // ---------------- METODO ACTUALIZAR CLIENTE (PUT /api/cliente/:id) ----------------
    update: async (req, res) => {
        var clienteId = req.params.id;

        // el id debe tener el formato de MongoDB, si no se responde 400
        if (!validator.isMongoId(String(clienteId))) {
            return res.status(400).send({
                status: 'error',
                message: 'El id no es valido !!!'
            });
        }
        var params = req.body;

        try {
            var validate_nombre = !validator.isEmpty(params.nombre);
            var validate_telefono = !validator.isEmpty(params.telefono);
        } catch (err) {
            return res.status(400).send({
                status: 'error',
                message: 'Faltan datos por enviar !!!'
            });
        }

        if (validate_nombre && validate_telefono) {
            try {
                const clienteUpdated = await Cliente.findOneAndUpdate({ _id: clienteId }, params, { returnDocument: 'after' });

                if (!clienteUpdated) {
                    return res.status(404).send({
                        status: 'error',
                        message: 'No existe el cliente !!!'
                    });
                }

                return res.status(200).send({
                    status: 'success',
                    cliente: clienteUpdated
                });
            } catch (err) {
                return res.status(500).send({
                    status: 'error',
                    message: 'Error al actualizar el cliente !!!'
                });
            }
        } else {
            return res.status(400).send({
                status: 'error',
                message: 'La validacion no es correcta !!!'
            });
        }
    },

    // ---------------- METODO ELIMINAR CLIENTE (DELETE /api/cliente/:id) ----------------
    delete: async (req, res) => {
        var clienteId = req.params.id;

        // el id debe tener el formato de MongoDB, si no se responde 400
        if (!validator.isMongoId(String(clienteId))) {
            return res.status(400).send({
                status: 'error',
                message: 'El id no es valido !!!'
            });
        }

        try {
            // REGLA: si el cliente tiene solicitudes no se borra (se perderia el historial)
            const solicitudes = await Cita.countDocuments({ cliente_id: clienteId });
            if (solicitudes > 0) {
                return res.status(409).send({
                    status: 'error',
                    message: 'No se puede eliminar: el cliente tiene ' + solicitudes + ' solicitudes registradas.'
                });
            }

            const clienteRemoved = await Cliente.findOneAndDelete({ _id: clienteId });

            if (!clienteRemoved) {
                return res.status(404).send({
                    status: 'error',
                    message: 'No se ha borrado el cliente, posiblemente no exista !!!'
                });
            }

            return res.status(200).send({
                status: 'success',
                cliente: clienteRemoved
            });
        } catch (err) {
            return res.status(500).send({
                status: 'error',
                message: 'Error al borrar el cliente !!!'
            });
        }
    }
};

// exportar el controlador para usarlo en las rutas
module.exports = controller;
