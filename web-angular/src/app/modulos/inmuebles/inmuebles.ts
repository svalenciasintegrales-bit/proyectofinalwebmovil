import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Inmueble } from '../../servicios/inmueble';
import { mensajeError } from '../../servicios/errores';

// panel: CRUD de inmuebles + subir foto (lo que se publica aqui lo ve el cliente en la app)
@Component({
  selector: 'app-inmuebles',
  standalone: true,
  imports: [CommonModule, FormsModule],
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

  // buscador y filtros de la tabla
  texto: string = '';
  filtroOperacion: string = '';
  filtroEstado: string = '';

  constructor(public sinmueble: Inmueble, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.consultar();
  }

  vacio() {
    return {
      codigo: '', titulo: '', tipo: 'casa', operacion: 'venta', precio: '', barrio: '', ciudad: 'Cartago',
      area: '', habitaciones: '', banos: '', descripcion: '', estado: 'disponible'
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
    return this.inmuebles.filter((i: any) => {
      const cumpleTexto = !buscado ||
        String(i.codigo).toLowerCase().includes(buscado) ||
        String(i.titulo).toLowerCase().includes(buscado) ||
        String(i.barrio).toLowerCase().includes(buscado);
      const cumpleOperacion = !this.filtroOperacion || i.operacion === this.filtroOperacion;
      const cumpleEstado = !this.filtroEstado || i.estado === this.filtroEstado;
      return cumpleTexto && cumpleOperacion && cumpleEstado;
    });
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
      if (!/^[A-Z]{2,4}-\d{2,5}$/.test(codigo)) return 'Usa letras, guion y números (ej: CAR-107).';
      if (codigo === this.codigoRepetido) return `Ya existe un inmueble con el código ${codigo}.`;
    }
    if (campo === 'titulo' && !String(o.titulo || '').trim()) return 'Escribe el título.';
    if (campo === 'precio' && !(Number(o.precio) > 0)) return 'El precio debe ser mayor que 0.';
    if (['area', 'habitaciones', 'banos'].includes(campo) && o[campo] !== '' && o[campo] !== null && Number(o[campo]) < 0) {
      return 'No puede ser negativo.';
    }
    return '';
  }

  formularioValido() {
    return ['codigo', 'titulo', 'precio', 'area', 'habitaciones', 'banos'].every(c => !this.errorCampo(c));
  }

  guardar() {
    this.error = '';
    this.validarFormulario = true;
    if (!this.formularioValido() || this.enviando) return;

    this.enviando = true;
    const texto = this.editingId ? 'Inmueble actualizado con éxito.' : 'Inmueble registrado con éxito. Ahora súbele una foto.';
    const peticion = this.editingId
      ? this.sinmueble.editar(this.editingId, this.objInmueble)
      : this.sinmueble.insertar(this.objInmueble);

    peticion.subscribe({
      next: (res: any) => this.respuesta(res, texto),
      // si falla, lo escrito se conserva en el formulario y se muestra el motivo
      error: (err: any) => {
        this.enviando = false;
        this.error = mensajeError(err);
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
      descripcion: inm.descripcion, estado: inm.estado
    };
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
          this.errorTabla = mensajeError(err);
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
  }

  // se ejecuta cuando se escoge una foto en el input file
  subirFoto(evento: any, inm: any) {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    this.errorTabla = '';
    // se revisa antes de enviar (la api tambien lo revisa con multer)
    if (!/\.(png|jpe?g|gif|webp)$/i.test(archivo.name)) {
      this.errorTabla = 'La foto debe ser png, jpg, jpeg, gif o webp.';
    } else if (archivo.size > 5 * 1024 * 1024) {
      this.errorTabla = 'La foto pesa más de 5 MB.';
    }
    evento.target.value = ''; // limpiar el input para poder subir otra
    if (this.errorTabla) {
      this.cdr.detectChanges();
      return;
    }
    this.sinmueble.subirFoto(inm._id, archivo).subscribe({
      next: () => {
        this.consultar();
        this.mostrarMensaje(`Foto de ${inm.codigo} subida con éxito.`);
      },
      error: (err: any) => {
        this.errorTabla = mensajeError(err);
        this.cdr.detectChanges();
      }
    });
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
