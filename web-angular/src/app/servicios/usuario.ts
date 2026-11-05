import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// servicio de usuarios del panel (administradores y asesores)
@Injectable({
  providedIn: 'root'
})
export class Usuario {
  url = `http://${window.location.hostname}:3900/api`;

  constructor(private http: HttpClient) { }

  consulta() {
    return this.http.get(`${this.url}/usuarios`);
  }

  insertar(params: any) {
    return this.http.post(`${this.url}/save-usuario`, params);
  }

  // actual = id del usuario con sesion abierta (la api no deja que se borre a si mismo)
  eliminar(id: string, actual: string) {
    return this.http.delete(`${this.url}/usuario/${id}?actual=${actual}`);
  }
}
