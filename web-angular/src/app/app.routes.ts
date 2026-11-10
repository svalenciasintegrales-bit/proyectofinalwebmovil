import { Routes } from '@angular/router';
import { Main } from './estructura/main';
import { Login } from './modulos/login/login';
import { Tablero } from './modulos/tablero/tablero';
import { Inmuebles } from './modulos/inmuebles/inmuebles';
import { Aviso } from './modulos/aviso/aviso';
import { Solicitudes } from './modulos/solicitudes/solicitudes';
import { Clientes } from './modulos/clientes/clientes';
import { Usuarios } from './modulos/usuarios/usuarios';
import { Reportes } from './modulos/reportes/reportes';
import { NoEncontro } from './modulos/no-encontro/no-encontro';
import { validaruserGuard } from './guard/validaruser-guard';

// La web es el PANEL DEL ADMINISTRADOR de Caracoli Inmobiliaria.
// Los clientes usan la app movil; sus solicitudes llegan aqui por la API (MongoDB).
export const routes: Routes = [
    { path: 'login', component: Login },
    {
        path: 'panel', component: Main,
        children:
            [
                { path: 'tablero', component: Tablero, canActivate: [validaruserGuard] },
                { path: 'inmuebles', component: Inmuebles, canActivate: [validaruserGuard] },
                { path: 'aviso/:id', component: Aviso, canActivate: [validaruserGuard] },
                { path: 'solicitudes', component: Solicitudes, canActivate: [validaruserGuard] },
                { path: 'clientes', component: Clientes, canActivate: [validaruserGuard] },
                { path: 'reportes', component: Reportes, canActivate: [validaruserGuard] },
                { path: 'usuarios', component: Usuarios, canActivate: [validaruserGuard] },
                { path: '', redirectTo: 'tablero', pathMatch: 'full' }
            ]
    },
    { path: '', redirectTo: 'panel/tablero', pathMatch: 'full' },
    { path: '**', component: NoEncontro }
];
