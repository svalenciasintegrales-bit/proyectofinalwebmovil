// helper: miniatura de una pantalla (PNG ya generado) para los mapas de navegacion
function pant(id, o) {
  var d = document.createElement('div');
  d.id = id;
  d.className = 'pant' + (o.variante ? ' var' : '');
  d.style.left = o.x + 'px'; d.style.top = o.y + 'px'; d.style.width = o.w + 'px';
  d.innerHTML = '<img src="' + o.img + '" style="height:' + o.h + 'px"><div class="cap">' + o.titulo + (o.sub ? '<small>' + o.sub + '</small>' : '') + '</div>';
  document.getElementById('lienzo').appendChild(d);
}
