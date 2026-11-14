import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { Cita } from '../../servicios/cita';
import { Inmueble } from '../../servicios/inmueble';
import { Cliente } from '../../servicios/cliente';

// panel: REPORTES para la toma de decisiones (solo administrador)
// 1. solicitudes entre dos fechas: indicadores con la variacion frente al periodo anterior,
//    tendencia por dia, solicitudes por estado, inmuebles mas pedidos y dias preferidos para visitar
// 2. inventario de inmuebles: portafolio por estado, tipo y operacion, y solicitudes de cada uno
// Ambos se pueden descargar en Excel (archivo CSV) o imprimir / guardar en PDF.
@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, FormsModule, BaseChartDirective],
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

  // ---------- reporte 1 ----------
  desde: string = '';
  hasta: string = '';
  rapido: string = 'mes'; // boton de rango rapido elegido: '7', '30', 'mes', 'anio' o '' (a mano)
  error: string = '';
  generado: boolean = false;
  filas: any[] = [];
  totales: any = { total: 0, visitas: 0, informacion: 0, pendiente: 0, confirmada: 0, realizada: 0, cancelada: 0 };
  anterior: any = { total: 0, visitas: 0, informacion: 0, clientes: 0, atencion: 0 }; // periodo anterior del mismo largo
  textoAnterior: string = '';
  indicadores: any = { atencion: 0, cancelacion: 0, conversion: 0, clientesNuevos: 0, horaTop: '—', respondidas: 0 };
  topInmuebles: any[] = []; // [{ inmueble, total, porcentaje }]
  semana: any[] = []; // [{ dia, total, porcentaje }]
  mejorDia: any = null;

  // ---------- reporte 2 ----------
  inventario: any[] = [];
  maxSolicitudes: number = 0;
  resumen: any = { total: 0, disponibles: 0, arrendados: 0, vendidos: 0, valorVenta: 0, canonArriendo: 0, promedioVenta: 0, ocupacion: 0 };
  tipos: any[] = []; // [{ tipo, total, porcentaje }]

  colores = { rojo: '#e3141b', rojoOsc: '#8b0000', negro: '#111111', gris: '#9ca3af', verde: '#16a34a', azul: '#2563eb', ambar: '#d97706' };

  // ---------- GRAFICAS (ng2-charts / Chart.js) ----------
  // tendencia: linea con area de las solicitudes por dia (visitas e informacion)
  tendenciaData: ChartConfiguration<'line'>['data'] = { labels: [], datasets: [] };
  tendenciaOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'top', align: 'end', labels: { usePointStyle: true, boxWidth: 8 } },
      tooltip: { backgroundColor: '#111111', padding: 10, cornerRadius: 8 }
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } },
      y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } }
    }
  };

  // solicitudes por estado y portafolio por estado / operacion: donas
  estadosData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  portafolioData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  operacionData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  donaOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    plugins: {
      legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 14 } },
      tooltip: { backgroundColor: '#111111', padding: 10, cornerRadius: 8 }
    }
  };

  // inventario: solicitudes por inmueble (barras horizontales)
  solicitudesInmuebleData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  barrasOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { backgroundColor: '#111111', padding: 10, cornerRadius: 8 } },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { grid: { display: false } }
    }
  };

  constructor(private scita: Cita, private sinmueble: Inmueble, private scliente: Cliente, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.esAdministrador = sessionStorage.getItem('rol') === 'administrador';
    if (!this.esAdministrador) return;

    this.rango('mes'); // por defecto: el mes actual

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

  // convierte 'AAAA-MM-DD' en una fecha local (sin problemas de zona horaria)
  fechaDeTexto(texto: string) {
    return new Date(Number(texto.substring(0, 4)), Number(texto.substring(5, 7)) - 1, Number(texto.substring(8, 10)));
  }

  // botones de rango rapido: ultimos 7 dias, ultimos 30 dias, este mes y este año
  rango(tipo: string) {
    const hoy = new Date();
    let inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    if (tipo === '7') inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 6);
    if (tipo === '30') inicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - 29);
    if (tipo === 'anio') inicio = new Date(hoy.getFullYear(), 0, 1);
    this.rapido = tipo;
    this.desde = this.textoFecha(inicio);
    this.hasta = this.textoFecha(hoy);
    if (this.solicitudes.length > 0 || this.generado) this.generar();
  }

  // "relacion manual": buscar en la lista el inmueble o el cliente con ese id
  inmuebleDe(id: string) {
    for (const i of this.inmuebles) {
      if (i._id === id) return i;
    }
    return null;
  }

  clienteDe(id: string) {
    for (const c of this.clientes) {
      if (c._id === id) return c;
    }
    return null;
  }

  // ordena la lista de mayor a menor (o de menor a mayor) segun un campo, con dos ciclos for
  ordenar(lista: any[], campo: string, mayorPrimero: boolean) {
    for (let a = 0; a < lista.length; a++) {
      for (let b = a + 1; b < lista.length; b++) {
        const cambiar = mayorPrimero ? lista[b][campo] > lista[a][campo] : lista[b][campo] < lista[a][campo];
        if (cambiar) {
          const temporal = lista[a];
          lista[a] = lista[b];
          lista[b] = temporal;
        }
      }
    }
  }

  // porcentaje sin decimales; si el total es 0 devuelve 0
  porcentaje(parte: number, total: number) {
    return total > 0 ? Math.round(parte / total * 100) : 0;
  }

  // variacion frente al periodo anterior. null = no hay con que comparar
  variacion(actual: number, antes: number) {
    if (antes === 0) return actual > 0 ? null : 0;
    return Math.round((actual - antes) / antes * 100);
  }

  // cuenta las solicitudes y los clientes de un rango de fechas (texto AAAA-MM-DD)
  contarRango(desde: string, hasta: string) {
    const t: any = { total: 0, visitas: 0, informacion: 0, pendiente: 0, confirmada: 0, realizada: 0, cancelada: 0, clientes: 0, lista: [] };
    for (const s of this.solicitudes) {
      const dia = this.textoFecha(new Date(s.fecha)); // dia en que llego la solicitud
      if (dia < desde || dia > hasta) continue;
      t.lista.push(s);
      t.total++;
      if (s.tipo === 'informacion') t.informacion++; else t.visitas++;
      if (t[s.estado] !== undefined) t[s.estado]++;
    }
    for (const c of this.clientes) {
      const dia = this.textoFecha(new Date(c.fecha || c.createdAt));
      if (dia >= desde && dia <= hasta) t.clientes++;
    }
    return t;
  }

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

    const t = this.contarRango(this.desde, this.hasta);
    this.filas = t.lista;
    this.totales = t;

    // periodo anterior: los mismos dias justo antes de "desde"
    const inicio = this.fechaDeTexto(this.desde);
    const fin = this.fechaDeTexto(this.hasta);
    const dias = Math.round((fin.getTime() - inicio.getTime()) / 86400000) + 1;
    const antesFin = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() - 1);
    const antesInicio = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() - dias);
    const a = this.contarRango(this.textoFecha(antesInicio), this.textoFecha(antesFin));
    this.anterior = { total: a.total, visitas: a.visitas, informacion: a.informacion, clientes: a.clientes, atencion: this.porcentaje(a.total - a.pendiente, a.total) };
    this.textoAnterior = `vs. ${antesInicio.toLocaleDateString('es-CO')} – ${antesFin.toLocaleDateString('es-CO')}`;

    // indicadores
    let respondidas = 0;
    let visitasRealizadas = 0;
    const horas: any = {};
    for (const s of this.filas) {
      if (s.respuesta) respondidas++;
      if (s.tipo !== 'informacion' && s.estado === 'realizada') visitasRealizadas++;
      if (s.tipo !== 'informacion' && s.hora) horas[s.hora] = (horas[s.hora] || 0) + 1;
    }
    let horaTop = '—';
    let maxHora = 0;
    for (const h in horas) {
      if (horas[h] > maxHora) { maxHora = horas[h]; horaTop = h; }
    }
    this.indicadores = {
      atencion: this.porcentaje(t.total - t.pendiente, t.total),
      cancelacion: this.porcentaje(t.cancelada, t.total),
      conversion: this.porcentaje(visitasRealizadas, t.visitas),
      clientesNuevos: t.clientes,
      horaTop: horaTop,
      respondidas: respondidas
    };

    this.armarTendencia(inicio, dias);
    this.armarEstados();
    this.armarTopInmuebles();
    this.armarSemana();
    this.generado = true;
    this.cdr.detectChanges();
  }

  // GRAFICA: solicitudes por dia del rango (si el rango es de mas de 62 dias, se agrupa por mes)
  armarTendencia(inicio: Date, dias: number) {
    const etiquetas: string[] = [];
    const claves: string[] = [];
    const porMes = dias > 62;
    const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
    for (let k = 0; k < dias; k++) {
      const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + k);
      const clave = porMes ? this.textoFecha(d).substring(0, 7) : this.textoFecha(d);
      if (claves.indexOf(clave) >= 0) continue;
      claves.push(clave);
      etiquetas.push(porMes ? meses[d.getMonth()] + ' ' + d.getFullYear() : d.getDate() + ' ' + meses[d.getMonth()]);
    }
    const visitas: number[] = [];
    const info: number[] = [];
    for (let k = 0; k < claves.length; k++) { visitas.push(0); info.push(0); }
    for (const s of this.filas) {
      const dia = this.textoFecha(new Date(s.fecha));
      const pos = claves.indexOf(porMes ? dia.substring(0, 7) : dia);
      if (pos < 0) continue;
      if (s.tipo === 'informacion') info[pos]++; else visitas[pos]++;
    }
    this.tendenciaData = {
      labels: etiquetas,
      datasets: [
        { label: 'Visitas', data: visitas, borderColor: this.colores.rojo, backgroundColor: 'rgba(227,20,27,0.12)', fill: true, cubicInterpolationMode: 'monotone', borderWidth: 2, pointRadius: 2, pointHoverRadius: 5 },
        { label: 'Información', data: info, borderColor: this.colores.negro, backgroundColor: 'rgba(17,17,17,0.05)', fill: true, cubicInterpolationMode: 'monotone', borderWidth: 2, pointRadius: 2, pointHoverRadius: 5 }
      ]
    };
  }

  // GRAFICA: solicitudes por estado (dona)
  armarEstados() {
    this.estadosData = {
      labels: ['Pendientes', 'Confirmadas', 'Realizadas', 'Canceladas'],
      datasets: [{
        data: [this.totales.pendiente, this.totales.confirmada, this.totales.realizada, this.totales.cancelada],
        backgroundColor: [this.colores.ambar, this.colores.azul, this.colores.verde, this.colores.gris],
        borderWidth: 0
      }]
    };
  }

  // ranking: los 5 inmuebles con mas solicitudes en el rango
  armarTopInmuebles() {
    const lista: any[] = [];
    for (const i of this.inmuebles) {
      let total = 0;
      for (const s of this.filas) if (s.inmueble_id === i._id) total++;
      if (total > 0) lista.push({ inmueble: i, total: total });
    }
    this.ordenar(lista, 'total', true);
    const top = lista.slice(0, 5);
    const maximo = top.length > 0 ? top[0].total : 0;
    for (const f of top) f.porcentaje = this.porcentaje(f.total, maximo);
    this.topInmuebles = top;
  }

  // dias de la semana que mas piden para visitar (segun la fecha de la cita)
  armarSemana() {
    const nombres = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
    const totales = [0, 0, 0, 0, 0, 0, 0];
    for (const s of this.filas) {
      if (s.tipo === 'informacion' || !s.fecha_cita) continue;
      const diaJs = new Date(s.fecha_cita).getUTCDay(); // 0 = domingo
      const pos = diaJs === 0 ? 6 : diaJs - 1;
      totales[pos]++;
    }
    let maximo = 0;
    for (const n of totales) if (n > maximo) maximo = n;
    const semana: any[] = [];
    this.mejorDia = null;
    for (let k = 0; k < 7; k++) {
      const fila = { dia: nombres[k], total: totales[k], porcentaje: this.porcentaje(totales[k], maximo) };
      semana.push(fila);
      if (maximo > 0 && totales[k] === maximo && !this.mejorDia) this.mejorDia = fila;
    }
    this.semana = semana;
  }

  // ---------- REPORTE 2: INVENTARIO ----------
  armarInventario() {
    const lista: any[] = [];
    const r: any = { total: 0, disponibles: 0, arrendados: 0, vendidos: 0, valorVenta: 0, canonArriendo: 0, promedioVenta: 0, ocupacion: 0 };
    const porTipo: any = {};
    let enVenta = 0;
    let venta = 0;
    let arriendo = 0;
    for (const i of this.inmuebles) {
      let total = 0;
      for (const s of this.solicitudes) if (s.inmueble_id === i._id) total++;
      lista.push({ inmueble: i, solicitudes: total });
      r.total++;
      if (i.estado === 'disponible') r.disponibles++;
      if (i.estado === 'arrendado') r.arrendados++;
      if (i.estado === 'vendido') r.vendidos++;
      if (i.operacion === 'venta') venta++; else arriendo++;
      if (i.operacion === 'venta' && i.estado === 'disponible') { r.valorVenta += Number(i.precio) || 0; enVenta++; }
      if (i.operacion === 'arriendo' && i.estado === 'disponible') r.canonArriendo += Number(i.precio) || 0;
      porTipo[i.tipo] = (porTipo[i.tipo] || 0) + 1;
    }
    r.promedioVenta = enVenta > 0 ? Math.round(r.valorVenta / enVenta) : 0;
    r.ocupacion = this.porcentaje(r.arrendados + r.vendidos, r.total); // inmuebles que ya se cerraron
    this.ordenar(lista, 'solicitudes', true); // el mas solicitado primero
    this.inventario = lista;
    this.maxSolicitudes = lista.length > 0 ? lista[0].solicitudes : 0;
    this.resumen = r;

    const tipos: any[] = [];
    for (const t in porTipo) tipos.push({ tipo: t, total: porTipo[t], porcentaje: this.porcentaje(porTipo[t], r.total) });
    this.ordenar(tipos, 'total', true);
    this.tipos = tipos;

    this.portafolioData = {
      labels: ['Disponibles', 'Arrendados', 'Vendidos'],
      datasets: [{ data: [r.disponibles, r.arrendados, r.vendidos], backgroundColor: [this.colores.verde, this.colores.azul, this.colores.rojoOsc], borderWidth: 0 }]
    };
    this.operacionData = {
      labels: ['En venta', 'En arriendo'],
      datasets: [{ data: [venta, arriendo], backgroundColor: [this.colores.rojo, this.colores.negro], borderWidth: 0 }]
    };
    const etiquetas: string[] = [];
    const valores: number[] = [];
    for (const f of lista.slice(0, 8)) {
      etiquetas.push(f.inmueble.codigo);
      valores.push(f.solicitudes);
    }
    this.solicitudesInmuebleData = {
      labels: etiquetas,
      datasets: [{ data: valores, label: 'Solicitudes', backgroundColor: this.colores.rojo, borderRadius: 6, barThickness: 16 }]
    };
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
        lineas.push(this.linea([
          this.textoFecha(new Date(s.fecha)), s.tipo === 'informacion' ? 'Informacion' : 'Visita',
          c?.nombre || '', c?.telefono || '', i?.codigo || '', i?.titulo || '',
          s.fecha_cita ? String(s.fecha_cita).substring(0, 10) : '', s.hora || '',
          s.observaciones || '', s.respuesta || '', s.estado
        ]));
      }
      lineas.push('');
      lineas.push(`Total;${this.totales.total};Visitas;${this.totales.visitas};Informacion;${this.totales.informacion}`);
      lineas.push(`Atencion %;${this.indicadores.atencion};Cancelacion %;${this.indicadores.cancelacion};Clientes nuevos;${this.indicadores.clientesNuevos}`);
    } else {
      nombre = `reporte-inventario-${this.textoFecha(new Date())}.csv`;
      lineas.push('Codigo;Titulo;Tipo;Operacion;Precio;Barrio;Ciudad;Estado;Solicitudes');
      for (const fila of this.inventario) {
        const i = fila.inmueble;
        lineas.push(this.linea([i.codigo, i.titulo, i.tipo, i.operacion, i.precio, i.barrio, i.ciudad, i.estado, fila.solicitudes]));
      }
    }
    const archivo = new Blob(['﻿' + lineas.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const enlace = document.createElement('a');
    enlace.href = URL.createObjectURL(archivo);
    enlace.download = nombre;
    enlace.click();
    URL.revokeObjectURL(enlace.href);
  }

  // une los valores de una fila del CSV separados por ;
  linea(valores: any[]) {
    let texto = '';
    for (let k = 0; k < valores.length; k++) {
      if (k > 0) texto += ';';
      texto += this.celda(valores[k]);
    }
    return texto;
  }

  // pone comillas si el texto tiene ; o comillas, para que no se corran las columnas
  celda(valor: any) {
    const texto = String(valor ?? '');
    if (texto.indexOf(';') >= 0 || texto.indexOf('"') >= 0 || texto.indexOf('\n') >= 0) {
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
