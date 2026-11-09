// layout.js -> arma el menu lateral (nav) y el encabezado (header) del panel en cada mockup,
// igual que web-angular/src/app/estructura. Uso:
//   <body data-pagina="inmuebles"> ... <aside id="nav"></aside> ... <header id="header"></header>
// Tambien agrega los iconos que faltan en ../../iconos.js (sin tocar ese archivo).

// ---------- iconos extra (estilo Material, 24x24) ----------
Object.assign(ICONOS, {
  flechaDiag: 'M9 5v2h6.59L4 18.59 5.41 20 17 8.41V15h2V5z',
  calendarioCheck: 'M16.53 11.06L15.47 10l-4.88 4.88-2.12-2.12-1.06 1.06L10.59 17l5.94-5.94zM19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z',
  evento: 'M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z',
  fuego: 'M13.5.67s.74 2.65.74 4.8c0 2.06-1.35 3.73-3.41 3.73-2.07 0-3.63-1.67-3.63-3.73l.03-.36C5.21 7.51 4 10.62 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8C20 8.61 17.41 3.8 13.5.67zM11.71 19c-1.78 0-3.22-1.4-3.22-3.14 0-1.62 1.05-2.76 2.81-3.12 1.77-.36 3.6-1.21 4.62-2.58.39 1.29.59 2.65.59 4.04 0 2.65-2.15 4.8-4.8 4.8z',
  infoBorde: 'M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  xCirculo: 'M14.59 8L12 10.59 9.41 8 8 9.41 10.59 12 8 14.59 9.41 16 12 13.41 14.59 16 16 14.59 13.41 12 16 9.41 14.59 8zM12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z',
  checkDoble: 'M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z',
  checkCirculo: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  errorBorde: 'M11 15h2v2h-2zm0-8h2v6h-2zm.99-5C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z',
  documento: 'M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z',
  grafico: 'M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z',
  personaAjustes: 'M10.67 13.02c-.22-.01-.44-.02-.67-.02-2.42 0-4.68.67-6.61 1.82-.88.52-1.39 1.5-1.39 2.53V20h9.26c-.79-1.13-1.26-2.51-1.26-4 0-1.07.25-2.07.67-2.98zM10 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm10.75 4c0-.22-.03-.42-.06-.63l1.14-1.01-1-1.73-1.45.49c-.32-.27-.68-.48-1.08-.63L18 11h-2l-.3 1.49c-.4.15-.76.36-1.08.63l-1.45-.49-1 1.73 1.14 1.01c-.03.21-.06.41-.06.63s.03.42.06.63l-1.14 1.01 1 1.73 1.45-.49c.32.27.68.48 1.08.63L16 21h2l.3-1.49c.4-.15.76-.36 1.08-.63l1.45.49 1-1.73-1.14-1.01c.03-.21.06-.41.06-.63zM17 18c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
  archivoGrafico: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM9 19H7v-5h2v5zm4 0h-2v-7h2v7zm4 0h-2v-3h2v3zm-4-10V3.5L18.5 9H13z',
  escudoCandado: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm3 15H9v-4h.01v-.99c0-1.65 1.34-3 3-3s3 1.35 3 3V12h-.01v4zM12 9.5c-.83 0-1.5.67-1.5 1.5v1h3v-1c0-.83-.67-1.5-1.5-1.5z'
});

// ---------- datos de la sesion del mockup ----------
var SESION = { nombre: 'Administrador Caracoli', rol: 'administrador', pendientes: 5 };
var HOY = 'jueves, 5 de noviembre de 2026'; // toLocaleDateString('es-CO', ...) del dia del mockup

// titulo y descripcion de cada pagina (header.ts)
var PAGINAS = {
  tablero: { titulo: 'Tablero', descripcion: 'Resumen del negocio en tiempo real' },
  inmuebles: { titulo: 'Inmuebles', descripcion: 'Portafolio publicado en la app de clientes' },
  solicitudes: { titulo: 'Solicitudes', descripcion: 'Visitas y preguntas enviadas desde la app' },
  clientes: { titulo: 'Clientes', descripcion: 'Personas interesadas en los inmuebles' },
  reportes: { titulo: 'Reportes', descripcion: 'Información para la toma de decisiones' },
  usuarios: { titulo: 'Usuarios', descripcion: 'Personas del equipo con acceso al panel' }
};

function iniciales(nombre) {
  var partes = String(nombre).trim().split(' ');
  var t = '';
  for (var i = 0; i < partes.length && i < 2; i++) t += partes[i].charAt(0);
  return t.toUpperCase();
}

function armarNav(activa) {
  function item(ruta, icono, texto, extra) {
    return '<a class="' + (activa === ruta ? 'activo' : '') + '"><i data-i="' + icono + '"></i><span>' + texto + '</span>' + (extra || '') + '</a>';
  }
  var contador = SESION.pendientes > 0 ? '<b class="contador">' + SESION.pendientes + '</b>' : '';
  var admin = SESION.rol === 'administrador';
  return '' +
    '<div class="marca"><img src="../../../../../web-angular/public/img/logo-blanco.png" alt="Caracoli Inmobiliaria" class="logo-completo"></div>' +
    '<div class="usuario"><div class="avatar">' + iniciales(SESION.nombre) + '</div>' +
    '<div class="usuario-texto"><div class="usuario-nombre">' + SESION.nombre + '</div>' +
    '<div class="usuario-rol"><span class="punto"></span>' + (admin ? 'Administrador' : 'Asesor') + '</div></div></div>' +
    '<nav class="menu">' +
    '<div class="seccion">Principal</div>' +
    item('tablero', 'tablero', 'Tablero') +
    '<div class="seccion">Gestión comercial</div>' +
    item('inmuebles', 'edificios', 'Inmuebles') +
    item('solicitudes', 'bandeja', 'Solicitudes', contador) +
    item('clientes', 'personas', 'Clientes') +
    (admin ? '<div class="seccion">Administración</div>' +
      item('reportes', 'archivoGrafico', 'Reportes') +
      item('usuarios', 'personaAjustes', 'Usuarios') : '') +
    '<div class="seccion">Canales</div>' +
    '<div class="canal"><i data-i="celular"></i><span>App de clientes</span><em class="en-linea">En línea</em></div>' +
    '</nav>' +
    '<div class="pie">' +
    '<button><i data-i="contraer"></i><span>Contraer menú</span></button>' +
    '<button class="btn-salir"><i data-i="salir"></i><span>Cerrar sesión</span></button>' +
    '</div>';
}

function armarHeader(pagina) {
  var p = PAGINAS[pagina] || PAGINAS.tablero;
  return '' +
    '<div class="titulo-pagina">' +
    '<div class="ruta">Panel <i data-i="chevron"></i> ' + p.titulo + '</div>' +
    '<h1>' + p.titulo + '</h1>' +
    '<p>' + p.descripcion + '</p>' +
    '</div>' +
    '<div class="acciones">' +
    '<div class="fecha"><i data-i="calendario"></i>' + HOY + '</div>' +
    '<a class="campana"><i data-i="campana"></i>' + (SESION.pendientes > 0 ? '<span class="burbuja">' + SESION.pendientes + '</span>' : '') + '</a>' +
    '<a class="btn btn-rojo btn-sm d-inline-flex align-items-center gap-2"><i data-i="mas"></i>Publicar inmueble</a>' +
    '</div>';
}

(function () {
  var pagina = document.body.getAttribute('data-pagina') || 'tablero';
  var nav = document.getElementById('nav');
  var header = document.getElementById('header');
  if (nav) { nav.className = 'sidebar'; nav.innerHTML = armarNav(pagina); }
  if (header) { header.className = 'encabezado'; header.innerHTML = armarHeader(pagina); }

  // el lienzo tiene la altura fija del <meta name="tam"> (sin vh ni position:fixed)
  var meta = document.querySelector('meta[name="tam"]');
  var alto = meta ? parseInt(meta.content.split('x')[1], 10) : 900;
  var app = document.querySelector('.app-container');
  if (app) app.style.height = alto + 'px';

  // para medir la altura real del contenido al ajustar el lienzo
  window.addEventListener('load', function () {
    var h = document.querySelector('.encabezado');
    var c = document.querySelector('.content-wrapper');
    if (h && c) document.documentElement.setAttribute('data-alto', String(h.offsetHeight + c.offsetHeight));
  });
})();
