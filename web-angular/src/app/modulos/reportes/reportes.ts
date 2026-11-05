import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Cita } from '../../servicios/cita';
import { Inmueble } from '../../servicios/inmueble';
import { Cliente } from '../../servicios/cliente';

// panel: REPORTES para la toma de decisiones (solo administrador)
// 1. solicitudes entre dos fechas con totales por tipo y estado
// 2. inventario de inmuebles con el numero de solicitudes de cada uno
// Ambos se pueden descargar en Excel (archivo CSV) o imprimir / guardar en PDF.
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reportes.html',
  styleUrl: './reportes.css'
})
export class Reportes implements OnInit {
  esAdministrador: boolean = false;
  pestana: string = 'solicitudes'; // 'solicitudes' o 'inventario'
  solicitudes: any[] = [];
  inmuebles: any[] = [];
  clientes: any[] = [];

  hoyTexto: string = new Date().toLocaleDateString('es-CO');

  // reporte 1
  desde: string = '';
  hasta: string = '';
  error: string = '';
  generado: boolean = false;
  filas: any[] = [];
  totales: any = { total: 0, visitas: 0, informacion: 0, pendiente: 0, confirmada: 0, realizada: 0, cancelada: 0 };

  // reporte 2
  inventario: any[] = [];
  resumen: any = { total: 0, disponibles: 0, arrendados: 0, vendidos: 0, valorVenta: 0 };

  constructor(private scita: Cita, private sinmueble: Inmueble, private scliente: Cliente, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.esAdministrador = sessionStorage.getItem('rol') === 'administrador';
    if (!this.esAdministrador) return;

    // por defecto: el mes actual
    const hoy = new Date();
    this.desde = this.textoFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
    this.hasta = this.textoFecha(hoy);

    let respuestas = 0;
    const listo = () => {
      respuestas++;
      if (respuestas === 3) {
        this.generar();
        this.armarInventario();
        this.cdr.detectChanges();
      }
    };
    this.scita.consulta().subscribe({ next: (r: any) => { this.solicitudes = r.citas; listo(); }, error: () => { this.solicitudes = []; listo(); } });
    this.sinmueble.consulta().subscribe({ next: (r: any) => { this.inmuebles = r.inmuebles; listo(); }, error: () => { this.inmuebles = []; listo(); } });
    this.scliente.consulta().subscribe({ next: (r: any) => { this.clientes = r.clientes; listo(); }, error: () => { this.clientes = []; listo(); } });
  }

  textoFecha(fecha: Date) {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

  inmuebleDe(id: string) { return this.inmuebles.find((i: any) => i._id === id); }
  clienteDe(id: string) { return this.clientes.find((c: any) => c._id === id); }

  // ---------- REPORTE 1: SOLICITUDES POR FECHAS ----------
  generar() {
    this.error = '';
    if (!this.desde || !this.hasta) {
      this.error = 'Elige la fecha inicial y la fecha final.';
      return;
    }
    if (this.desde > this.hasta) {
      this.error = 'El rango de fechas no es válido: la fecha final es anterior a la inicial.';
      this.generado = false;
      return;
    }
    const t: any = { total: 0, visitas: 0, informacion: 0, pendiente: 0, confirmada: 0, realizada: 0, cancelada: 0 };
    const filas: any[] = [];
    for (const s of this.solicitudes) {
      const dia = this.textoFecha(new Date(s.fecha)); // dia en que llego la solicitud
      if (dia < this.desde || dia > this.hasta) continue;
      filas.push(s);
      t.total++;
      if (s.tipo === 'informacion') t.informacion++; else t.visitas++;
      if (t[s.estado] !== undefined) t[s.estado]++;
    }
    this.filas = filas;
    this.totales = t;
    this.generado = true;
  }

  // ---------- REPORTE 2: INVENTARIO ----------
  armarInventario() {
    const lista: any[] = [];
    const r: any = { total: 0, disponibles: 0, arrendados: 0, vendidos: 0, valorVenta: 0 };
    for (const i of this.inmuebles) {
      let total = 0;
      for (const s of this.solicitudes) if (s.inmueble_id === i._id) total++;
      lista.push({ inmueble: i, solicitudes: total });
      r.total++;
      if (i.estado === 'disponible') r.disponibles++;
      if (i.estado === 'arrendado') r.arrendados++;
      if (i.estado === 'vendido') r.vendidos++;
      if (i.operacion === 'venta' && i.estado === 'disponible') r.valorVenta += Number(i.precio) || 0;
    }
    lista.sort((a: any, b: any) => b.solicitudes - a.solicitudes);
    this.inventario = lista;
    this.resumen = r;
  }

  // ---------- DESCARGAR EN EXCEL (CSV) ----------
  // CSV = texto separado por ";" que Excel abre como tabla. El ﻿ hace que Excel lea bien las tildes.
  descargar() {
    let lineas: string[] = [];
    let nombre = '';
    if (this.pestana === 'solicitudes') {
      nombre = `reporte-solicitudes-${this.desde}-a-${this.hasta}.csv`;
      lineas.push('Fecha;Tipo;Cliente;Telefono;Codigo;Inmueble;Fecha visita;Hora;Mensaje;Respuesta;Estado');
      for (const s of this.filas) {
        const c = this.clienteDe(s.cliente_id);
        const i = this.inmuebleDe(s.inmueble_id);
        lineas.push([
          this.textoFecha(new Date(s.fecha)), s.tipo === 'informacion' ? 'Informacion' : 'Visita',
          c?.nombre || '', c?.telefono || '', i?.codigo || '', i?.titulo || '',
          s.fecha_cita ? String(s.fecha_cita).substring(0, 10) : '', s.hora || '',
          s.observaciones || '', s.respuesta || '', s.estado
        ].map(v => this.celda(v)).join(';'));
      }
      lineas.push('');
      lineas.push(`Total;${this.totales.total};Visitas;${this.totales.visitas};Informacion;${this.totales.informacion}`);
    } else {
      nombre = `reporte-inventario-${this.textoFecha(new Date())}.csv`;
      lineas.push('Codigo;Titulo;Tipo;Operacion;Precio;Barrio;Ciudad;Estado;Solicitudes');
      for (const fila of this.inventario) {
        const i = fila.inmueble;
        lineas.push([i.codigo, i.titulo, i.tipo, i.operacion, i.precio, i.barrio, i.ciudad, i.estado, fila.solicitudes].map(v => this.celda(v)).join(';'));
      }
    }
    const archivo = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  // pone comillas si el texto tiene ; o comillas, para que no se corran las columnas
  celda(valor: any) {
    const texto = String(valor ?? '');
    if (texto.includes(';') || texto.includes('"') || texto.includes('\n')) {
      return '"' + texto.split('"').join('""') + '"';
    }
    return texto;
  }

  // imprimir: el navegador deja guardar como PDF
  imprimir() {
    window.print();
  }

  colorEstado(estado: string) {
    if (estado === 'pendiente') return 'estado-pendiente';
    if (estado === 'confirmada' || estado === 'disponible') return 'estado-confirmada';
    if (estado === 'realizada') return 'estado-realizada';
    return 'estado-cancelada';
  }
}
