# Guía del proyecto final: lo que SÍ se usa

Regla: **si no lo vimos en clase, no se usa.** Esta guía sale de revisar:

| Fuente | Ruta | Para qué sirve |
|---|---|---|
| Manual API Node | `Downloads\Manual_API_Node_Explicado.docx`, `instalar nodejs.docx` | Cómo se arma el backend |
| Taller biblioteca (Web 2) | `trabajos septimo semestre\desarrollo web 2\taller web 2\biblioteca` | API Node con varias entidades |
| Proyecto node (Web 2) | `trabajos septimo semestre\desarrollo web 2\proyecto node\backend` | API del blog (artículos e imágenes) |
| Minimarket (Angular) | `C:\xampp\htdocs\minimarket\frontend` | Estructura Angular vista en clase |
| Web 1 | `trabajos sexto semestre\web 1` (angulartaller, formularios, caracoli) | Formularios y rutas en Angular |
| Android | `C:\Users\57314\AndroidStudioProjects` (MiRuta es el modelo) | Todo lo de la app |
| Lista verde y roja | `AndroidStudioProjects\PARCIAL_LO_QUE_SI_SE_PUEDE_USAR.md` | Qué se puede usar en Android |

---

## 1. Backend: Node.js + Express + MongoDB

### Instalación (tal como en el manual)
```bash
mkdir backend
cd backend
npm init -y
npm install --save express body-parser mongoose multer validator
npm install --save-dev nodemon
```
En `package.json`: `"scripts": { "start": "nodemon index.js" }`. Se arranca con `npm start`.

### Estructura
```
backend/
  index.js          conexión a MongoDB + app.listen
  app.js            express, body-parser, CORS manual, app.use('/api', rutas)
  models/           un archivo por colección (Schema de mongoose)
  controllers/      un objeto controller con métodos async
  routes/           express.Router()
  upload/inmuebles/ fotos subidas (la carpeta debe existir)
```

### Reglas del estilo
- `'use strict'`, `var` y `require`/`module.exports` (CommonJS).
- Base local: `mongodb://127.0.0.1:27017/<nombre_bd>`. Puerto 3900, como la biblioteca.
- **CORS hecho a mano** en `app.js`, con `res.header(...)`. No se usa el paquete `cors`.
- El controlador es un objeto `var controller = { probando, save, ... }`. Cada método es `async` con `try/catch` y `await`; nunca callbacks.
- Siempre `return res.status(N).send({ status: 'success', ... })` o `{ status: 'error', message: '...' }`. Códigos: 200, 400, 404 y 500.
- Validación con `validator`: `!validator.isEmpty(...)`, `validator.isNumeric(String(...))`, `isEmail`.
- Consultas: `save`, `find({}).sort('-_id').limit(n)`, `findById`, `findOneAndUpdate(..., {returnDocument:'after'})`, `findOneAndDelete`.
- Búsqueda: `$or` con `$regex` y `$options: 'i'`.
- Últimos N registros con `?last=N`. No usar parámetros opcionales `?` en la ruta, porque Express 5 no los acepta.
- Relaciones con `Schema.ObjectId` guardado a mano (por ejemplo `inmueble_id`). La "relación" se consulta con dos búsquedas, como en el taller de mongosh.
- Fotos: **Multer** (lo exigen los lineamientos del proyecto) con `diskStorage` en `upload/inmuebles`, `fileFilter` (png/jpg/jpeg/gif/webp) y `limits.fileSize` (5 MB). El archivo llega en `req.file` (key `file0`). Se sirven con `fs.access` + `res.sendFile`.
- Las rutas fijas (`/probando`, `/test`) van **antes** de las que llevan `:id`. Cada entidad va con su prefijo: `/api/inmueble/...`.
- Orden de trabajo: index.js → app.js → modelo → controlador con `probando` → rutas → probar en Postman → agregar un método a la vez y revisar en Compass.

### NO usar en el backend
JWT, bcrypt, dotenv, multer, paquete `cors`, `populate`, `aggregate`/`$lookup`, `import`/ES modules.

---

## 2. Frontend: Angular

Se sigue la estructura de **minimarket**, que es la vista en clase.

### Estructura
```
src/app/
  app.ts / app.html (<router-outlet />) / app.routes.ts / app.config.ts
  estructura/   main (layout), header, nav, footer
  guard/        validaruser-guard.ts
  modulos/      una carpeta por pantalla (inmuebles, citas, clientes, login, no-encontro…)
  servicios/    un archivo por entidad (inmueble.ts, cita.ts, cliente.ts, login.ts)
```
- Archivos sin sufijo `.component`/`.service`. La clase del componente es `Inmuebles` y la del servicio `Inmueble`. Si los nombres chocan, se importa con alias: `import { Login as LoginService }`.
- Todo en español: carpetas, métodos (`consultar`, `guardar`, `nuevo`, `cerrarModal`) y campos (`id_inmueble`).

### Reglas del estilo
- Componentes **standalone**. `app.config.ts` lleva `provideRouter(routes)` y `provideHttpClient()`.
- Servicios: `@Injectable({ providedIn: 'root' })`, `constructor(private http: HttpClient)` y la URL en una propiedad `url`. Métodos `consulta()`, `insertar(params)`, `editar(id, params)` y `eliminar(id)`.
- Componentes: `ngOnInit`, `.subscribe((res: any) => { ... })` y luego `this.cdr.detectChanges()`.
- Rutas: un layout `Main` con hijas protegidas por `canActivate: [validaruserGuard]`, `login` fuera del layout y `'**'` → `NoEncontro`.
- Guard de clase que revisa `sessionStorage.getItem('id')`. La sesión se guarda en **sessionStorage**.
- Formularios: template-driven con `FormsModule` y `[(ngModel)]` sobre un objeto, más una bandera de validación y `[ngClass]="{'is-invalid': ...}"`. También se vieron formularios reactivos (`FormGroup`, `FormControl`, `Validators`) en Web 1.
- Plantillas: `*ngFor`, `*ngIf` y `[ngClass]` como en minimarket. `@if`/`@for` también se vieron en Web 1.
- Pipes: `date`, `currency`, `number` y `slice`.
- UI: **Bootstrap 5.3 + bootstrap-icons**, modales de Bootstrap para crear o editar y CSS propio por componente.
- CRUD: una página con tabla y modal. `editingId` decide si se inserta o se edita.

### NO usar en Angular
Interceptores, JWT, signals, `inject()`, environments, Angular Material, Tailwind, librerías externas nuevas.
(El proyecto caracoli de Web 1 usa algunas de estas cosas, pero no aparecen en el material de clase.)

---

## 3. App: Android (Kotlin + Jetpack Compose)

Se sigue el modelo de **MiRuta**.

### Estructura
```
com.example.<app>/
  config/          object con const val
  model/           data class Inmueble(...), enum class
  data/local/      PreferencesManager (DataStore)
  data/repository/ InmuebleRepository (lista mutableListOf)
  viewmodel/       ViewModels con MutableStateFlow + asStateFlow
  navigation/      Routes.kt (object Routes) y AppNavigation.kt (NavHost)
  ui/screens/      Onboarding, Inicio, Detalle, Favoritos, Citas, Ajustes
  ui/components/   InmuebleCard
  ui/theme/
  MainActivity.kt  crea los ViewModel con ViewModelProvider.Factory
```

### Sí se usa
- **Compose y Material 3:** Scaffold, TopAppBar, Column/Row/Box, Card, LazyColumn/LazyRow, Button/IconButton/FAB, OutlinedTextField + KeyboardOptions, Switch, AlertDialog, CircularProgressIndicator, Icon (Icons.Default) e Image + painterResource.
- **Estado:** remember, rememberSaveable, mutableStateOf, LaunchedEffect y `collectAsStateWithLifecycle`.
- **MVVM:** ViewModel + `MutableStateFlow`/`asStateFlow`, `stateIn(viewModelScope…)`, Repository y Factory.
- **Corrutinas:** `viewModelScope.launch`, `suspend`, `withContext(Dispatchers.IO)`, `delay`; Flow con `map` y `first`.
- **Navegación:** NavHost, `object Routes` con `const val`, navArgument (Int/String), `popUpTo`, `popBackStack`.
- **DataStore Preferences:** onboarding visto, modo oscuro y nombre del usuario.
- **Onboarding:** HorizontalPager + Lottie (`res/raw`).
- **Listas:** `find`, `any`, `indexOfFirst`, `forEach` + `when` para filtrar, y `copy()` en data class.
- **Fotos de inmuebles:** imágenes en `res/drawable` mostradas con `painterResource`.

### NO usar en Android (lista roja)
Retrofit, JSON/Gson, Hilt, XML/Fragments/RecyclerView, LiveData, `sealed class`, `interface`, `.filter`/`.map` sobre listas, `apply`/`also`/`let` encadenados, NavigationBar, BottomSheet, Drawer, DropdownMenu, Checkbox, RadioButton, Slider, LazyVerticalGrid, AnimatedVisibility, Coil, cámara, GPS, permisos, notificaciones.

**Actualizado con los lineamientos oficiales del proyecto:** Room es obligatorio (copia del catálogo, de las solicitudes y borradores por enviar) y la app consume la API con `HttpURLConnection` + `org.json`. DataStore queda para el onboarding y las preferencias. Los DAO de Room se escriben como `abstract class` (no `interface`) para seguir el estilo de clase.

---

## 4. Cómo queda el plus con estas reglas

| Plus | Cómo se hace sin salirse de lo visto |
|---|---|
| Búsqueda por código del letrero | El cliente escribe en la app el código que ve en el letrero (ej: CAR-102). **No se usa QR**, porque no se ha visto en clase. |
| Simulador de cuota | Cálculo en TypeScript dentro del componente de detalle, con `[(ngModel)]` |
| Botón de WhatsApp | Un enlace `https://wa.me/<numero>?text=...` (caracoli de Web 1 ya tenía un `whatsapp-btn`) |
| App sin internet | Los datos viven en el celular (Repository + DataStore, o la BD local que confirme la profe) |
