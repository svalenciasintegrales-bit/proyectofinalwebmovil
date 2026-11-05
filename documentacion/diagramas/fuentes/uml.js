// uml.js -> motor minimo para dibujar diagramas UML (clases y casos de uso) en HTML + SVG.
// Las cajas se posicionan a mano (x, y en px) y las relaciones se trazan despues de medirlas.
//
//   clase(id, {x, y, w, est, nombre, attrs:[], mets:[], tono:'rojo'|'negro'|'gris'|'azul'|'verde'|'ambar'})
//   enumeracion(id, {x, y, w, valores:[]})
//   nota(id, {x, y, w, html})
//   paquete(id, {x, y, w, h, titulo, tono})          marco de fondo (capa/paquete)
//   actor(id, {x, y, nombre})
//   cu(id, {x, y, w, h, codigo, nombre, tono})       caso de uso (elipse)
//   frontera(id, {x, y, w, h, titulo})                limite del sistema
//   rel(origen, destino, {tipo, m1, m2, etiqueta, desde, hasta, fd, fh, via, orto, tl})
//      tipo: asociacion | navegable | dependencia | composicion | agregacion | herencia |
//            realizacion | include | extend | linea | nota
//      desde/hasta: lado 't' 'b' 'l' 'r' (opcional) y fd/fh posicion 0..1 sobre ese lado
//      via: [[x,y], ...] puntos intermedios; orto:true -> codos en angulo recto
//      tl: posicion de la etiqueta (0..1) a lo largo del recorrido (0.5 por defecto)
//   dibujar()  -> se llama al final

var _lienzo = null, _rels = [];

function _l() {
  if (!_lienzo) _lienzo = document.getElementById('lienzo');
  return _lienzo;
}

function _caja(id, o, clase, html) {
  var d = document.createElement('div');
  d.id = id;
  d.className = clase;
  d.style.left = o.x + 'px';
  d.style.top = o.y + 'px';
  if (o.w) d.style.width = o.w + 'px';
  if (o.h) d.style.height = o.h + 'px';
  d.innerHTML = html;
  _l().appendChild(d);
  return d;
}

function _esc(t) {
  return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// resalta "nombre: Tipo" -> nombre normal y tipo en gris
function _fila(t) {
  var s = _esc(t);
  s = s.replace(/^([+\-#~])\s?/, '<span class="vis">$1</span> ');
  s = s.replace(/: ([^:()]+)$/, ': <span class="tipo">$1</span>');
  if (/\{static\}|\$$/.test(t)) s = '<u>' + s.replace(/\s?(\{static\}|\$)$/, '') + '</u>';
  return '<div class="fila">' + s + '</div>';
}

function clase(id, o) {
  var h = '<div class="cab tono-' + (o.tono || 'rojo') + '">';
  if (o.est) h += '<div class="est">' + _esc(o.est) + '</div>';
  h += '<div class="nom' + (o.abstracta ? ' abs' : '') + '">' + _esc(o.nombre || id) + '</div></div>';
  if (o.attrs !== null) h += '<div class="sec">' + (o.attrs || []).map(_fila).join('') + '</div>';
  if (o.mets) h += '<div class="sec">' + o.mets.map(_fila).join('') + '</div>';
  return _caja(id, o, 'uml-clase', h);
}

function enumeracion(id, o) {
  var h = '<div class="cab tono-gris"><div class="est">«enumeration»</div><div class="nom">' + _esc(o.nombre || id) + '</div></div>';
  h += '<div class="sec">' + o.valores.map(function (v) { return '<div class="fila">' + _esc(v) + '</div>'; }).join('') + '</div>';
  return _caja(id, o, 'uml-clase uml-enum', h);
}

function nota(id, o) {
  return _caja(id, o, 'uml-nota', o.html);
}

function paquete(id, o) {
  return _caja(id, o, 'uml-paquete tono-p-' + (o.tono || 'gris'), '<div class="pq-tit">' + _esc(o.titulo) + '</div>');
}

function actor(id, o) {
  var svg = '<svg viewBox="0 0 40 70" width="44" height="76"><circle cx="20" cy="10" r="8"/>' +
    '<line x1="20" y1="18" x2="20" y2="44"/><line x1="4" y1="28" x2="36" y2="28"/>' +
    '<line x1="20" y1="44" x2="6" y2="66"/><line x1="20" y1="44" x2="34" y2="66"/></svg>';
  var d = _caja(id, o, 'uml-actor', svg + '<div class="act-nom">' + o.nombre + '</div>');
  return d;
}

function cu(id, o) {
  var h = '<div class="cu-in">' + (o.codigo ? '<span class="cu-cod">' + o.codigo + '</span>' : '') + o.nombre + '</div>';
  var d = _caja(id, o, 'uml-cu tono-cu-' + (o.tono || 'normal'), h);
  d.dataset.forma = 'elipse';
  return d;
}

function frontera(id, o) {
  return _caja(id, o, 'uml-frontera', '<div class="fr-tit">' + o.titulo + '</div>');
}

function rel(a, b, o) {
  _rels.push({ a: a, b: b, o: o || {} });
}

// ------------------------------------------------------------------ geometria
function _rect(id) {
  var el = document.getElementById(id);
  if (!el) throw new Error('No existe el elemento ' + id);
  var L = _l().getBoundingClientRect();
  var r = el.getBoundingClientRect();
  var forma = el.dataset.forma || 'rect';
  if (el.classList.contains('uml-actor')) {
    // el anclaje del actor es la figura, no el texto
    var s = el.querySelector('svg').getBoundingClientRect();
    return { x: s.left - L.left, y: s.top - L.top, w: s.width, h: s.height + 18, forma: 'rect', inf: r.bottom - L.top + 4 };
  }
  return { x: r.left - L.left, y: r.top - L.top, w: r.width, h: r.height, forma: forma };
}

function _centro(r) { return [r.x + r.w / 2, r.y + r.h / 2]; }

function _lado(r, lado, f) {
  if (f === undefined) f = 0.5;
  if (lado === 't') return [r.x + r.w * f, r.y];
  if (lado === 'b') return [r.x + r.w * f, r.inf || (r.y + r.h)];
  if (lado === 'l') return [r.x, r.y + r.h * f];
  return [r.x + r.w, r.y + r.h * f];
}

// punto del borde de r en direccion al punto p
function _recorte(r, p) {
  var c = _centro(r), dx = p[0] - c[0], dy = p[1] - c[1];
  if (dx === 0 && dy === 0) return c;
  var a = r.w / 2, b = r.h / 2, t;
  if (r.forma === 'elipse') {
    t = 1 / Math.sqrt((dx * dx) / (a * a) + (dy * dy) / (b * b));
  } else {
    t = Math.min(dx !== 0 ? a / Math.abs(dx) : Infinity, dy !== 0 ? b / Math.abs(dy) : Infinity);
  }
  return [c[0] + dx * t, c[1] + dy * t];
}

function _ruta(ra, rb, o) {
  var p1, p2, pts;
  var via = o.via || [];
  if (o.desde) p1 = _lado(ra, o.desde, o.fd);
  if (o.hasta) p2 = _lado(rb, o.hasta, o.fh);
  if (!p1) p1 = _recorte(ra, via.length ? via[0] : (p2 || _centro(rb)));
  if (!p2) p2 = _recorte(rb, via.length ? via[via.length - 1] : p1);
  if (o.recta === 'h') p2 = [p2[0], p1[1]];
  if (o.recta === 'v') p2 = [p1[0], p2[1]];
  pts = [p1].concat(via).concat([p2]);
  if (o.orto && via.length === 0 && o.desde && o.hasta) {
    var h1 = o.desde === 'l' || o.desde === 'r', h2 = o.hasta === 'l' || o.hasta === 'r';
    if (h1 && h2) { var mx = (p1[0] + p2[0]) / 2; pts = [p1, [mx, p1[1]], [mx, p2[1]], p2]; }
    else if (!h1 && !h2) { var my = (p1[1] + p2[1]) / 2; pts = [p1, [p1[0], my], [p2[0], my], p2]; }
    else if (h1 && !h2) pts = [p1, [p2[0], p1[1]], p2];
    else pts = [p1, [p1[0], p2[1]], p2];
  }
  return pts;
}

function _punto(pts, t) {
  var lens = [], tot = 0;
  for (var i = 1; i < pts.length; i++) {
    var l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    lens.push(l); tot += l;
  }
  var obj = tot * t;
  for (var j = 0; j < lens.length; j++) {
    if (obj <= lens[j] || j === lens.length - 1) {
      var k = lens[j] ? obj / lens[j] : 0;
      return [pts[j][0] + (pts[j + 1][0] - pts[j][0]) * k, pts[j][1] + (pts[j + 1][1] - pts[j][1]) * k];
    }
    obj -= lens[j];
  }
  return pts[0];
}

function _etiquetaFin(svg, p, q, texto, clase) {
  // p = extremo, q = punto siguiente del recorrido; se coloca al costado de la linea
  var dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1;
  var ux = dx / L, uy = dy / L;
  var x = p[0] + ux * 16 - uy * 11, y = p[1] + uy * 16 + ux * 11;
  var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  t.setAttribute('x', x); t.setAttribute('y', y + 4);
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('class', clase || 'mult');
  t.textContent = texto;
  svg.appendChild(t);
}

function dibujar() {
  if (typeof pintarIconos === 'function') pintarIconos();
  var L = _l();
  var W = L.offsetWidth, H = L.offsetHeight;
  var ns = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'uml-svg');
  svg.setAttribute('width', W); svg.setAttribute('height', H);
  svg.innerHTML =
    '<defs>' +
    '<marker id="m-flecha" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="12" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M1,1 L11,6 L1,11" fill="none" stroke="#333" stroke-width="1.4"/></marker>' +
    '<marker id="m-triangulo" viewBox="0 0 16 16" refX="15" refY="8" markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M1,1 L15,8 L1,15 z" fill="#fff" stroke="#333" stroke-width="1.4"/></marker>' +
    '<marker id="m-rombo-lleno" viewBox="0 0 20 12" refX="1" refY="6" markerWidth="20" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><path d="M1,6 L10,1 L19,6 L10,11 z" fill="#333" stroke="#333" stroke-width="1"/></marker>' +
    '<marker id="m-rombo-hueco" viewBox="0 0 20 12" refX="1" refY="6" markerWidth="20" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto"><path d="M1,6 L10,1 L19,6 L10,11 z" fill="#fff" stroke="#333" stroke-width="1.2"/></marker>' +
    '</defs>';
  L.insertBefore(svg, L.firstChild);

  _rels.forEach(function (r) {
    var o = r.o, tipo = o.tipo || 'asociacion';
    var pts = _ruta(_rect(r.a), _rect(r.b), o);
    var path = document.createElementNS(ns, 'polyline');
    path.setAttribute('points', pts.map(function (p) { return p[0].toFixed(1) + ',' + p[1].toFixed(1); }).join(' '));
    path.setAttribute('fill', 'none');
    path.setAttribute('class', 'rel rel-' + tipo);
    var discontinua = ['dependencia', 'realizacion', 'include', 'extend', 'nota'].indexOf(tipo) >= 0;
    if (discontinua) path.setAttribute('stroke-dasharray', tipo === 'nota' ? '3 3' : '7 5');
    if (['navegable', 'dependencia', 'include', 'extend'].indexOf(tipo) >= 0) path.setAttribute('marker-end', 'url(#m-flecha)');
    if (tipo === 'herencia' || tipo === 'realizacion') path.setAttribute('marker-end', 'url(#m-triangulo)');
    if (tipo === 'composicion') path.setAttribute('marker-start', 'url(#m-rombo-lleno)');
    if (tipo === 'agregacion') path.setAttribute('marker-start', 'url(#m-rombo-hueco)');
    svg.appendChild(path);

    if (o.m1) _etiquetaFin(svg, pts[0], pts[1], o.m1);
    if (o.m2) _etiquetaFin(svg, pts[pts.length - 1], pts[pts.length - 2], o.m2);
    var et = o.etiqueta || (tipo === 'include' ? '«include»' : tipo === 'extend' ? '«extend»' : '');
    if (et) {
      var m = _punto(pts, o.tl === undefined ? 0.5 : o.tl);
      var g = document.createElementNS(ns, 'g');
      var t = document.createElementNS(ns, 'text');
      t.setAttribute('x', m[0] + (o.dx || 0)); t.setAttribute('y', m[1] + 4 + (o.dy || 0));
      t.setAttribute('text-anchor', 'middle');
      t.setAttribute('class', 'etq' + (tipo === 'include' || tipo === 'extend' ? ' etq-est' : ''));
      t.textContent = et;
      g.appendChild(t);
      svg.appendChild(g);
      var bb = t.getBBox();
      var fondo = document.createElementNS(ns, 'rect');
      fondo.setAttribute('x', bb.x - 3); fondo.setAttribute('y', bb.y - 1);
      fondo.setAttribute('width', bb.width + 6); fondo.setAttribute('height', bb.height + 2);
      fondo.setAttribute('rx', 3);
      fondo.setAttribute('class', 'etq-fondo');
      g.insertBefore(fondo, t);
    }
  });
}
