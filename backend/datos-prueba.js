// =====================================================================
// datos-prueba.js -> DATOS DE PRUEBA para la base de datos InmoConecta
// Se ejecuta con mongosh (igual que en el taller de MongoDB):
//   mongosh datos-prueba.js
// OJO: borra lo que haya en las colecciones y vuelve a cargar los ejemplos.
// Los inmuebles son de ejemplo; cambiarlos por los reales de Caracoli Inmobiliaria.
// Las fotos car-101.jpg a car-106.jpg son fotos reales de Caracoli (casa nueva y lotes)
// y ya estan en upload/inmuebles; no borrar esos archivos.
// =====================================================================

db = db.getSiblingDB('InmoConecta'); // usar (o crear) la base de datos InmoConecta

// limpiar las colecciones para empezar desde cero
db.Inmuebles.deleteMany({});
db.Clientes.deleteMany({});
db.Citas.deleteMany({});
db.Usuarios.deleteMany({});

// ---------------- USUARIOS DEL PANEL ----------------
// las contraseñas se guardan encriptadas igual que en la api (usuariocontroller.js): "sal:sha256(sal + contraseña)"
var crypto = require('crypto');
function encriptar(contrasena) {
  var sal = crypto.randomBytes(8).toString('hex');
  return sal + ':' + crypto.createHash('sha256').update(sal + contrasena).digest('hex');
}
db.Usuarios.insertMany([
  { nombre: 'Administrador Caracoli', usuario: 'admin', contrasena: encriptar('caracoli2026'), rol: 'administrador', fecha: new Date() },
  { nombre: 'Asesor Comercial', usuario: 'asesor', contrasena: encriptar('asesor2026'), rol: 'asesor', fecha: new Date() }
]);

// ---------------- INMUEBLES DE EJEMPLO ----------------
db.Inmuebles.insertMany([
  { codigo: 'CAR-101', titulo: 'Casa nueva para estrenar', tipo: 'casa', operacion: 'venta', precio: 250000000, barrio: 'Centro', ciudad: 'Cartago', area: 120, habitaciones: 3, banos: 2, descripcion: 'Casa nueva de dos niveles con cocina integral con isla, baños con división en vidrio, habitaciones con clóset y buena iluminación natural.', imagen: 'car-101.jpg', estado: 'disponible', fecha: new Date() },
  { codigo: 'CAR-102', titulo: 'Apartamento con balcon', tipo: 'apartamento', operacion: 'arriendo', precio: 1200000, barrio: 'El Prado', ciudad: 'Cartago', area: 75, habitaciones: 2, banos: 2, descripcion: 'Apartamento en tercer piso, con balcon y parqueadero.', imagen: 'car-102.jpg', estado: 'disponible', fecha: new Date() },
  { codigo: 'CAR-103', titulo: 'Local comercial esquinero', tipo: 'local', operacion: 'arriendo', precio: 2500000, barrio: 'Centro', ciudad: 'Cartago', area: 60, habitaciones: 0, banos: 1, descripcion: 'Local en esquina con alto flujo de personas.', imagen: 'car-103.jpg', estado: 'disponible', fecha: new Date() },
  { codigo: 'CAR-104', titulo: 'Casa campestre con piscina', tipo: 'casa', operacion: 'venta', precio: 480000000, barrio: 'Zaragoza', ciudad: 'Cartago', area: 300, habitaciones: 4, banos: 3, descripcion: 'Casa campestre con piscina, zona BBQ y amplias zonas verdes.', imagen: 'car-104.jpg', estado: 'disponible', fecha: new Date() },
  { codigo: 'CAR-105', titulo: 'Apartaestudio amoblado', tipo: 'apartamento', operacion: 'arriendo', precio: 850000, barrio: 'Santa Ana', ciudad: 'Cartago', area: 35, habitaciones: 1, banos: 1, descripcion: 'Apartaestudio amoblado, ideal para estudiantes.', imagen: 'car-105.jpg', estado: 'arrendado', fecha: new Date() },
  { codigo: 'CAR-106', titulo: 'Lote para construir', tipo: 'lote', operacion: 'venta', precio: 95000000, barrio: 'Guadalupe', ciudad: 'Cartago', area: 200, habitaciones: 0, banos: 0, descripcion: 'Lote plano en sector de nuevas casas, con vía de acceso y servicios públicos disponibles.', imagen: 'car-106.jpg', estado: 'disponible', fecha: new Date() }
]);

// funcion de ayuda: fecha de hace N dias (para que el tablero muestre actividad de las ultimas semanas)
function haceDias(n) { return new Date(Date.now() - n * 24 * 60 * 60 * 1000); }
// fecha de dentro de N dias, sin hora (para las visitas agendadas)
function enDias(n) { var d = new Date(Date.now() + n * 24 * 60 * 60 * 1000); return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); }

// ---------------- CLIENTES DE EJEMPLO ----------------
// son los clientes que se registran desde la app movil al enviar una solicitud
db.Clientes.insertMany([
  { nombre: 'Laura Gomez', telefono: '3001234567', correo: 'laura@correo.com', fecha: haceDias(13) },
  { nombre: 'Andres Rios', telefono: '3109876543', correo: 'andres@correo.com', fecha: haceDias(11) },
  { nombre: 'Valentina Ospina', telefono: '3157778899', correo: 'valentina@correo.com', fecha: haceDias(8) },
  { nombre: 'Carlos Mejia', telefono: '3204445566', correo: '', fecha: haceDias(6) },
  { nombre: 'Daniela Restrepo', telefono: '3012223344', correo: 'daniela@correo.com', fecha: haceDias(3) },
  { nombre: 'Jorge Castaño', telefono: '3186667788', correo: '', fecha: haceDias(1) }
]);

// ---------------- SOLICITUDES DE EJEMPLO (coleccion Citas) ----------------
// tipo 'visita' = agendar visita | tipo 'informacion' = pedir informacion
// "relacion manual": primero buscamos los ids y despues los usamos en la solicitud
function idInmueble(codigo) { return db.Inmuebles.findOne({ codigo: codigo })._id; }
function idCliente(nombre) { return db.Clientes.findOne({ nombre: nombre })._id; }

db.Citas.insertMany([
  { inmueble_id: idInmueble('CAR-101'), cliente_id: idCliente('Laura Gomez'), tipo: 'visita', fecha_cita: enDias(2), hora: '10:00 a.m.', observaciones: 'Quiero ver la cocina y el segundo piso', respuesta: '', estado: 'pendiente', fecha: haceDias(1) },
  { inmueble_id: idInmueble('CAR-102'), cliente_id: idCliente('Andres Rios'), tipo: 'visita', fecha_cita: enDias(3), hora: '3:00 p.m.', observaciones: '', respuesta: 'Lo esperamos en la portería del edificio.', estado: 'confirmada', fecha: haceDias(4) },
  { inmueble_id: idInmueble('CAR-101'), cliente_id: idCliente('Valentina Ospina'), tipo: 'informacion', observaciones: '¿Aceptan crédito hipotecario con el Fondo Nacional del Ahorro?', respuesta: '', estado: 'pendiente', fecha: haceDias(0) },
  { inmueble_id: idInmueble('CAR-104'), cliente_id: idCliente('Carlos Mejia'), tipo: 'informacion', observaciones: '¿El precio es negociable?', respuesta: 'Sí, el propietario recibe ofertas. Lo llamamos hoy.', estado: 'confirmada', fecha: haceDias(5) },
  { inmueble_id: idInmueble('CAR-106'), cliente_id: idCliente('Jorge Castaño'), tipo: 'visita', fecha_cita: enDias(5), hora: '9:00 a.m.', observaciones: 'Voy con un maestro de obra', respuesta: '', estado: 'pendiente', fecha: haceDias(1) },
  { inmueble_id: idInmueble('CAR-103'), cliente_id: idCliente('Daniela Restrepo'), tipo: 'informacion', observaciones: '¿Qué uso de suelo tiene el local?', respuesta: 'Uso comercial, apto para restaurante o tienda.', estado: 'realizada', fecha: haceDias(3) },
  { inmueble_id: idInmueble('CAR-101'), cliente_id: idCliente('Andres Rios'), tipo: 'visita', fecha_cita: enDias(-2), hora: '11:00 a.m.', observaciones: '', respuesta: 'Visita realizada, quedó interesado.', estado: 'realizada', fecha: haceDias(9) },
  { inmueble_id: idInmueble('CAR-105'), cliente_id: idCliente('Laura Gomez'), tipo: 'visita', fecha_cita: enDias(-5), hora: '4:00 p.m.', observaciones: '', respuesta: 'El inmueble ya fue arrendado.', estado: 'cancelada', fecha: haceDias(12) },
  { inmueble_id: idInmueble('CAR-104'), cliente_id: idCliente('Valentina Ospina'), tipo: 'visita', fecha_cita: enDias(1), hora: '2:00 p.m.', observaciones: 'Quiero conocer la piscina', respuesta: 'Confirmada, la recogemos en la entrada de Zaragoza.', estado: 'confirmada', fecha: haceDias(2) },
  { inmueble_id: idInmueble('CAR-102'), cliente_id: idCliente('Daniela Restrepo'), tipo: 'informacion', observaciones: '¿Incluye parqueadero?', respuesta: '', estado: 'pendiente', fecha: haceDias(0) },
  { inmueble_id: idInmueble('CAR-106'), cliente_id: idCliente('Carlos Mejia'), tipo: 'informacion', observaciones: '¿Tiene escrituras al día?', respuesta: 'Sí, escrituras al día y libre de gravámenes.', estado: 'realizada', fecha: haceDias(7) },
  { inmueble_id: idInmueble('CAR-101'), cliente_id: idCliente('Jorge Castaño'), tipo: 'informacion', observaciones: '¿Cuánto es la administración?', respuesta: '', estado: 'pendiente', fecha: haceDias(2) }
]);

// mostrar cuantos documentos quedaron en cada coleccion
print('Inmuebles: ' + db.Inmuebles.countDocuments());
print('Clientes: ' + db.Clientes.countDocuments());
print('Citas: ' + db.Citas.countDocuments());
print('Usuarios: ' + db.Usuarios.countDocuments());
