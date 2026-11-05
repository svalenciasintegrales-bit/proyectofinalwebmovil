import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cliente } from '../../servicios/cliente';
import { mensajeError } from '../../servicios/errores';

// panel: CRUD de clientes
@Component({
  selector: 'app-clientes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './clientes.html',
  styleUrl: './clientes.css'
})
export class Clientes implements OnInit {
  clientes: any[] = [];
  objCliente: any = { nombre: '', telefono: '', correo: '' };
  validarFormulario: boolean = false;
  editingId: string | null = null;
  mensaje: string = '';
  error: string = '';
  errorTabla: string = ''; // ej: no se puede eliminar porque tiene solicitudes
  enviando: boolean = false; // bloquea el boton mientras la api responde

  constructor(private scliente: Cliente, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.consultar();
  }

  consultar() {
    this.scliente.consulta().subscribe({
      next: (res: any) => {
        this.clientes = res.clientes;
        this.cdr.detectChanges();
      },
      error: () => {
        this.clientes = [];
        this.cdr.detectChanges();
      }
    });
  }

  // reglas de cada campo: devuelve el error que se muestra debajo del campo, o '' si esta bien
  errorCampo(campo: string): string {
    const o = this.objCliente;
    if (campo === 'nombre' && String(o.nombre || '').trim().length < 3) return 'Escribe el nombre completo (mínimo 3 letras).';
    if (campo === 'telefono' && !/^\d{7,10}$/.test(String(o.telefono || '').replace(/\s/g, ''))) return 'El teléfono debe tener entre 7 y 10 números.';
    if (campo === 'correo' && o.correo && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(o.correo)) return 'El correo no es válido (ej: nombre@correo.com).';
    return '';
  }

  guardar() {
    this.error = '';
    this.validarFormulario = true;
    if (['nombre', 'telefono', 'correo'].some(c => this.errorCampo(c)) || this.enviando) return;

    this.enviando = true;
    const texto = this.editingId ? 'Cliente actualizado con éxito.' : 'Cliente registrado con éxito.';
    const peticion = this.editingId
      ? this.scliente.editar(this.editingId, this.objCliente)
      : this.scliente.insertar(this.objCliente);

    peticion.subscribe({
      next: (res: any) => this.respuesta(res, texto),
      error: (err: any) => {
        this.enviando = false;
        this.error = mensajeError(err); // lo escrito se conserva en el formulario
        this.cdr.detectChanges();
      }
    });
  }

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

  editar(cli: any) {
    this.editingId = cli._id;
    this.validarFormulario = false;
    this.error = '';
    this.objCliente = { nombre: cli.nombre, telefono: cli.telefono, correo: cli.correo };
  }

  eliminar(cli: any) {
    if (confirm(`¿Está seguro de eliminar a ${cli.nombre}?`)) {
      this.errorTabla = '';
      this.scliente.eliminar(cli._id).subscribe({
        next: () => {
          this.consultar();
          this.mostrarMensaje('Cliente eliminado con éxito.');
        },
        error: (err: any) => {
          this.errorTabla = mensajeError(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  nuevo() {
    this.editingId = null;
    this.objCliente = { nombre: '', telefono: '', correo: '' };
    this.validarFormulario = false;
    this.error = '';
  }

  cerrarModal() {
    const closeBtn = document.getElementById('btnCerrarModalCliente');
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
