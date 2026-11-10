package com.example.caracoli.navigation

import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.*
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
// codigoQr: codigo del inmueble que llego por el QR del aviso (null si la app se abrio normal).
@Composable
fun AppNavigation(
    nav: NavHostController, initial: String,
    inmuebleVM: InmuebleViewModel, solicitudVM: SolicitudViewModel, prefsVM: PreferencesViewModel,
    codigoQr: String? = null, onQrAtendido: () -> Unit = {}
) {
    // codigo del QR que no se encontro en el catalogo (para mostrar el aviso)
    var qrNoEncontrado by remember { mutableStateOf("") }

    // CODIGO QR: se trae el catalogo actualizado y se abre el detalle del inmueble escaneado
    LaunchedEffect(codigoQr) {
        if (codigoQr != null) {
            inmuebleVM.cargar().join() // join: espera a que termine de cargar (API o, sin internet, Room)
            val inmueble = inmuebleVM.buscarPorCodigo(codigoQr)
            if (inmueble != null) {
                nav.navigate(Routes.detalle(inmueble.id)) { popUpTo(Routes.HOME) }
            } else {
                qrNoEncontrado = codigoQr
            }
            onQrAtendido()
        }
    }

    if (qrNoEncontrado.isNotBlank()) {
        AlertDialog(
            onDismissRequest = { qrNoEncontrado = "" },
            title = { Text("Inmueble no encontrado") },
            text = {
                Text("El inmueble $qrNoEncontrado no está en el catálogo. Puede que ya se haya vendido o arrendado, " +
                        "o que la app no esté conectada al servidor de la inmobiliaria (revisa Ajustes).")
            },
            confirmButton = { TextButton(onClick = { qrNoEncontrado = "" }) { Text("Aceptar") } }
        )
    }

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
