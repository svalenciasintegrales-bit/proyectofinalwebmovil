import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// servicio de citas (visitas a los inmuebles)
@Injectable({
  providedIn: 'root'
})
export class Cita {
  // window.location.hostname: si la web se abre desde el celular con la IP del computador,
  // la api tambien se busca en esa IP (con localhost el celular se buscaria a si mismo)
  url = `http://${window.location.hostname}:3900/api`;

  constructor(private http: HttpClient) { }

  // estado: '' = todas, 'pendiente', 'confirmada', 'realizada' o 'cancelada'
  consulta(estado: string = '') {
    if (estado) {
      return this.http.get(`${this.url}/citas?estado=${estado}`);
    }
    return this.http.get(`${this.url}/citas`);
  }

  insertar(params: any) {
    return this.http.post(`${this.url}/save-cita`, params);
  }

  cambiarEstado(id: string, estado: string) {
    return this.http.put(`${this.url}/cita/${id}`, { estado: estado });
  }

  // el administrador responde la solicitud: el cliente ve la respuesta en la app
  responder(id: string, estado: string, respuesta: string) {
    return this.http.put(`${this.url}/cita/${id}`, { estado: estado, respuesta: respuesta });
  }

  eliminar(id: string) {
    return this.http.delete(`${this.url}/cita/${id}`);
  }
}
