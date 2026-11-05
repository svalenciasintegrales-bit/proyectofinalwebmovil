import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Usuario } from '../../servicios/usuario';
import { mensajeError } from '../../servicios/errores';

// panel: usuarios que pueden entrar al panel (solo el administrador los gestiona)
@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {
  usuarios: any[] = [];
  objUsuario: any = { nombre: '', usuario: '', contrasena: '', rol: 'asesor' };
  validarFormulario: boolean = false;
  mensaje: string = '';
  error: string = '';
  enviando: boolean = false; // bloquea el boton mientras la api responde
  errorTabla: string = '';
  esAdministrador: boolean = false;
  idActual: string = '';

  constructor(private susuario: Usuario, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.esAdministrador = sessionStorage.getItem('rol') === 'administrador';
    this.idActual = sessionStorage.getItem('id') || '';
    if (this.esAdministrador) this.consultar();
  }

  consultar() {
    this.susuario.consulta().subscribe({
      next: (res: any) => {
        this.usuarios = res.usuarios;
        this.cdr.detectChanges();
      },
      error: () => {
        this.usuarios = [];
        this.cdr.detectChanges();
      }
    });
  }

  guardar() {
    this.error = '';
    this.validarFormulario = true;
    if (!this.objUsuario.nombre || !this.objUsuario.usuario || !this.objUsuario.contrasena || this.objUsuario.contrasena.length < 4 || this.enviando) {
      return;
    }
    this.enviando = true;
    this.susuario.insertar(this.objUsuario).subscribe({
      next: () => {
        this.enviando = false;
        this.validarFormulario = false;
        this.cerrarModal();
        this.consultar();
        this.mostrarMensaje('Usuario creado con éxito.');
      },
      // ej: 409 el usuario ya existe -> se muestra el mensaje y se conserva lo escrito
      error: (err: any) => {
        this.enviando = false;
        this.error = mensajeError(err);
        this.cdr.detectChanges();
      }
    });
  }

  eliminar(u: any) {
    this.errorTabla = '';
    if (confirm(`¿Está seguro de eliminar el usuario ${u.usuario}?`)) {
      this.susuario.eliminar(u._id, this.idActual).subscribe({
        next: () => {
          this.consultar();
          this.mostrarMensaje('Usuario eliminado con éxito.');
        },
        error: (err: any) => {
          this.errorTabla = mensajeError(err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  nuevo() {
    this.objUsuario = { nombre: '', usuario: '', contrasena: '', rol: 'asesor' };
    this.validarFormulario = false;
    this.error = '';
  }

  iniciales(nombre: string) {
    const partes = String(nombre || '').trim().split(' ');
    let texto = '';
    for (let i = 0; i < partes.length && i < 2; i++) texto += partes[i].charAt(0);
    return texto.toUpperCase();
  }

  cerrarModal() {
    const closeBtn = document.getElementById('btnCerrarUsuario');
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
