import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { Cita } from '../../servicios/cita';

// encabezado del panel: titulo de la pagina actual, fecha y notificaciones de solicitudes
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit {
  @Output() toggleSidebar = new EventEmitter<void>();

  titulo: string = 'Tablero';
  descripcion: string = '';
  pendientes: number = 0;
  hoy: string = '';

  // titulo y descripcion de cada pagina del panel
  paginas: any = {
    tablero: { titulo: 'Tablero', descripcion: 'Resumen del negocio en tiempo real' },
    inmuebles: { titulo: 'Inmuebles', descripcion: 'Portafolio publicado en la app de clientes' },
    solicitudes: { titulo: 'Solicitudes', descripcion: 'Visitas y preguntas enviadas desde la app' },
    clientes: { titulo: 'Clientes', descripcion: 'Personas interesadas en los inmuebles' },
    reportes: { titulo: 'Reportes', descripcion: 'Información para la toma de decisiones' },
    usuarios: { titulo: 'Usuarios', descripcion: 'Personas del equipo con acceso al panel' }
  };

  constructor(private router: Router, private scita: Cita, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    // fecha de hoy en español (ej: martes, 28 de octubre de 2026)
    this.hoy = new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    this.actualizarTitulo(this.router.url);

    // cada vez que se cambia de pagina se actualiza el titulo y el numero de pendientes
    this.router.events.subscribe((evento: any) => {
      if (evento instanceof NavigationEnd) {
        this.actualizarTitulo(evento.urlAfterRedirects);
      }
    });
    // igual que el menu: cada 10 segundos se revisa si cambiaron las solicitudes pendientes
    setInterval(() => this.contarPendientes(), 10000);
  }

  actualizarTitulo(url: string) {
    const nombre = url.split('/').pop() || 'tablero';
    const pagina = this.paginas[nombre] || this.paginas['tablero'];
    this.titulo = pagina.titulo;
    this.descripcion = pagina.descripcion;
    this.contarPendientes();
    this.cdr.detectChanges();
  }

  contarPendientes() {
    this.scita.consulta('pendiente').subscribe({
      next: (res: any) => { this.pendientes = res.citas.length; this.cdr.detectChanges(); },
      error: () => { this.pendientes = 0; this.cdr.detectChanges(); }
    });
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }
}
