import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { Inmueble } from '../../servicios/inmueble';
import { Cita } from '../../servicios/cita';
import { Cliente } from '../../servicios/cliente';

// TABLERO del administrador: indicadores, graficas, agenda de visitas y ultimas solicitudes.
// Todo se calcula con los datos de MongoDB que entrega la API (inmuebles, solicitudes y clientes).
@Component({
  selector: 'app-tablero',
  standalone: true,
  imports: [CommonModule, RouterModule, BaseChartDirective],
  templateUrl: './tablero.html',
  styleUrl: './tablero.css',
})
export class Tablero implements OnInit {
  inmuebles: any[] = [];
  solicitudes: any[] = [];
  clientes: any[] = [];
  cargando: boolean = true;
  respuestas: number = 0; // cuantas consultas a la api ya respondieron (son 3)
  nombre: string = '';
  saludo: string = '';

  // indicadores (tarjetas de arriba)
  kpi: any = {
    pendientes: 0, nuevasHoy: 0,
    visitasProximas: 0, proximaVisita: null,
    disponibles: 0, totalInmuebles: 0, noDisponibles: 0,
    valorVenta: 0, enVenta: 0,
    clientes: 0, clientesSemana: 0,
    atencion: 0, atendidas: 0
  };

  agenda: any[] = []; // proximas visitas
  ultimas: any[] = []; // ultimas solicitudes
  destacado: any = null; // inmueble con mas solicitudes
  destacadoTotal: number = 0;

  colores = { rojo: '#e3141b', rojoOsc: '#8b0000', negro: '#111111', gris: '#9ca3af', verde: '#16a34a', azul: '#2563eb', ambar: '#d97706' };

  // ---------- GRAFICA 1: solicitudes de los ultimos 14 dias (barras apiladas) ----------
  actividadData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  actividadOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } },
    scales: {
      x: { stacked: true, grid: { display: false } },
      y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } }
    }
  };

  // ---------- GRAFICA 2: solicitudes por estado (dona) ----------
  estadosData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };
  donaOptions: ChartOptions<'doughnut'> = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } } }
  };

  // ---------- GRAFICA 3: inmuebles mas solicitados (barras horizontales) ----------
  topData: ChartConfiguration<'bar'>['data'] = { labels: [], datasets: [] };
  topOptions: ChartOptions<'bar'> = {
    indexAxis: 'y',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { grid: { display: false } }
    }
  };

  // ---------- GRAFICA 4: portafolio venta / arriendo (dona) ----------
  portafolioData: ChartConfiguration<'doughnut'>['data'] = { labels: [], datasets: [] };

  constructor(
    public sinmueble: Inmueble,
    private scita: Cita,
    private scliente: Cliente,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.nombre = (sessionStorage.getItem('nombre') || 'Administrador').split(' ')[0];
    const hora = new Date().getHours();
    this.saludo = hora < 12 ? 'Buenos días' : (hora < 19 ? 'Buenas tardes' : 'Buenas noches');

    // se piden los 3 listados; cuando llegan los 3 se calcula el tablero
    this.sinmueble.consulta().subscribe({
      next: (res: any) => { this.inmuebles = res.inmuebles; this.listo(); },
      error: () => { this.inmuebles = []; this.listo(); }
    });
    this.scita.consulta().subscribe({
      next: (res: any) => { this.solicitudes = res.citas; this.listo(); },
      error: () => { this.solicitudes = []; this.listo(); }
    });
    this.scliente.consulta().subscribe({
      next: (res: any) => { this.clientes = res.clientes; this.listo(); },
      error: () => { this.clientes = []; this.listo(); }
    });
  }

  listo() {
    this.respuestas++;
    if (this.respuestas < 3) return;
    this.calcular();
    this.cargando = false;
    this.cdr.detectChanges();
  }

  // ---------- AYUDAS ----------
  // fecha AAAA-MM-DD de hoy (hora local) para comparar con las fechas de MongoDB
  textoFecha(fecha: Date) {
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    return `${fecha.getFullYear()}-${mes}-${dia}`;
  }

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

  // ---------- CALCULOS DEL TABLERO ----------
  calcular() {
    const hoy = new Date();
    const textoHoy = this.textoFecha(hoy);
    const hace7 = new Date(hoy.getTime() - 7 * 86400000);
    const en7 = this.textoFecha(new Date(hoy.getTime() + 7 * 86400000));

    // --- indicadores de solicitudes ---
    let pendientes = 0, nuevasHoy = 0, atendidas = 0;
    const conteoEstados: any = { pendiente: 0, confirmada: 0, realizada: 0, cancelada: 0 };
    const conteoInmueble: any = {};
    const proximas: any[] = [];

    for (const s of this.solicitudes) {
      if (s.estado === 'pendiente') pendientes++;
      else atendidas++;
      if (conteoEstados[s.estado] !== undefined) conteoEstados[s.estado]++;
      if (this.textoFecha(new Date(s.fecha)) === textoHoy) nuevasHoy++;
      conteoInmueble[s.inmueble_id] = (conteoInmueble[s.inmueble_id] || 0) + 1;

      // visitas que vienen (hoy en adelante) que no esten canceladas
      if (s.tipo !== 'informacion' && s.fecha_cita && s.estado !== 'cancelada' && s.estado !== 'realizada') {
        const dia = String(s.fecha_cita).substring(0, 10);
        if (dia >= textoHoy) proximas.push(s);
      }
    }
    this.ordenar(proximas, 'fecha_cita', false); // la visita mas cercana primero

    // --- indicadores de inmuebles ---
    let disponibles = 0, valorVenta = 0, enVenta = 0, venta = 0, arriendo = 0;
    for (const i of this.inmuebles) {
      if (i.estado === 'disponible') disponibles++;
      if (i.operacion === 'venta') venta++; else arriendo++;
      if (i.operacion === 'venta' && i.estado === 'disponible') {
        valorVenta += Number(i.precio) || 0;
        enVenta++;
      }
    }

    // --- clientes nuevos en la ultima semana ---
    let clientesSemana = 0;
    for (const c of this.clientes) {
      if (new Date(c.fecha) >= hace7) clientesSemana++;
    }

    let visitasSemana = 0;
    for (const p of proximas) {
      if (String(p.fecha_cita).substring(0, 10) <= en7) visitasSemana++;
    }

    this.kpi = {
      pendientes: pendientes, nuevasHoy: nuevasHoy,
      visitasProximas: visitasSemana, proximaVisita: proximas.length > 0 ? proximas[0] : null,
      disponibles: disponibles, totalInmuebles: this.inmuebles.length, noDisponibles: this.inmuebles.length - disponibles,
      valorVenta: valorVenta, enVenta: enVenta,
      clientes: this.clientes.length, clientesSemana: clientesSemana,
      atencion: this.solicitudes.length > 0 ? Math.round(atendidas * 100 / this.solicitudes.length) : 0,
      atendidas: atendidas
    };

    this.agenda = proximas.slice(0, 5);

    // ultimas 6 solicitudes (la api ya las entrega de la mas nueva a la mas vieja)
    this.ultimas = this.solicitudes.slice(0, 6);

    // --- grafica 1: ultimos 14 dias ---
    const etiquetas: string[] = [];
    const visitasDia: number[] = [];
    const infoDia: number[] = [];
    for (let d = 13; d >= 0; d--) {
      const fecha = new Date(hoy.getTime() - d * 86400000);
      const clave = this.textoFecha(fecha);
      etiquetas.push(clave.substring(8, 10) + '/' + clave.substring(5, 7));
      let v = 0, inf = 0;
      for (const s of this.solicitudes) {
        if (this.textoFecha(new Date(s.fecha)) === clave) {
          if (s.tipo === 'informacion') inf++; else v++;
        }
      }
      visitasDia.push(v);
      infoDia.push(inf);
    }
    this.actividadData = {
      labels: etiquetas,
      datasets: [
        { data: visitasDia, label: 'Visitas', backgroundColor: this.colores.rojo, borderRadius: 4, maxBarThickness: 22 },
        { data: infoDia, label: 'Información', backgroundColor: this.colores.negro, borderRadius: 4, maxBarThickness: 22 }
      ]
    };

    // --- grafica 2: estados ---
    this.estadosData = {
      labels: ['Pendientes', 'Confirmadas', 'Realizadas', 'Canceladas'],
      datasets: [{
        data: [conteoEstados.pendiente, conteoEstados.confirmada, conteoEstados.realizada, conteoEstados.cancelada],
        backgroundColor: [this.colores.ambar, this.colores.azul, this.colores.verde, this.colores.gris],
        borderWidth: 0
      }]
    };

    // --- grafica 3: top 5 inmuebles mas solicitados ---
    const ranking: any[] = [];
    for (const i of this.inmuebles) {
      ranking.push({ inmueble: i, total: conteoInmueble[i._id] || 0 });
    }
    this.ordenar(ranking, 'total', true); // el mas solicitado primero
    const codigos: string[] = [];
    const totales: number[] = [];
    for (let k = 0; k < ranking.length && k < 5; k++) {
      codigos.push(ranking[k].inmueble.codigo);
      totales.push(ranking[k].total);
    }
    this.topData = {
      labels: codigos,
      datasets: [{ data: totales, backgroundColor: [this.colores.rojo, '#ec4a50', '#f27c80', '#f7adb0', '#fbd5d6'], borderRadius: 6, maxBarThickness: 26 }]
    };
    if (ranking.length > 0 && ranking[0].total > 0) {
      this.destacado = ranking[0].inmueble;
      this.destacadoTotal = ranking[0].total;
    }

    // --- grafica 4: portafolio ---
    this.portafolioData = {
      labels: ['En venta', 'En arriendo'],
      datasets: [{ data: [venta, arriendo], backgroundColor: [this.colores.rojo, this.colores.negro], borderWidth: 0 }]
    };
  }

  // valor en millones para la tarjeta (ej: 825000000 -> 825)
  millones(valor: number) {
    return Math.round(valor / 1000000);
  }

  colorEstado(estado: string) {
    if (estado === 'pendiente') return 'estado-pendiente';
    if (estado === 'confirmada') return 'estado-confirmada';
    if (estado === 'realizada') return 'estado-realizada';
    return 'estado-cancelada';
  }
}
