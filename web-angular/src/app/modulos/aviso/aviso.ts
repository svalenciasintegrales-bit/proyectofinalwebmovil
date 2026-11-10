import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Inmueble } from '../../servicios/inmueble';
import QRCode from 'qrcode';

// panel: AVISO (letrero) de un inmueble para imprimir o guardar en PDF.
// Lleva el logo, SE VENDE / SE ARRIENDA, los datos basicos, los telefonos y un codigo QR.
// El QR lleva la direccion http://IP-del-computador:3900/api/qr/CODIGO: al escanearlo,
// la camara del celular abre esa pagina de la api y la pagina abre la app en el inmueble.
@Component({
  selector: 'app-aviso',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './aviso.html',
  styleUrl: './aviso.css'
})
export class Aviso implements OnInit {
  inmueble: any = null;
  error: string = '';
  servidorQr: string = ''; // IP o nombre del computador donde corre la api (lo que va dentro del QR)
  enlaceQr: string = '';   // direccion completa que lleva el QR
  imagenQr: string = '';   // el QR como imagen (data:image/png;base64,...)
  esLocal: boolean = false; // true si el panel se abrio con localhost (esa direccion no sirve en el celular)

  // datos fijos de la inmobiliaria (los mismos de la app)
  telefono1 = '314 780 2883';
  telefono2 = '310 650 1884';
  direccion = 'Cra 3 # 11-89 Centro, Cartago';

  constructor(private route: ActivatedRoute, public sinmueble: Inmueble, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.sinmueble.consultaUno(id).subscribe({
      next: (res: any) => {
        this.inmueble = res.inmueble;
        this.cdr.detectChanges();
        this.buscarServidor();
      },
      error: () => {
        this.error = 'No se encontró el inmueble.';
        this.cdr.detectChanges();
      }
    });
  }

  // Si el panel se abrio con la IP del computador se usa esa misma.
  // Si se abrio con localhost, se le pregunta a la api cual es la IP del computador en la red.
  buscarServidor() {
    const host = window.location.hostname;
    this.esLocal = host === 'localhost' || host === '127.0.0.1';
    if (!this.esLocal) {
      this.servidorQr = host;
      this.generarQr();
      return;
    }
    this.sinmueble.red().subscribe({
      next: (res: any) => {
        this.servidorQr = res.ips.length > 0 ? res.ips[0] : host;
        this.generarQr();
      },
      error: () => {
        this.servidorQr = host;
        this.generarQr();
      }
    });
  }

  // arma la direccion del QR y la convierte en imagen con la libreria qrcode
  generarQr() {
    const servidor = this.servidorQr.trim();
    this.enlaceQr = `http://${servidor}:3900/api/qr/${encodeURIComponent(this.inmueble.codigo)}`;
    QRCode.toDataURL(this.enlaceQr, { width: 600, margin: 1, errorCorrectionLevel: 'M', color: { dark: '#111111', light: '#ffffff' } })
      .then((imagen: string) => {
        this.imagenQr = imagen;
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.error = 'No se pudo generar el código QR.';
        this.cdr.detectChanges();
      });
  }

  // precio con puntos de miles, como se escribe en Colombia. Ej: 250000000 -> $250.000.000
  precioTexto(valor: any) {
    const numero = Math.round(Number(valor) || 0);
    return '$' + numero.toLocaleString('es-CO');
  }

  // abre la ventana de impresion del navegador (ahi tambien se puede elegir "Guardar como PDF")
  imprimir() {
    window.print();
  }
}
