// =====================================================================
// routers/validarid.js -> revisa que el :id de la url tenga formato de MongoDB
// asi un id mal escrito responde 400 (peticion invalida) y no 404 o 500
// =====================================================================

'use strict'

var validator = require('validator');

module.exports = (req, res, next, id) => {
    if (!validator.isMongoId(String(id))) {
        return res.status(400).send({
            status: 'error',
            message: 'El id ' + id + ' no es valido !!!'
        });
    }
    next();
};
