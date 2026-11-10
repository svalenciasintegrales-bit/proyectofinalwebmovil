import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Inmueble } from '../../servicios/inmueble';

// panel: CRUD de inmuebles con fotos (carrusel + portada) y video de YouTube (lo que se publica aqui lo ve el cliente en la app)
@Component({
  selector: 'app-inmuebles',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './inmuebles.html',
  styleUrl: './inmuebles.css'
})
export class Inmuebles implements OnInit {
  inmuebles: any[] = [];
  objInmueble: any = this.vacio();
  validarFormulario: boolean = false;
  editingId: string | null = null;
  mensaje: string = '';
  error: string = '';
  errorTabla: string = ''; // ej: no se puede eliminar porque tiene solicitudes
  enviando: boolean = false; // mientras la api responde se bloquea el boton (no se envia dos veces)
  codigoRepetido: string = ''; // codigo que la api rechazo por estar repetido (se muestra debajo del campo)

  // FOTOS del formulario (Nuevo / Editar)
  fotosActuales: string[] = []; // fotos que ya estan en el servidor (solo al editar)
  portada: string = '';          // foto del servidor elegida como portada
  nuevasFotos: any[] = [];       // fotos escogidas en el computador que se suben al guardar: { archivo, url }
  portadaNueva: number = -1;     // si la portada es una foto nueva, su posicion en nuevasFotos (-1 = no)
  errorFotos: string = '';

  // VIDEO de YouTube: vista previa (se arma solo cuando cambia el enlace)
  videoSeguro: SafeResourceUrl | null = null;
  videoId: string = '';

  // buscador y filtros de la tabla
  texto: string = '';
  filtroOperacion: string = '';
  filtroEstado: string = '';

  constructor(public sinmueble: Inmueble, private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) { }

  ngOnInit(): void {
    this.consultar();
  }

  vacio() {
    return {
      codigo: '', titulo: '', tipo: 'casa', operacion: 'venta', precio: '', barrio: '', ciudad: 'Cartago',
      area: '', habitaciones: '', banos: '', descripcion: '', estado: 'disponible', video: ''
    };
  }

  consultar() {
    this.sinmueble.consulta().subscribe({
      next: (res: any) => {
        this.inmuebles = res.inmuebles;
        this.cdr.detectChanges();
      },
      error: () => {
        this.inmuebles = [];
        this.cdr.detectChanges();
      }
    });
  }

  // inmuebles que cumplen el buscador (codigo, titulo o barrio) y los filtros elegidos
  visibles() {
    const buscado = this.texto.trim().toLowerCase();
    const lista: any[] = [];
    for (const i of this.inmuebles) {
      // indexOf >= 0: el texto buscado aparece dentro del codigo, el titulo o el barrio
      const cumpleTexto = buscado === '' ||
        String(i.codigo).toLowerCase().indexOf(buscado) >= 0 ||
        String(i.titulo).toLowerCase().indexOf(buscado) >= 0 ||
        String(i.barrio).toLowerCase().indexOf(buscado) >= 0;
      const cumpleOperacion = this.filtroOperacion === '' || i.operacion === this.filtroOperacion;
      const cumpleEstado = this.filtroEstado === '' || i.estado === this.filtroEstado;
      if (cumpleTexto && cumpleOperacion && cumpleEstado) lista.push(i);
    }
    return lista;
  }

  limpiarFiltros() {
    this.texto = '';
    this.filtroOperacion = '';
    this.filtroEstado = '';
  }

  // reglas de cada campo: devuelve el error que se muestra debajo del campo, o '' si esta bien
  errorCampo(campo: string): string {
    const o = this.objInmueble;
    const codigo = String(o.codigo || '').trim().toUpperCase();
    if (campo === 'codigo') {
      if (!codigo) return 'Escribe el código del letrero.';
      if (codigo.length < 5 || codigo.indexOf('-') < 1) return 'Escribe el código con guion (ej: CAR-107).';
      if (codigo === this.codigoRepetido) return `Ya existe un inmueble con el código ${codigo}.`;
    }
    if (campo === 'titulo' && !String(o.titulo || '').trim()) return 'Escribe el título.';
    if (campo === 'precio' && !(Number(o.precio) > 0)) return 'El precio debe ser mayor que 0.';
    if ((campo === 'area' || campo === 'habitaciones' || campo === 'banos') && Number(o[campo]) < 0) {
      return 'No puede ser negativo.';
    }
    if (campo === 'video' && String(o.video || '').trim() && !this.idYoutube(o.video)) {
      return 'Pega un enlace de YouTube (ej: https://www.youtube.com/watch?v=...).';
    }
    return '';
  }

  formularioValido() {
    const campos = ['codigo', 'titulo', 'precio', 'area', 'habitaciones', 'banos', 'video'];
    for (const campo of campos) {
      if (this.errorCampo(campo) !== '') return false;
    }
    return true;
  }

  guardar() {
    this.error = '';
    this.validarFormulario = true;
    if (!this.formularioValido() || this.enviando) return;

    this.enviando = true;
    const texto = this.editingId ? 'Inmueble actualizado con éxito.' : 'Inmueble registrado con éxito.';
    const datos: any = { ...this.objInmueble };
    // portada elegida entre las fotos que ya estan en el servidor
    if (this.editingId && this.portadaNueva < 0 && this.portada) datos.imagen = this.portada;
    const peticion = this.editingId
      ? this.sinmueble.editar(this.editingId, datos)
      : this.sinmueble.insertar(datos);

    peticion.subscribe({
      // despues de guardar los datos se suben las fotos nuevas (necesitan el id del inmueble)
      next: (res: any) => {
        if (res.status !== 'success') return this.respuesta(res, texto);
        this.subirNuevas(this.editingId || res.inmueble._id, texto);
      },
      // si falla, lo escrito se conserva en el formulario y se muestra el motivo
      error: (err: any) => {
        this.enviando = false;
        this.error = (err.error && err.error.message ? err.error.message : 'No hay conexión con el servidor.');
        if (err.status === 409) this.codigoRepetido = String(this.objInmueble.codigo).trim().toUpperCase();
        this.cdr.detectChanges();
      }
    });
  }

  // lo que se hace cuando la api responde al guardar o editar
  respuesta(res: any, texto: string) {
    this.enviando = false;
    if (res.status === 'success') {
      this.validarFormulario = false;
      this.cerrarModal();
      this.consultar();
      this.mostrarMensaje(texto);
    } else {
      this.error = res.message;
    }
    this.cdr.detectChanges();
  }

  editar(inm: any) {
    this.editingId = inm._id;
    this.validarFormulario = false;
    this.error = '';
    this.objInmueble = {
      codigo: inm.codigo, titulo: inm.titulo, tipo: inm.tipo, operacion: inm.operacion, precio: inm.precio,
      barrio: inm.barrio, ciudad: inm.ciudad, area: inm.area, habitaciones: inm.habitaciones, banos: inm.banos,
      descripcion: inm.descripcion, estado: inm.estado, video: inm.video || ''
    };
    this.limpiarFotos();
    this.leerFotos(inm);
    this.actualizarVideo();
  }

  eliminar(inm: any) {
    if (confirm(`¿Está seguro de eliminar el inmueble ${inm.codigo}?`)) {
      this.errorTabla = '';
      this.sinmueble.eliminar(inm._id).subscribe({
        next: () => {
          this.consultar();
          this.mostrarMensaje('Inmueble eliminado con éxito.');
        },
        // ej: tiene solicitudes -> la api responde 409 y no deja borrarlo
        error: (err: any) => {
          this.errorTabla = (err.error && err.error.message ? err.error.message : 'No hay conexión con el servidor.');
          this.cdr.detectChanges();
        }
      });
    }
  }

  nuevo() {
    this.editingId = null;
    this.objInmueble = this.vacio();
    this.validarFormulario = false;
    this.error = '';
    this.codigoRepetido = '';
    this.limpiarFotos();
    this.actualizarVideo();
  }

  // ---------------- FOTOS ----------------

  // fotos del inmueble que vienen del servidor (los inmuebles viejos solo tienen la portada)
  leerFotos(inm: any) {
    const fotos = inm.imagenes && inm.imagenes.length > 0 ? inm.imagenes : [];
    this.fotosActuales = [...fotos];
    if (inm.imagen && this.fotosActuales.indexOf(inm.imagen) < 0) this.fotosActuales.unshift(inm.imagen);
    this.portada = inm.imagen || '';
  }

  limpiarFotos() {
    for (const n of this.nuevasFotos) URL.revokeObjectURL(n.url); // libera las vistas previas
    this.nuevasFotos = [];
    this.fotosActuales = [];
    this.portada = '';
    this.portadaNueva = -1;
    this.errorFotos = '';
  }

  // se escogen fotos en el computador: se revisan y se muestran en el formulario (se suben al guardar)
  agregarFotos(evento: any) {
    this.errorFotos = '';
    const archivos = evento.target.files;
    for (const archivo of archivos) {
      const nombre = archivo.name.toLowerCase();
      const esImagen = nombre.endsWith('.png') || nombre.endsWith('.jpg') || nombre.endsWith('.jpeg') ||
        nombre.endsWith('.gif') || nombre.endsWith('.webp');
      if (!esImagen) {
        this.errorFotos = `${archivo.name}: la foto debe ser png, jpg, jpeg, gif o webp.`;
      } else if (archivo.size > 5 * 1024 * 1024) {
        this.errorFotos = `${archivo.name}: pesa más de 5 MB.`;
      } else if (this.nuevasFotos.length >= 10) {
        this.errorFotos = 'Se pueden agregar máximo 10 fotos a la vez.';
      } else {
        this.nuevasFotos.push({ archivo: archivo, url: URL.createObjectURL(archivo) });
      }
    }
    evento.target.value = ''; // limpiar el input para poder escoger otras
  }

  quitarNueva(i: number) {
    URL.revokeObjectURL(this.nuevasFotos[i].url);
    this.nuevasFotos.splice(i, 1);
    if (this.portadaNueva === i) this.portadaNueva = -1;
    else if (this.portadaNueva > i) this.portadaNueva--;
  }

  // quitar una foto que ya esta en el servidor (se borra de una vez)
  quitarActual(nombre: string) {
    if (!this.editingId || !confirm('¿Eliminar esta foto del inmueble?')) return;
    this.sinmueble.borrarFoto(this.editingId, nombre).subscribe({
      next: (res: any) => {
        const portadaElegida = this.portada;
        this.leerFotos(res.inmueble);
        // si se habia elegido otra portada (sin guardar) se respeta
        if (portadaElegida !== nombre && this.fotosActuales.indexOf(portadaElegida) >= 0) this.portada = portadaElegida;
        this.consultar();
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.errorFotos = (err.error && err.error.message ? err.error.message : 'No hay conexión con el servidor.');
        this.cdr.detectChanges();
      }
    });
  }

  elegirPortadaActual(nombre: string) {
    this.portada = nombre;
    this.portadaNueva = -1;
  }

  elegirPortadaNueva(i: number) {
    this.portadaNueva = i;
  }

  esPortadaActual(nombre: string) {
    return this.portadaNueva < 0 && this.portada === nombre;
  }

  // si el inmueble no tiene portada, la primera foto nueva queda de portada
  esPortadaNueva(i: number) {
    return this.portadaNueva === i || (this.portadaNueva < 0 && !this.portada && i === 0);
  }

  // despues de guardar: se suben las fotos nuevas y, si la portada es una de ellas, se marca
  subirNuevas(id: string, texto: string) {
    if (this.nuevasFotos.length === 0) return this.respuesta({ status: 'success' }, texto);
    const archivos: File[] = [];
    for (const n of this.nuevasFotos) archivos.push(n.archivo);

    this.sinmueble.subirFotos(id, archivos).subscribe({
      next: (res: any) => {
        if (this.portadaNueva < 0) return this.respuesta(res, texto);
        // las fotos nuevas quedan al final del carrusel, en el mismo orden en que se escogieron
        const fotos = res.inmueble.imagenes;
        const nombre = fotos[fotos.length - archivos.length + this.portadaNueva];
        this.sinmueble.editar(id, { ...this.objInmueble, imagen: nombre }).subscribe({
          next: (r: any) => this.respuesta(r, texto),
          error: () => this.respuesta({ status: 'success' }, texto + ' (no se pudo cambiar la portada)')
        });
      },
      // los datos ya se guardaron: se avisa que las fotos no se pudieron subir
      error: (err: any) => {
        this.enviando = false;
        this.editingId = id;
        this.error = 'Los datos se guardaron, pero las fotos no: ' +
          (err.error && err.error.message ? err.error.message : 'No hay conexión con el servidor.');
        this.consultar();
        this.cdr.detectChanges();
      }
    });
  }

  // ---------------- VIDEO DE YOUTUBE ----------------

  // saca el id del video (11 letras/numeros) de un enlace de YouTube, o '' si no es de YouTube
  idYoutube(enlace: string): string {
    const partes = String(enlace || '').trim().match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    return partes ? partes[1] : '';
  }

  // vista previa del video: solo se arma con un id valido de YouTube (11 letras/numeros)
  actualizarVideo() {
    const id = this.idYoutube(this.objInmueble.video);
    if (id === this.videoId) return; // mismo video: no se recarga el reproductor
    this.videoId = id;
    this.videoSeguro = id
      ? this.sanitizer.bypassSecurityTrustResourceUrl(`https://www.youtube.com/embed/${id}`)
      : null;
  }

  cerrarModal() {
    const closeBtn = document.getElementById('btnCerrarModal');
    if (closeBtn) closeBtn.click();
  }

  mostrarMensaje(msg: string) {
    this.mensaje = msg;
    this.cdr.detectChanges();
    setTimeout(() => {
      this.mensaje = '';
      this.cdr.detectChanges();
    }, 3500);
  }
}
