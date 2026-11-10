import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

// servicio de inmuebles: habla con la api de node (backend)
@Injectable({
  providedIn: 'root'
})
export class Inmueble {
  // window.location.hostname: si la web se abre desde el celular con la IP del computador,
  // la api tambien se busca en esa IP (con localhost el celular se buscaria a si mismo)
  url = `http://${window.location.hostname}:3900/api`;

  constructor(private http: HttpClient) { }

  // todos los inmuebles (operacion: '' = todos, 'venta' o 'arriendo')
  consulta(operacion: string = '') {
    if (operacion) {
      return this.http.get(`${this.url}/inmuebles?operacion=${operacion}`);
    }
    return this.http.get(`${this.url}/inmuebles`);
  }

  consultaUno(id: string) {
    return this.http.get(`${this.url}/inmueble/${id}`);
  }

  // busca por el codigo del inmueble (el que aparece en el letrero, ej: CAR-102)
  consultaCodigo(codigo: string) {
    return this.http.get(`${this.url}/inmueble-codigo/${codigo}`);
  }

  buscar(texto: string) {
    return this.http.get(`${this.url}/search/${texto}`);
  }

  insertar(params: any) {
    return this.http.post(`${this.url}/save-inmueble`, params);
  }

  editar(id: string, params: any) {
    return this.http.put(`${this.url}/inmueble/${id}`, params);
  }

  eliminar(id: string) {
    return this.http.delete(`${this.url}/inmueble/${id}`);
  }

  // sube una o varias fotos al carrusel: se envian como formulario con la key file0 (igual que en postman)
  subirFotos(id: string, archivos: File[]) {
    const datos = new FormData();
    for (const archivo of archivos) {
      datos.append('file0', archivo);
    }
    return this.http.post(`${this.url}/upload-image/${id}`, datos);
  }

  // quita una foto del carrusel (si era la portada, la siguiente queda de portada)
  borrarFoto(id: string, imagen: string) {
    return this.http.delete(`${this.url}/inmueble/${id}/imagen/${imagen}`);
  }

  // direccion de la foto para ponerla en <img src="...">
  urlFoto(imagen: string) {
    return `${this.url}/get-image/${imagen}`;
  }

  // IP del computador en la red (la usa el aviso para armar la direccion del codigo QR)
  red() {
    return this.http.get(`${this.url}/red`);
  }
}
