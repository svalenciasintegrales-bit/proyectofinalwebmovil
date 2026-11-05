import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

// pagina para rutas que no existen (**)
@Component({
  selector: 'app-no-encontro',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="container text-center py-5">
      <div class="display-1 fw-bold text-rojo">404</div>
      <h1 class="h4">Esta página no existe</h1>
      <a routerLink="/" class="btn btn-negro mt-3">Ir al inicio</a>
    </div>
  `
})
export class NoEncontro { }
