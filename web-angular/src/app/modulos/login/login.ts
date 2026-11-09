import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Login as LoginService } from '../../servicios/login';

// inicio de sesion del panel administrativo
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  usuario: string = '';
  contrasena: string = '';
  error: string = '';
  enviando: boolean = false; // bloquea el boton mientras la api responde

  constructor(
    private slogin: LoginService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // al entrar al login se borra la sesion anterior
    sessionStorage.setItem("id", "");
    sessionStorage.setItem("usuario", "");
    sessionStorage.setItem("nombre", "");
    sessionStorage.setItem("rol", "");
  }

  consulta() {
    this.error = '';
    if (!this.usuario.trim() || !this.contrasena) {
      this.error = 'Escribe el usuario y la contraseña.';
      return;
    }
    if (this.enviando) return;
    this.enviando = true;

    this.slogin.consultar(this.usuario, this.contrasena).subscribe({
      next: (resultado: any) => {
        this.enviando = false;
        if (resultado.status == "success") {
          sessionStorage.setItem("id", resultado.usuario._id);
          sessionStorage.setItem("usuario", resultado.usuario.usuario);
          sessionStorage.setItem("nombre", resultado.usuario.nombre);
          sessionStorage.setItem("rol", resultado.usuario.rol); // administrador o asesor

          this.router.navigate(['/panel/tablero']);
        } else {
          this.error = resultado.message;
          this.cdr.detectChanges();
        }
      },
      // 401 = usuario o contraseña incorrectos | sin respuesta = la api esta apagada
      error: (err: any) => {
        this.enviando = false;
        this.error = (err.error && err.error.message ? err.error.message : 'No hay conexión con el servidor.');
        this.cdr.detectChanges();
      }
    });
  }
}
