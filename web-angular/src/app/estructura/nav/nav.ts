import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Cita } from '../../servicios/cita';

// menu lateral del panel: secciones, contador de solicitudes pendientes y usuario
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.html',
  styleUrl: './nav.css',
})
export class Nav implements OnInit, OnDestroy {
  @Input() isSidebarActive!: boolean;
  @Input() isCollapsed!: boolean;
  @Output() toggleSidebar = new EventEmitter<void>();
  @Output() toggleCollapse = new EventEmitter<void>();

  nombre: any = '';
  esAdministrador: boolean = false; // solo el administrador ve Reportes y Usuarios
  pendientes: number = 0; // solicitudes sin atender (las envian los clientes desde la app)
  intervalo: any;

  constructor(private scita: Cita, private router: Router, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.nombre = sessionStorage.getItem('nombre') || 'Administrador';
    this.esAdministrador = sessionStorage.getItem('rol') === 'administrador';
    this.contarPendientes();
    // cada 10 segundos se revisa si llegaron solicitudes nuevas desde la app
    this.intervalo = setInterval(() => this.contarPendientes(), 10000);
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalo);
  }

  contarPendientes() {
    this.scita.consulta('pendiente').subscribe({
      next: (res: any) => { this.pendientes = res.citas.length; this.cdr.detectChanges(); },
      error: () => { this.pendientes = 0; this.cdr.detectChanges(); }
    });
  }

  // iniciales del usuario para el circulo (ej: Administrador Caracoli -> AC)
  iniciales() {
    const partes = String(this.nombre).trim().split(' ');
    let texto = '';
    for (let i = 0; i < partes.length && i < 2; i++) {
      texto += partes[i].charAt(0);
    }
    return texto.toUpperCase();
  }

  onToggleSidebar() {
    this.toggleSidebar.emit();
  }

  // en celular, al tocar una opcion se cierra el menu
  cerrarEnCelular() {
    if (this.isSidebarActive) this.toggleSidebar.emit();
  }

  cerrarSesion() {
    sessionStorage.setItem('id', '');
    sessionStorage.setItem('usuario', '');
    sessionStorage.setItem('nombre', '');
    sessionStorage.setItem('rol', '');
    this.router.navigate(['/login']);
  }
}
