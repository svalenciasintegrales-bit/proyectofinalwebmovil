# InmoConecta · Caracoli Inmobiliaria

Proyecto integrador de **Móvil I** y **Desarrollo Web 2**. Cliente real: **Caracoli Inmobiliaria** (Cra 3 # 11-89 Centro, Cartago, Valle del Cauca).

**Proceso central:** un interesado pide información o agenda una visita a un inmueble desde el celular. La inmobiliaria la atiende en el panel web y le responde, y el cliente ve el estado y la respuesta en su app.

- **App Android (cliente):** muestra el catálogo, busca por el código del letrero (ej. CAR-102), sirve para pedir información o agendar visitas y muestra "Mis solicitudes" con la respuesta. Guarda los datos en **Room** y las preferencias en **DataStore**.
- **Panel web en Angular (inmobiliaria):** tiene el tablero, los inmuebles con foto, las solicitudes (responder y cambiar el estado), los clientes, los reportes y los usuarios.
- **API REST (Node.js + Express + Mongoose):** es la misma para las dos interfaces. Es la **única** parte que se conecta a **MongoDB**, que es la fuente de verdad.

```
Android (Compose, MVVM, Room, DataStore) ──┐
                                           ├──► API REST Express :3900 ──► MongoDB (InmoConecta)
Angular (panel del administrador) ─────────┘
```

| Carpeta | Qué es |
|---|---|
| `backend/` | API REST: rutas, controladores, modelos, Multer, colección de Postman y datos de prueba |
| `web-angular/` | Panel del administrador |
| `android/` | App del cliente (Kotlin + Jetpack Compose) |
| `documentacion/` | Requerimientos, pruebas, acta con el cliente y documento técnico |

---

## 1. Versiones usadas

| Herramienta | Versión |
|---|---|
| Node.js / npm | 22.17.1 / 10.9.2 |
| Express / Mongoose / Multer | 5 / 9 / 2 |
| MongoDB Server | 8.0.12 |
| Angular / Bootstrap / ng2-charts | 21.1 / 5.3.8 / 10 |
| Android Gradle Plugin / Kotlin / KSP | 8.7.3 / 2.0.21 / 2.0.21-1.0.28 |
| compileSdk / minSdk | 35 / 26 (Android 8.0) |
| Room / DataStore | 2.6.1 / 1.1.2 |
| JDK para Gradle | 17 |

## 2. Requisitos
- Node.js 22 o superior (la API usa `process.loadEnvFile()`, que ya viene en Node).
- MongoDB Community Server 8 con mongosh.
- Android Studio con el JDK 17. La app también se puede instalar desde el APK.
- Que el celular y el computador estén en la misma red WiFi, para la prueba con el celular.

## 3. Orden de ejecución

**1) MongoDB**, si no está instalado como servicio:
```bash
"C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe" --dbpath C:\data\db
```

**2) API**
```bash
cd backend
npm install
copy .env.example .env
mongosh datos-prueba.js
npm start
```
- `.env` trae `PORT`, `MONGO_URI` y `MAX_FOTO_MB`. Si no existe, se usan los valores por defecto: 3900, `mongodb://127.0.0.1:27017/InmoConecta` y 5 MB.
- `mongosh datos-prueba.js` **borra y vuelve a cargar** los datos ficticios: 6 inmuebles con foto, 6 clientes, 12 solicitudes y 2 usuarios.
- Al arrancar debe aparecer `servidor corriendo en http://localhost:3900`.

**3) Panel web**
```bash
cd web-angular
npm install --legacy-peer-deps
npm start
```
Abrir http://localhost:4200.

| Usuario | Contraseña | Rol |
|---|---|---|
| `admin` | `caracoli2026` | Administrador: todo el panel, incluidos los reportes y los usuarios |
| `asesor` | `asesor2026` | Asesor: tablero, inmuebles, solicitudes y clientes |

Son usuarios de **prueba**. Las contraseñas se guardan encriptadas (sha256 con sal).

**4) App Android**
1. Abrir `android/` en Android Studio y darle **Run**. También se puede instalar el APK.
2. Configurar la URL de la API en **Ajustes → Conexión con la inmobiliaria**:
   - En el emulador ya viene configurada: `http://10.0.2.2:3900/api`.
   - En el celular se escribe la IP del computador, por ejemplo `http://192.168.1.50:3900/api`. La IP aparece con `ipconfig` como "Dirección IPv4".
   - Si el celular no conecta, hay que permitir Node.js en el Firewall de Windows (redes privadas).

**Generar el APK:** en Android Studio, Build → Build App Bundle(s) / APK(s) → Build APK(s). Queda en `android/app/build/outputs/apk/debug/app-debug.apk`.

## 4. Flujo completo (prueba integral)
1. **Android:** el cliente abre un inmueble y agenda una visita. El servidor la guarda en MongoDB con el estado `pendiente`.
2. **MongoDB:** la solicitud aparece en la colección `Citas`, con `createdAt` y `updatedAt`.
3. **Angular:** la solicitud aparece en **Solicitudes**, con aviso en el menú. El asesor la responde y la pasa a `confirmada`.
4. **Android:** en **Mis solicitudes**, al tocar Actualizar, aparecen el estado `confirmada` y la respuesta.
5. **Reiniciar la app:**
   - Sin internet siguen el catálogo y las solicitudes, porque quedan guardados en Room.
   - No vuelve a salir la bienvenida y se conservan el modo oscuro y el servidor, porque quedan en DataStore.

**Estados de una solicitud** (el servidor rechaza los cambios no permitidos con el código 409):

```
pendiente ──► confirmada ──► realizada
    │              │
    └──────────────┴──► cancelada        (realizada y cancelada son finales)
```
- Una visita `pendiente` no puede pasar directo a `realizada`: primero se confirma.

## 5. Persistencia local en Android
| Dónde | Qué guarda |
|---|---|
| **Room** (`caracoli.db`) | La tabla `inmuebles` es la copia del catálogo y la tabla `solicitudes` es la copia de las solicitudes del cliente; las dos se reemplazan completas cada vez que hay conexión. La tabla `borradores` guarda las solicitudes que el servidor todavía no confirma: `pendiente` si no hubo conexión, y `error` si el servidor la rechazó, con el motivo |
| **DataStore** | Si ya se vio la bienvenida, el modo oscuro, la URL del servidor, el nombre y el celular del cliente, su id en MongoDB y los favoritos |

- Sin conexión, la app lo avisa y nunca muestra como enviada una solicitud que el servidor no confirmó.
- Los borradores pendientes se reintentan al abrir la app y en "Mis solicitudes".
- Si el servidor ya tenía esa solicitud, responde 409 y no se duplica.

## 6. Reglas de negocio (las valida el servidor)
1. **El código del letrero es único:** si se repite, responde 409.
2. **El precio debe ser mayor que 0.**
3. **La visita necesita fecha y hora, y la fecha no puede ser anterior a hoy.** Si se pide información, el mensaje es obligatorio.
4. **Solo se pueden pedir solicitudes de inmuebles que existen y están `disponible`s**, y solo de clientes que existen.
5. **Un cliente no puede tener dos solicitudes abiertas** (pendiente o confirmada) del mismo tipo para el mismo inmueble: responde 409.
6. **Las transiciones de estado son controladas** (ver el diagrama).
7. **No se puede eliminar** un inmueble ni un cliente que tenga solicitudes, ni el último administrador, ni el usuario con el que se inició sesión: responde 409.

## 7. API
- **Códigos de respuesta:**

  | Código | Cuándo |
  |---|---|
  | 200 | OK |
  | 201 | Creado |
  | 400 | Datos o id inválidos |
  | 401 | Login incorrecto |
  | 404 | No existe |
  | 409 | Regla de negocio o repetido |
  | 500 | Error del servidor |

- **Formato de las respuestas:** `{ status: 'success' | 'error', message, ... }`.
- **Fotos con Multer:** `POST /api/upload-image/:id`, con la key `file0` (una o varias fotos, máximo 10 por envío). Acepta png, jpg, jpeg, gif y webp, de máximo 5 MB cada una.
  - Las fotos se **agregan** al carrusel (`imagenes`). Si el inmueble no tenía portada, la primera queda de portada (`imagen`).
  - La portada se cambia con `PUT /api/inmueble/:id` enviando `imagen` (debe ser una de sus fotos).
  - `DELETE /api/inmueble/:id/imagen/:image` quita una foto; si era la portada, la siguiente queda de portada.
- **Video de YouTube (opcional):** campo `video` en guardar y actualizar. Se acepta youtube.com/watch, youtu.be y shorts, y se guarda como `https://www.youtube.com/watch?v=ID`. En la app se reproduce dentro del detalle (WebView con el reproductor de YouTube).
- **Actualizar:** `PUT /api/inmueble/:id` solo cambia los campos del inmueble (código, título, tipo, operación, precio, barrio, ciudad, área, habitaciones, baños, descripción, estado, video y portada); los demás campos que lleguen se ignoran.
- **Postman:** `backend/postman/InmoConecta.postman_collection.json` tiene 62 peticiones con pruebas, incluidas la página del QR y la IP del computador. Se ejecutan en orden.
  - Con newman pasan 113 de 116 verificaciones.
  - Las 3 restantes son las de la foto, que necesitan elegir el archivo a mano.

## 8. Limitaciones conocidas
- **Permisos:** los roles (administrador o asesor) los controla el panel; la API no verifica tokens. Por eso, el piloto se hace con **datos ficticios** en una red local.
- **Despliegue local:** la API y MongoDB corren en el computador de la inmobiliaria o del estudiante. No hay alojamiento en internet.
- **Actualización manual:** la app se actualiza con el botón Actualizar o al abrir la pantalla; no hay notificaciones push.
- **Respaldo:**
  - Para sacar una copia: `mongodump --db InmoConecta --out respaldo/`.
  - Para recuperarla: `mongorestore respaldo/`.
  - Las fotos están en `backend/upload/inmuebles`.

## 9. Lo que se usó que no se vio en clase (lo pide la rúbrica o es un plus aprobado)
Todo lo demás sigue lo visto en clase: el proyecto de Node y la biblioteca, el minimarket en Angular, y MiRuta y los demás proyectos de Android.

Las últimas cuatro filas (QR, enlace `caracoli://`, video de YouTube y migración de Room) son **plus**: no los pide la rúbrica, y se agregaron después de consultarlos con la profesora.

| Qué | Dónde | Lo que pide la rúbrica |
|---|---|---|
| Multer (en vez de connect-multiparty) | `backend/routers/inmuebleroutes.js` | Cargar imágenes con Multer, con formato y tamaño limitados |
| `.env` con `process.loadEnvFile()` | `backend/index.js` | Configuración por variables de entorno |
| `validator.isMongoId` | Cada controlador | Revisar identificadores inválidos o inexistentes |
| Códigos 201, 401 y 409 | Controladores | Códigos HTTP apropiados |
| `timestamps: true` | `backend/models` | Fechas de creación y actualización |
| `crypto` (sha256 con sal) | `usuariocontroller.js` | No guardar contraseñas en texto plano |
| `FormData` | `web-angular/src/app/servicios/inmueble.ts` | Subir y mostrar la imagen |
| Room | `android/.../data/local/room` | Persistencia local con Room |
| `HttpURLConnection` y `org.json` | `android/.../data/remote` | Que la app consuma la API compartida |
| Librería `qrcode` | `web-angular/src/app/modulos/aviso` | Aviso con código QR (adicional, propuesto al cliente) |
| Enlace `caracoli://` (intent-filter) | `AndroidManifest.xml` y `MainActivity.kt` | Que el QR abra el inmueble en la app |
| `WebView` con el reproductor de YouTube | `android/.../ui/components/Galeria.kt` | Video del inmueble dentro de la app |
| Migración de Room (versión 2) | `CaracoliDatabase.kt` | Agregar fotos y video sin borrar lo guardado en el celular |

## 10. Adicional: aviso con código QR
Se propuso al inicio, en `documentacion/ADICIONAL - Propuesta comercial inicial (con QR).pdf`.

- **Panel:** en **Inmuebles**, el botón del QR abre el aviso del inmueble: logo, SE VENDE / SE ARRIENDA, foto, datos básicos, teléfonos y el código QR. Con **Imprimir / Guardar PDF** se imprime o se guarda como PDF desde el navegador.
- **Qué lleva el QR:** `http://IP-del-computador:3900/api/qr/CAR-102`. La IP la toma el panel de la API (`GET /api/red`) y se puede corregir antes de imprimir.
- **Al escanearlo:** la cámara del celular abre esa página de la API y, en Android, la página abre sola la app con el enlace `caracoli://inmueble/CAR-102`. La app carga el catálogo y muestra el detalle del inmueble. Si la app no está instalada, la página muestra los datos básicos y los teléfonos.
- **Limitaciones:**
  - El celular debe estar en la misma red WiFi que el computador de la API.
  - Si la IP del computador cambia, hay que volver a imprimir el aviso.
  - Si el inmueble ya está vendido o arrendado, la app avisa que no está en el catálogo.
- La búsqueda por el **código del letrero** (ej. CAR-102) sigue funcionando para quien no quiera escanear.
