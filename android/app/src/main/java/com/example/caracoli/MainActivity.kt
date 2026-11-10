// MainActivity: la unica Activity de la app. Crea DataStore, Room, los Repository y los ViewModel,
// y arma el tema y la navegacion (igual que en MiRuta).
package com.example.caracoli

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.compose.rememberNavController
import com.example.caracoli.data.local.PreferencesManager
import com.example.caracoli.data.local.room.CaracoliDatabase
import com.example.caracoli.data.repository.InmuebleRepository
import com.example.caracoli.data.repository.SolicitudRepository
import com.example.caracoli.navigation.AppNavigation
import com.example.caracoli.navigation.Routes
import com.example.caracoli.ui.theme.CaracoliTheme
import com.example.caracoli.viewmodel.InmuebleViewModel
import com.example.caracoli.viewmodel.PreferencesViewModel
import com.example.caracoli.viewmodel.SolicitudViewModel
import kotlinx.coroutines.flow.first

class MainActivity : ComponentActivity() {
    // codigo del inmueble que llego por el enlace del QR (caracoli://inmueble/CAR-102), o null
    private val codigoQr = mutableStateOf<String?>(null)

    // saca el codigo del enlace: caracoli://inmueble/CAR-102 -> "CAR-102"
    private fun leerCodigoQr(intent: Intent?): String? {
        val enlace = intent?.data ?: return null
        if (enlace.scheme != "caracoli" || enlace.host != "inmueble") return null
        val codigo = enlace.lastPathSegment ?: return null
        return codigo.trim().uppercase()
    }

    // si la app ya estaba abierta y se escanea otro QR, el enlace llega aqui (launchMode singleTask)
    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        codigoQr.value = leerCodigoQr(intent)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        codigoQr.value = leerCodigoQr(intent)
        // Se crean UNA vez: las preferencias (DataStore), la base de datos local (Room) y los dos Repository.
        val manager = PreferencesManager(applicationContext)
        val db = CaracoliDatabase.obtener(applicationContext)
        val inmuebleRepo = InmuebleRepository(manager, db.inmuebleDao())
        val solicitudRepo = SolicitudRepository(manager, db.borradorDao(), db.solicitudDao())

        setContent {
            // FACTORY: los ViewModel reciben parametros, por eso se le dice a Android como crearlos.
            val inmuebleVM: InmuebleViewModel = viewModel(factory = object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T = InmuebleViewModel(inmuebleRepo) as T
            })
            val solicitudVM: SolicitudViewModel = viewModel(factory = object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T = SolicitudViewModel(solicitudRepo) as T
            })
            val prefsVM: PreferencesViewModel = viewModel(factory = object : ViewModelProvider.Factory {
                @Suppress("UNCHECKED_CAST") override fun <T : ViewModel> create(modelClass: Class<T>): T = PreferencesViewModel(manager) as T
            })

            val oscuro by prefsVM.oscuro.collectAsStateWithLifecycle()

            // Pantalla inicial segun DataStore, y se envian las solicitudes que quedaron sin conexion.
            var initial by remember { mutableStateOf<String?>(null) }
            LaunchedEffect(Unit) {
                // si la app se abrio desde un QR se va directo al inicio (la bienvenida sale la proxima vez)
                initial = if (manager.onboardingCompletado.first() || codigoQr.value != null) Routes.HOME else Routes.ONBOARDING
                solicitudVM.sincronizar()
            }

            CaracoliTheme(oscuro = oscuro) {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    initial?.let {
                        AppNavigation(
                            rememberNavController(), it, inmuebleVM, solicitudVM, prefsVM,
                            codigoQr = codigoQr.value,
                            onQrAtendido = { codigoQr.value = null }
                        )
                    }
                }
            }
        }
    }
}
