// bpmn.js -> elementos de un diagrama de procesos (notacion BPMN) sobre el motor de uml.js.
// Se carga DESPUES de uml.js y usa sus funciones (_caja, rel, dibujar).
//
//   carril(id, {x, y, w, h, titulo, sub, tono})   franja de un participante (actor o sistema)
//   tarea(id, {x, y, w, h, texto, tono})          actividad (rectangulo redondeado)
//   evento(id, {x, y, tipo, texto})               circulo: tipo 'inicio' | 'fin' | 'intermedio' | 'mensaje'
//   compuerta(id, {x, y, texto, pos})             rombo con X (decision); pos del texto: 'arriba' | 'abajo'
//   almacen(id, {x, y, texto})                    base de datos (cilindro)
// Las flechas se hacen con rel(origen, destino, {tipo: 'navegable', ...}) de uml.js:
// a una compuerta se llega por sus puntas usando desde/hasta ('t','b','l','r').

function carril(id, o) {
  return _caja(id, o, 'bp-carril tono-c-' + (o.tono || 'gris'),
    '<div class="bp-carril-tit"><span>' + o.titulo + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</span></div>');
}

function tarea(id, o) {
  if (!o.w) o.w = 190;
  if (!o.h) o.h = 78;
  return _caja(id, o, 'bp-tarea tono-t-' + (o.tono || 'blanco'), '<div>' + o.texto + '</div>');
}

function evento(id, o) {
  var d = 46;
  var caja = _caja(id, { x: o.x, y: o.y, w: d, h: d }, 'bp-evento bp-' + (o.tipo || 'inicio'), o.tipo == 'mensaje' ? '<span>✉</span>' : '');
  caja.dataset.forma = 'elipse';
  if (o.texto) {
    var t = document.createElement('div');
    t.className = 'bp-texto-evento';
    t.style.left = (o.x + d / 2 - 65) + 'px'; // texto de 130px centrado debajo del circulo
    t.style.top = (o.y + d + 4) + 'px';
    t.innerHTML = o.texto;
    _l().appendChild(t);
  }
  return caja;
}

function compuerta(id, o) {
  var d = 56;
  var caja = _caja(id, { x: o.x, y: o.y, w: d, h: d }, 'bp-compuerta', '<div class="bp-rombo"></div><span class="bp-x">✕</span>');
  if (o.texto) {
    var t = document.createElement('div');
    t.className = 'bp-texto-compuerta';
    if (o.pos == 'derecha') {
      t.style.left = (o.x + d + 6) + 'px';
      t.style.top = (o.y + 6) + 'px';
      t.style.width = '120px';
      t.style.textAlign = 'left';
    } else {
      t.style.left = (o.x - 62) + 'px';
      t.style.top = (o.pos == 'abajo' ? o.y + d + 4 : o.y - 40) + 'px';
    }
    t.innerHTML = o.texto;
    _l().appendChild(t);
  }
  return caja;
}

function almacen(id, o) {
  var svg = '<svg viewBox="0 0 60 70" width="60" height="70"><path d="M2,12 v46 a28,10 0 0 0 56,0 v-46" fill="#E3F5EA" stroke="#14532D" stroke-width="2"/>' +
    '<ellipse cx="30" cy="12" rx="28" ry="10" fill="#E3F5EA" stroke="#14532D" stroke-width="2"/></svg>';
  return _caja(id, { x: o.x, y: o.y, w: 110 }, 'bp-almacen', svg + '<div>' + o.texto + '</div>');
}

// estado de la solicitud (diagrama del ciclo de vida): caja redondeada con el nombre y una explicacion
function estado(id, o) {
  return _caja(id, o, 'bp-estado tono-t-' + (o.tono || 'blanco'), '<b>' + o.nombre + '</b>' + (o.texto || ''));
}
