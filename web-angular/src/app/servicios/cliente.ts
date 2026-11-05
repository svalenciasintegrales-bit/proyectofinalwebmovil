import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// servicio de clientes
@Injectable({
  providedIn: 'root'
})
export class Cliente {
  // window.location.hostname: si la web se abre desde el celular con la IP del computador,
  // la api tambien se busca en esa IP (con localhost el celular se buscaria a si mismo)
  url = `http://${window.location.hostname}:3900/api`;

  constructor(private http: HttpClient) { }

  consulta() {
    return this.http.get(`${this.url}/clientes`);
  }

  insertar(params: any) {
    return this.http.post(`${this.url}/save-cliente`, params);
  }

  editar(id: string, params: any) {
    return this.http.put(`${this.url}/cliente/${id}`, params);
  }

  eliminar(id: string) {
    return this.http.delete(`${this.url}/cliente/${id}`);
  }
}
