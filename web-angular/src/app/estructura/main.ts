import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Header } from './header/header';
import { Nav } from './nav/nav';

// plantilla del panel administrativo: menu lateral, encabezado y contenido
@Component({
  selector: 'app-main',
  standalone: true,
  imports: [CommonModule, RouterModule, Header, Nav],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  isSidebarActive = false; // menu abierto en celular
  isCollapsed = false; // menu angosto (solo iconos) en computador

  toggleSidebar(): void {
    this.isSidebarActive = !this.isSidebarActive;
  }

  toggleCollapse(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}
