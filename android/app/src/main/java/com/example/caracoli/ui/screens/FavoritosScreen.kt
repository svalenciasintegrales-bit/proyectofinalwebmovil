// Pantalla 6: FAVORITOS. Los inmuebles marcados con el corazon (guardados en DataStore).
package com.example.caracoli.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.caracoli.ui.components.InmuebleCard
import com.example.caracoli.viewmodel.InmuebleViewModel
import com.example.caracoli.viewmodel.PreferencesViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun FavoritosScreen(vm: InmuebleViewModel, prefs: PreferencesViewModel, onDetalle: (String) -> Unit, onVolver: () -> Unit) {
    val favoritos by prefs.favoritos.collectAsStateWithLifecycle()
    val servidor by prefs.servidor.collectAsStateWithLifecycle()
    val lista = vm.inmueblesFavoritos(favoritos)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mis favoritos") },
                navigationIcon = { IconButton(onClick = onVolver) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver") } }
            )
        }
    ) { padding ->
        if (lista.isEmpty()) {
            Column(Modifier.fillMaxSize().padding(padding).padding(32.dp), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.FavoriteBorder, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(80.dp))
                Spacer(Modifier.height(12.dp))
                Text("Aún no tienes favoritos", style = MaterialTheme.typography.titleLarge)
                Text("Toca el corazón de un inmueble para guardarlo aquí. Se guarda en tu celular.", textAlign = TextAlign.Center)
            }
        } else {
            LazyColumn(Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp)) {
                items(lista, key = { it.id }) { inmueble ->
                    InmuebleCard(inmueble, servidor, esFavorito = true, onFavorito = { prefs.cambiarFavorito(inmueble.id, true) }) { onDetalle(inmueble.id) }
                }
            }
        }
    }
}
