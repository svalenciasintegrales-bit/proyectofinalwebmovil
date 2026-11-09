// graficas.js -> dibuja en SVG las 4 graficas del tablero imitando a Chart.js (ng2-charts):
// fuente 12px gris #666, leyenda abajo con puntos, rejilla rgba(0,0,0,0.05). Sin librerias ni internet.
var GR = (function () {
  var FUENTE = "'Helvetica Neue', Helvetica, Arial, sans-serif";
  var GRIS = '#666';
  var REJILLA = 'rgba(0,0,0,0.05)';
  var BORDE = 'rgba(0,0,0,0.1)';
  var ctx = document.createElement('canvas').getContext('2d');
  ctx.font = '12px ' + FUENTE;
  function ancho(t) { return ctx.measureText(t).width; }
  function txt(x, y, t, anchor, extra) {
    return '<text x="' + x + '" y="' + y + '" font-family="' + FUENTE.replace(/'/g, '') + '" font-size="12" fill="' + GRIS + '" text-anchor="' + (anchor || 'start') + '" ' + (extra || '') + '>' + t + '</text>';
  }

  // leyenda centrada abajo (usePointStyle, boxWidth 8, padding 10); devuelve {svg, alto}
  function leyenda(items, W, H) {
    var filas = [[]], anchoFila = [0], pad = 10;
    items.forEach(function (it) {
      var w = 8 + 6 + ancho(it.texto) + pad;
      var f = filas.length - 1;
      if (anchoFila[f] + w > W - pad && filas[f].length) { filas.push([]); anchoFila.push(0); f++; }
      filas[f].push({ it: it, w: w });
      anchoFila[f] += w;
    });
    var alto = filas.length * (12 + pad) + pad;
    var svg = '';
    filas.forEach(function (fila, i) {
      var x = (W - anchoFila[i] + pad) / 2;
      var y = H - alto + pad + i * (12 + pad) + 6;
      fila.forEach(function (c) {
        svg += '<circle cx="' + (x + 4) + '" cy="' + y + '" r="4" fill="' + c.it.color + '"/>';
        svg += txt(x + 14, y + 4, c.it.texto);
        x += c.w;
      });
    });
    return { svg: svg, alto: alto };
  }

  function rectRedondo(x, y, w, h, r, lados) {
    // lados: 'arriba' o 'derecha' (los extremos redondeados)
    r = Math.min(r, w / 2, h / 2);
    if (lados === 'arriba') {
      return 'M' + x + ',' + (y + h) + 'V' + (y + r) + 'Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
        'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) + 'V' + (y + h) + 'Z';
    }
    return 'M' + x + ',' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) +
      'V' + (y + h - r) + 'Q' + (x + w) + ',' + (y + h) + ' ' + (x + w - r) + ',' + (y + h) + 'H' + x + 'Z';
  }

  function montar(el, W, H, contenido) {
    el.insertAdjacentHTML('afterbegin', '<svg class="svg-grafica" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg">' + contenido + '</svg>');
  }

  // ---------- barras verticales apiladas ----------
  function apiladas(el, o) {
    var W = el.clientWidth, H = el.clientHeight;
    var ley = leyenda(o.series.map(function (s) { return { texto: s.label, color: s.color }; }), W, H);
    var max = o.max, ticks = [];
    for (var t = 0; t <= max; t += o.paso) ticks.push(t);
    var anchoY = Math.max.apply(null, ticks.map(function (t) { return ancho(String(t)); }));
    var x0 = Math.ceil(anchoY + 3 + 8) + 1, x1 = W - 6, y0 = 7, y1 = H - ley.alto - 20;
    var svg = '';
    ticks.forEach(function (t) {
      var y = y1 - (y1 - y0) * t / max;
      svg += '<line x1="' + (x0 - 8) + '" x2="' + x1 + '" y1="' + y + '" y2="' + y + '" stroke="' + REJILLA + '"/>';
      svg += txt(x0 - 11, y + 4, String(t), 'end');
    });
    svg += '<line x1="' + x0 + '" x2="' + x0 + '" y1="' + y0 + '" y2="' + y1 + '" stroke="' + BORDE + '"/>';
    svg += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y1 + '" y2="' + y1 + '" stroke="' + BORDE + '"/>';
    var n = o.labels.length, cat = (x1 - x0) / n;
    var bw = Math.min(o.maxBar, cat * 0.8 * 0.9);
    o.labels.forEach(function (lab, i) {
      var cx = x0 + cat * (i + 0.5);
      svg += txt(cx, y1 + 16, lab, 'middle');
      var base = y1, ultima = -1;
      o.series.forEach(function (s, k) { if (s.data[i] > 0) ultima = k; });
      o.series.forEach(function (s, k) {
        var v = s.data[i];
        if (!v) return;
        var h = (y1 - y0) * v / max;
        var y = base - h;
        if (k === ultima) svg += '<path d="' + rectRedondo(cx - bw / 2, y, bw, h, o.radio, 'arriba') + '" fill="' + s.color + '"/>';
        else svg += '<rect x="' + (cx - bw / 2) + '" y="' + y + '" width="' + bw + '" height="' + h + '" fill="' + s.color + '"/>';
        base = y;
      });
    });
    montar(el, W, H, svg + ley.svg);
  }

  // ---------- barras horizontales ----------
  function horizontales(el, o) {
    var W = el.clientWidth, H = el.clientHeight;
    var anchoY = Math.max.apply(null, o.labels.map(ancho));
    var x0 = Math.ceil(anchoY + 3) + 6, x1 = W - 8, y0 = 6, y1 = H - 8 - 20;
    var max = o.max, svg = '';
    for (var t = 0; t <= max; t += o.paso) {
      var x = x0 + (x1 - x0) * t / max;
      svg += '<line x1="' + x + '" x2="' + x + '" y1="' + y0 + '" y2="' + (y1 + 8) + '" stroke="' + REJILLA + '"/>';
      svg += txt(x, y1 + 8 + 15, String(t), 'middle');
    }
    svg += '<line x1="' + x0 + '" x2="' + x0 + '" y1="' + y0 + '" y2="' + y1 + '" stroke="' + BORDE + '"/>';
    svg += '<line x1="' + x0 + '" x2="' + x1 + '" y1="' + y1 + '" y2="' + y1 + '" stroke="' + BORDE + '"/>';
    var n = o.labels.length, cat = (y1 - y0) / n;
    var bh = Math.min(o.maxBar, cat * 0.8 * 0.9);
    o.labels.forEach(function (lab, i) {
      var cy = y0 + cat * (i + 0.5);
      svg += txt(x0 - 6, cy + 4, lab, 'end');
      var w = (x1 - x0) * o.data[i] / max;
      svg += '<path d="' + rectRedondo(x0, cy - bh / 2, w, bh, o.radio, 'derecha') + '" fill="' + o.colores[i] + '"/>';
    });
    montar(el, W, H, svg);
  }

  // ---------- dona ----------
  function dona(el, o) {
    var W = el.clientWidth, H = el.clientHeight;
    var ley = leyenda(o.labels.map(function (l, i) { return { texto: l, color: o.colores[i] }; }), W, H);
    var altoArea = H - ley.alto;
    var R = Math.min(W, altoArea) / 2 - 2, r = R * o.corte;
    var cx = W / 2, cy = altoArea / 2;
    var total = o.data.reduce(function (a, b) { return a + b; }, 0);
    var ang = -Math.PI / 2, svg = '';
    o.data.forEach(function (v, i) {
      if (!v) return;
      var a2 = ang + 2 * Math.PI * v / total;
      var grande = (a2 - ang) > Math.PI ? 1 : 0;
      function p(rad, a) { return (cx + rad * Math.cos(a)).toFixed(2) + ',' + (cy + rad * Math.sin(a)).toFixed(2); }
      svg += '<path d="M' + p(R, ang) + 'A' + R + ',' + R + ' 0 ' + grande + ' 1 ' + p(R, a2) +
        'L' + p(r, a2) + 'A' + r + ',' + r + ' 0 ' + grande + ' 0 ' + p(r, ang) + 'Z" fill="' + o.colores[i] + '"/>';
      ang = a2;
    });
    montar(el, W, H, svg + ley.svg);
  }

  return { apiladas: apiladas, horizontales: horizontales, dona: dona };
})();
