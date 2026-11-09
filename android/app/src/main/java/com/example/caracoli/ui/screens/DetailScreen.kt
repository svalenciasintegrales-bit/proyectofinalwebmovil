// Pantalla 3: DETALLE del inmueble. Foto, datos, descripcion, simulador de cuota
// y los botones para pedir informacion o agendar visita (llegan al panel del administrador).
package com.example.caracoli.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.DateRange
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.caracoli.model.formatoPrecio
import com.example.caracoli.ui.components.EtiquetaOperacion
import com.example.caracoli.ui.components.FotoInmueble
import com.example.caracoli.ui.theme.RojoCaracoli
import com.example.caracoli.viewmodel.InmuebleViewModel
import com.example.caracoli.viewmodel.PreferencesViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DetailScreen(id: String, vm: InmuebleViewModel, prefs: PreferencesViewModel, onSolicitud: (String) -> Unit, onVolver: () -> Unit) {
    val inmueble = vm.buscarInmueble(id)
    val favoritos by prefs.favoritos.collectAsStateWithLifecycle()
    val servidor by prefs.servidor.collectAsStateWithLifecycle()

    // Estado local del simulador (rememberSaveable: no se pierde al girar el celular)
    var cuotaInicial by rememberSaveable { mutableStateOf("30") }
    var anios by rememberSaveable { mutableStateOf("20") }
    var tasa by rememberSaveable { mutableStateOf("12") }

    val esFavorito = favoritos.contains(id)

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(inmueble?.codigo ?: "Inmueble") },
                navigationIcon = { IconButton(onClick = onVolver) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver") } },
                actions = {
                    if (inmueble != null) {
                        IconButton(onClick = { prefs.cambiarFavorito(id, esFavorito) }) {
                            Icon(if (esFavorito) Icons.Default.Favorite else Icons.Default.FavoriteBorder, contentDescription = "Favorito", tint = RojoCaracoli)
                        }
                    }
                }
            )
        }
    ) { padding ->
        if (inmueble == null) {
            Box(Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) { Text("Inmueble no encontrado") }
            return@Scaffold
        }

        LazyColumn(Modifier.fillMaxSize().padding(padding)) {
            item {
                Box {
                    FotoInmueble(inmueble.imagen, servidor, Modifier.fillMaxWidth().height(280.dp))
                    EtiquetaOperacion(inmueble.operacion, Modifier.align(Alignment.BottomStart).padding(bottom = 14.dp))
                }
            }
            item {
                Column(Modifier.padding(16.dp)) {
                    Text(inmueble.titulo, style = MaterialTheme.typography.headlineMedium)
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Place, contentDescription = null, tint = RojoCaracoli, modifier = Modifier.size(18.dp))
                        Text(" ${inmueble.barrio}, ${inmueble.ciudad} · Código ${inmueble.codigo}")
                    }
                    Spacer(Modifier.height(8.dp))
                    Row(verticalAlignment = Alignment.Bottom) {
                        Text(formatoPrecio(inmueble.precio), color = MaterialTheme.colorScheme.primary, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 30.sp)
                        if (inmueble.operacion == "arriendo") Text(" /mes")
                    }
                    Spacer(Modifier.height(14.dp))

                    Row(Modifier.fillMaxWidth()) {
                        DatoCard("${inmueble.area} m²", "Área", Modifier.weight(1f))
                        Spacer(Modifier.width(8.dp))
                        DatoCard("${inmueble.habitaciones}", "Habitaciones", Modifier.weight(1f))
                        Spacer(Modifier.width(8.dp))
                        DatoCard("${inmueble.banos}", "Baños", Modifier.weight(1f))
                    }
                    Spacer(Modifier.height(16.dp))
                    Text("Descripción", style = MaterialTheme.typography.titleLarge)
                    Text(inmueble.descripcion)
                    Spacer(Modifier.height(18.dp))

                    // Las dos solicitudes que llegan al administrador
                    Button(onClick = { onSolicitud("visita") }, modifier = Modifier.fillMaxWidth().height(52.dp)) {
                        Icon(Icons.Default.DateRange, contentDescription = null)
                        Text("  Agendar visita", fontSize = 16.sp)
                    }
                    Spacer(Modifier.height(8.dp))
                    OutlinedButton(onClick = { onSolicitud("informacion") }, modifier = Modifier.fillMaxWidth().height(52.dp)) {
                        Icon(Icons.Default.Email, contentDescription = null)
                        Text("  Pedir información", fontSize = 16.sp)
                    }
                }
            }

            // SIMULADOR DE CUOTA (solo para inmuebles en venta)
            if (inmueble.operacion == "venta") {
                item {
                    Card(Modifier.padding(16.dp).fillMaxWidth()) {
                        Column(Modifier.padding(16.dp)) {
                            Text("Simulador de cuota", style = MaterialTheme.typography.titleLarge)
                            Text("¿Cuánto pagarías al mes con un crédito?", fontSize = 14.sp)
                            Spacer(Modifier.height(10.dp))
                            Row {
                                CampoNumero("Inicial %", cuotaInicial, Modifier.weight(1f)) { cuotaInicial = it }
                                Spacer(Modifier.width(6.dp))
                                CampoNumero("Años", anios, Modifier.weight(1f)) { anios = it }
                                Spacer(Modifier.width(6.dp))
                                CampoNumero("Tasa % anual", tasa, Modifier.weight(1f)) { tasa = it }
                            }
                            Spacer(Modifier.height(12.dp))
                            // toDoubleOrNull / toIntOrNull: si el texto no es un numero se usa 0
                            val cuota = vm.cuotaMensual(inmueble.precio, cuotaInicial.toDoubleOrNull() ?: 0.0, anios.toIntOrNull() ?: 0, tasa.toDoubleOrNull() ?: 0.0)
                            Text("Cuota mensual aproximada", fontSize = 14.sp)
                            Text(formatoPrecio(cuota), color = MaterialTheme.colorScheme.primary, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 26.sp)
                            Text("Valor de referencia. La cuota real depende del banco.", fontSize = 12.sp)
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(24.dp)) }
        }
    }
}

@Composable
fun DatoCard(valor: String, titulo: String, modifier: Modifier) {
    Card(modifier) {
        Column(Modifier.fillMaxWidth().padding(10.dp), horizontalAlignment = Alignment.CenterHorizontally) {
            Text(valor, fontWeight = FontWeight.Bold, fontSize = 18.sp, color = MaterialTheme.colorScheme.primary)
            Text(titulo, fontSize = 12.sp, textAlign = TextAlign.Center)
        }
    }
}

@Composable
fun CampoNumero(etiqueta: String, valor: String, modifier: Modifier, onCambio: (String) -> Unit) {
    OutlinedTextField(
        value = valor,
        onValueChange = onCambio,
        label = { Text(etiqueta, fontSize = 11.sp) },
        singleLine = true,
        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
        modifier = modifier
    )
}
