package com.example.caracoli.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.example.caracoli.ui.screens.*
import com.example.caracoli.viewmodel.InmuebleViewModel
import com.example.caracoli.viewmodel.PreferencesViewModel
import com.example.caracoli.viewmodel.SolicitudViewModel

// nav: cambia de pantalla (navigate = ir, popBackStack = volver).
// initial: ONBOARDING la primera vez, HOME las siguientes (lo decide MainActivity con DataStore).
@Composable
fun AppNavigation(
    nav: NavHostController, initial: String,
    inmuebleVM: InmuebleViewModel, solicitudVM: SolicitudViewModel, prefsVM: PreferencesViewModel
) {
    NavHost(navController = nav, startDestination = initial) {

        // 1. BIENVENIDA: al terminar se guarda en DataStore y se borra del backstack (popUpTo inclusive).
        composable(Routes.ONBOARDING) {
            OnboardingScreen {
                prefsVM.finalizarOnboarding()
                nav.navigate(Routes.HOME) { popUpTo(Routes.ONBOARDING) { inclusive = true } }
            }
        }

        // 2. INICIO: catalogo con buscador, filtro y busqueda por codigo del letrero.
        composable(Routes.HOME) {
            HomeScreen(
                inmuebleVM, prefsVM,
                onDetalle = { nav.navigate(Routes.detalle(it)) },
                onFavoritos = { nav.navigate(Routes.FAVORITOS) },
                onSolicitudes = { nav.navigate(Routes.MIS_SOLICITUDES) },
                onAjustes = { nav.navigate(Routes.AJUSTES) }
            )
        }

        // 3. DETALLE: recibe el id del inmueble (texto, es el _id de MongoDB).
        composable(Routes.DETAIL, arguments = listOf(navArgument("id") { type = NavType.StringType })) { entry ->
            val id = entry.arguments?.getString("id") ?: ""
            DetailScreen(
                id, inmuebleVM, prefsVM,
                onSolicitud = { tipo -> nav.navigate(Routes.solicitud(id, tipo)) },
                onVolver = { nav.popBackStack() }
            )
        }

        // 4. FORMULARIO: pedir informacion o agendar visita
        composable(
            Routes.SOLICITUD,
            arguments = listOf(navArgument("id") { type = NavType.StringType }, navArgument("tipo") { type = NavType.StringType })
        ) { entry ->
            val id = entry.arguments?.getString("id") ?: ""
            val tipo = entry.arguments?.getString("tipo") ?: "informacion"
            SolicitudScreen(
                id, tipo, inmuebleVM, solicitudVM, prefsVM,
                onVolver = { nav.popBackStack() },
                onVerSolicitudes = {
                    nav.navigate(Routes.MIS_SOLICITUDES) { popUpTo(Routes.HOME) }
                }
            )
        }

        // 5. MIS SOLICITUDES: estado y respuesta del administrador
        composable(Routes.MIS_SOLICITUDES) {
            MisSolicitudesScreen(inmuebleVM, solicitudVM, onDetalle = { nav.navigate(Routes.detalle(it)) }, onVolver = { nav.popBackStack() })
        }

        // 6. FAVORITOS
        composable(Routes.FAVORITOS) {
            FavoritosScreen(inmuebleVM, prefsVM, onDetalle = { nav.navigate(Routes.detalle(it)) }, onVolver = { nav.popBackStack() })
        }

        // 7. AJUSTES: datos, direccion del servidor y modo oscuro.
        composable(Routes.AJUSTES) { AjustesScreen(prefsVM, inmuebleVM) { nav.popBackStack() } }
    }
}
