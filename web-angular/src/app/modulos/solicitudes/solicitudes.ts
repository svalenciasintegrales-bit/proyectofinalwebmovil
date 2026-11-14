import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cita } from '../../servicios/cita';
import { Inmueble } from '../../servicios/inmueble';
import { Cliente } from '../../servicios/cliente';

// panel: solicitudes que envian los clientes desde la app (agendar visita o pedir informacion).
// El administrador las responde y cambia su estado; el cliente ve la respuesta en la app.
@Component({
  selector: 'app-solicitudes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitudes.html',
  styleUrl: './solicitudes.css'
})
export class Solicitudes implements OnInit {
  solicitudes: any[] = [];
  inmuebles: any[] = [];
  clientes: any[] = [];
  estado: string = ''; // filtro por estado: '' = todas
  tipo: string = ''; // filtro por tipo: '' = todas, 'visita' o 'informacion'
  estados: string[] = ['pendiente', 'confirmada', 'realizada', 'cancelada'];
  vista: string = 'lista'; // 'lista' (tabla) o 'tablero' (kanban por estado)
  mensaje: string = '';
  error: string = '';
  errorTabla: string = ''; // ej: cambio de estado que el servidor no permite
  enviando: boolean = false; // bloquea el boton mientras la api responde

  // a que estados se puede pasar desde cada uno (la misma regla la revisa el servidor)
  transiciones: any = {
    pendiente: ['confirmada', 'realizada', 'cancelada'],
    confirmada: ['realizada', 'cancelada'],
    realizada: [],
    cancelada: []
  };

  // solicitud que se esta respondiendo en la ventana (modal)
  seleccionada: any = null;
  objRespuesta: any = { estado: 'confirmada', respuesta: '' };
  validarFormulario: boolean = false;

  constructor(
    private scita: Cita,
    private sinmueble: Inmueble,
    private scliente: Cliente,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // se cargan inmuebles y clientes para mostrar los nombres en vez de los ids
    this.sinmueble.consulta().subscribe({
      next: (res: any) => { this.inmuebles = res.inmuebles; this.cdr.detectChanges(); },
      error: () => { this.inmuebles = []; }
    });
    this.scliente.consulta().subscribe({
      next: (res: any) => { this.clientes = res.clientes; this.cdr.detectChanges(); },
      error: () => { this.clientes = []; }
    });
    this.consultar();
  }

  consultar() {
    this.scita.consulta(this.estado).subscribe({
      next: (res: any) => {
        this.solicitudes = res.citas;
        this.cdr.detectChanges();
      },
      error: () => {
        this.solicitudes = [];
        this.cdr.detectChanges();
      }
    });
  }

  filtrar(estado: string) {
    this.estado = estado;
    this.consultar();
  }

  // ---------- VISTA TABLERO (KANBAN) ----------
  // 'lista' = la tabla de siempre; 'tablero' = una columna por estado con tarjetas
  cambiarVista(vista: string) {
    this.vista = vista;
    // en el tablero cada columna ya es un estado, por eso se traen todas
    if (vista === 'tablero' && this.estado !== '') this.filtrar('');
  }

  // solicitudes de una columna del tablero (respeta el filtro de tipo)
  columna(estado: string) {
    const lista: any[] = [];
    for (const s of this.visibles()) {
      if (s.estado === estado) lista.push(s);
    }
    return lista;
  }

  iconoEstado(estado: string) {
    if (estado === 'pendiente') return 'bi-hourglass-split';
    if (estado === 'confirmada') return 'bi-calendar-check';
    if (estado === 'realizada') return 'bi-check2-circle';
    return 'bi-x-circle';
  }

  // filtro por tipo: se hace aqui con la lista que ya llego de la api
  visibles() {
    if (this.tipo === '') return this.solicitudes;
    const lista: any[] = [];
    for (const s of this.solicitudes) {
      if ((s.tipo || 'visita') === this.tipo) lista.push(s);
    }
    return lista;
  }

  contar(tipo: string) {
    let total = 0;
    for (const s of this.solicitudes) {
      if ((s.tipo || 'visita') === tipo) total++;
    }
    return total;
  }

  // "relacion manual": buscar en la lista el inmueble o el cliente con ese id
  inmuebleDe(id: string) {
    for (const i of this.inmuebles) {
      if (i._id === id) return i;
    }
    return null;
  }

  clienteDe(id: string) {
    for (const c of this.clientes) {
      if (c._id === id) return c;
    }
    return null;
  }

  // ---------- RESPONDER ----------
  abrirRespuesta(s: any) {
    this.seleccionada = s;
    this.validarFormulario = false;
    this.error = '';
    this.objRespuesta = {
      // pendiente: se propone confirmada (visita) o realizada (informacion respondida)
      estado: s.estado === 'pendiente' ? ((s.tipo || 'visita') === 'visita' ? 'confirmada' : 'realizada') : s.estado,
      respuesta: s.respuesta || ''
    };
  }

  // estados que se pueden elegir en la ventana: el actual (solo cambia la respuesta) y los permitidos
  // una visita pendiente no puede pasar directo a realizada: primero se confirma
  opcionesEstado(s: any) {
    if (!s) return [];
    const opciones: string[] = [s.estado];
    for (const e of this.transiciones[s.estado] || []) {
      const visitaSinConfirmar = e === 'realizada' && s.estado === 'pendiente' && (s.tipo || 'visita') === 'visita';
      if (!visitaSinConfirmar) opciones.push(e);
    }
    return opciones;
  }

  guardarRespuesta() {
    this.error = '';
    if (!this.objRespuesta.respuesta.trim()) {
      this.validarFormulario = true;
      return;
    }
    if (this.enviando) return;
    this.enviando = true;
    this.scita.responder(this.seleccionada._id, this.objRespuesta.estado, this.objRespuesta.respuesta.trim()).subscribe({
      next: () => {
        this.enviando = false;
        this.cerrarModal();
        this.consultar();
        this.mostrarMensaje('Respuesta enviada. El cliente la verá en la app.');
      },
      // ej: 409 cambio de estado no permitido -> la respuesta escrita se conserva
      error: (err: any) => {
        this.enviando = false;
        this.error = (err.error && err.error.message ? err.error.message : 'No hay conexión con el servidor.');
        this.cdr.detectChanges();
      }
    });
  }

  // acciones rapidas sin escribir respuesta
  cambiarEstado(s: any, estado: string) {
    if (estado === 'cancelada' && !confirm('¿Cancelar esta solicitud? Después ya no se puede cambiar.')) return;
    this.errorTabla = '';
    this.scita.cambiarEstado(s._id, estado).subscribe({
      next: () => {
        this.consultar();
        this.mostrarMensaje(`La solicitud quedó ${estado}.`);
      },
      error: (err: any) => {
        this.errorTabla = (err.error && err.error.message ? err.error.message : 'No hay conexión con el servidor.');
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(s: any) {
    if (confirm('¿Está seguro de eliminar esta solicitud?')) {
      this.errorTabla = '';
      this.scita.eliminar(s._id).subscribe({
        next: () => {
          this.consultar();
          this.mostrarMensaje('Solicitud eliminada con éxito.');
        },
        error: (err: any) => {
          this.errorTabla = (err.error && err.error.message ? err.error.message : 'No hay conexión con el servidor.');
          this.cdr.detectChanges();
        }
      });
    }
  }

  colorEstado(estado: string) {
    if (estado === 'pendiente') return 'estado-pendiente';
    if (estado === 'confirmada') return 'estado-confirmada';
    if (estado === 'realizada') return 'estado-realizada';
    return 'estado-cancelada';
  }

  cerrarModal() {
    const closeBtn = document.getElementById('btnCerrarRespuesta');
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
