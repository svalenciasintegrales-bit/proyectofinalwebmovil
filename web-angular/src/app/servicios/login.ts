import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

// servicio de login del panel administrativo
@Injectable({
  providedIn: 'root',
})
export class Login {
  // window.location.hostname: si la web se abre desde el celular con la IP del computador,
  // la api tambien se busca en esa IP (con localhost el celular se buscaria a si mismo)
  url = `http://${window.location.hostname}:3900/api`;

  constructor(private http: HttpClient) { }

  consultar(usuario: string, contrasena: string) {
    return this.http.post(`${this.url}/login`, { usuario: usuario, contrasena: contrasena });
  }
}
