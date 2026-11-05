# InmoConecta: backend (API REST)

API de **Caracoli Inmobiliaria**, hecha con Node.js, Express y MongoDB. Sigue el mismo estilo del manual de clase y del taller de la biblioteca.

## Cómo arrancar

1. Prender MongoDB (si no está como servicio, en una terminal):
   ```bash
   "C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath C:\data\db
   ```
2. Cargar los datos de ejemplo (una sola vez, o cuando quieras empezar de cero):
   ```bash
   mongosh datos-prueba.js
   ```
3. Instalar paquetes (solo la primera vez) y prender la API:
   ```bash
   npm install
   npm start
   ```
   Debe salir: `servidor corriendo en http://localhost:3900`.

4. Probar en Postman: importar `postman/InmoConecta.postman_collection.json`.
   Las peticiones están en orden. Al **guardar**, el id queda solo en las variables de la colección.

Usuario del panel de ejemplo: `admin` / `caracoli2026`.

## Estructura

```
index.js        conexión a MongoDB (base InmoConecta) y servidor en el puerto 3900
app.js          body-parser, CORS y rutas con prefijo /api
models/         inmueble, cliente, cita, usuario
controller/     lógica de cada colección
routers/        URLs de cada colección
upload/inmuebles/  fotos subidas
datos-prueba.js datos de ejemplo para mongosh
postman/        colección de pruebas
```

## Rutas

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/save-inmueble` | Guarda un inmueble (titulo, operacion y precio son obligatorios) |
| GET | `/api/inmuebles` | Lista inmuebles. Opcional: `?last=N`, `?operacion=venta` o `?operacion=arriendo` |
| GET | `/api/inmueble/:id` | Consulta un inmueble |
| GET | `/api/inmueble-codigo/:codigo` | Busca por el código que aparece en el letrero (lo usa la app) |
| PUT | `/api/inmueble/:id` | Actualiza un inmueble |
| DELETE | `/api/inmueble/:id` | Elimina un inmueble |
| POST | `/api/upload-image/:id` | Sube la foto (form-data, key `file0`) |
| GET | `/api/get-image/:image` | Devuelve la foto |
| GET | `/api/search/:search` | Busca por título, barrio o tipo |
| POST | `/api/save-cliente` | Guarda un cliente (nombre y teléfono obligatorios) |
| GET | `/api/clientes` | Lista clientes |
| GET / PUT / DELETE | `/api/cliente/:id` | Consulta, actualiza o elimina un cliente |
| POST | `/api/save-cita` | Agenda una visita (inmueble_id, cliente_id, fecha_cita AAAA-MM-DD, hora) |
| GET | `/api/citas` | Lista citas. Opcional: `?estado=pendiente` |
| GET | `/api/citas-inmueble/:id` | Citas de un inmueble |
| GET / PUT / DELETE | `/api/cita/:id` | Consulta, cambia el estado o elimina una cita |
| POST | `/api/login` | Inicia sesión del panel |
| POST | `/api/save-usuario` | Crea un usuario del panel |
| GET | `/api/usuarios` | Lista usuarios (sin contraseña) |
