// android.js -> piezas repetidas de los mockups Android: barra de estado, barra de gestos
// e InmuebleCard (igual que ui/components/InmuebleCard.kt) con los datos de backend/datos-prueba.js.
var RAIZ = '../../../../../';

var INMUEBLES = {
  'CAR-101': { titulo: 'Casa nueva para estrenar', operacion: 'venta', precio: 250000000, barrio: 'Centro', area: 120, habitaciones: 3, banos: 2, imagen: 'car-101.jpg' },
  'CAR-102': { titulo: 'Apartamento con balcon', operacion: 'arriendo', precio: 1200000, barrio: 'El Prado', area: 75, habitaciones: 2, banos: 2, imagen: 'car-102.jpg' },
  'CAR-103': { titulo: 'Local comercial esquinero', operacion: 'arriendo', precio: 2500000, barrio: 'Centro', area: 60, habitaciones: 0, banos: 1, imagen: 'car-103.jpg' },
  'CAR-104': { titulo: 'Casa campestre con piscina', operacion: 'venta', precio: 480000000, barrio: 'Zaragoza', area: 300, habitaciones: 4, banos: 3, imagen: 'car-104.jpg' },
  'CAR-106': { titulo: 'Lote para construir', operacion: 'venta', precio: 95000000, barrio: 'Guadalupe', area: 200, habitaciones: 0, banos: 0, imagen: 'car-106.jpg' }
};

// igual que formatoPrecio() de model/Modelos.kt: 250000000 -> $250.000.000
function formatoPrecio(valor) {
  var t = String(valor), r = '';
  for (var i = 0; i < t.length; i++) {
    var faltan = t.length - i;
    r += t[i];
    if (faltan > 1 && (faltan - 1) % 3 === 0) r += '.';
  }
  return '$' + r;
}

// igual que datosCortos(): "120 m² · 3 hab. · 2 baños"
function datosCortos(x) {
  var t = x.area + ' m²';
  if (x.habitaciones > 0) t += ' · ' + x.habitaciones + ' hab.';
  if (x.banos > 0) t += ' · ' + x.banos + ' baños';
  return t;
}

function tarjetaInmueble(codigo, favorito) {
  var x = INMUEBLES[codigo];
  var venta = x.operacion === 'venta';
  return '<div class="inm">' +
    '<div class="foto" style="background-image:url(\'' + RAIZ + 'backend/upload/inmuebles/' + x.imagen + '\')">' +
      '<span class="etiqueta-op ' + x.operacion + '" style="top:12px">' + (venta ? 'SE VENDE' : 'SE ARRIENDA') + '</span>' +
      '<span class="corazon-btn"><i data-i="' + (favorito ? 'corazon' : 'corazonBorde') + '" data-s="24"></i></span>' +
    '</div>' +
    '<div class="datos">' +
      '<div class="precio">' + formatoPrecio(x.precio) + (venta ? '' : '<small> /mes</small>') + '</div>' +
      '<div class="title-l">' + x.titulo + '</div>' +
      '<div class="lugar-linea"><i data-i="lugar" data-s="16"></i>&nbsp;' + x.barrio + ', Cartago · ' + codigo + '</div>' +
      '<div class="datos-cortos">' + datosCortos(x) + '</div>' +
    '</div></div>';
}

document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.estado').forEach(function (e) {
    // <body class="sin-red">: celular sin internet (wifi apagado y sin datos)
    var sinRed = document.body.classList.contains('sin-red');
    e.innerHTML = '<span>9:41</span><span class="camara"></span>' +
      '<span class="iconos">' + (sinRed ? '<i data-i="sinRed" data-s="17"></i><i data-i="senal" data-s="15" style="opacity:.3"></i>'
                                        : '<i data-i="wifi" data-s="17"></i><i data-i="senal" data-s="15"></i>') +
      '<i data-i="bateria" data-s="17"></i></span>';
  });
  document.querySelectorAll('[data-inmueble]').forEach(function (e) {
    e.outerHTML = tarjetaInmueble(e.getAttribute('data-inmueble'), e.hasAttribute('data-fav'));
  });
  if (window.pintarIconos) pintarIconos();
});
