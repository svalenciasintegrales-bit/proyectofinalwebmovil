// Pantalla 2: INICIO. Catalogo de inmuebles publicados por el administrador (API),
// buscador, filtro, busqueda por el codigo del letrero y aviso cuando no hay conexion.
package com.example.caracoli.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.caracoli.R
import com.example.caracoli.config.CaracoliConfig
import com.example.caracoli.model.FiltroOperacion
import com.example.caracoli.ui.components.AvisoSinConexion
import com.example.caracoli.ui.components.InmuebleCard
import com.example.caracoli.ui.theme.Negro
import com.example.caracoli.ui.theme.RojoCaracoli
import com.example.caracoli.viewmodel.InmuebleViewModel
import com.example.caracoli.viewmodel.PreferencesViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    vm: InmuebleViewModel, prefs: PreferencesViewModel,
    onDetalle: (String) -> Unit, onFavoritos: () -> Unit, onSolicitudes: () -> Unit, onAjustes: () -> Unit
) {
    val inmuebles by vm.inmuebles.collectAsStateWithLifecycle()
    val filtro by vm.filtro.collectAsStateWithLifecycle()
    val texto by vm.texto.collectAsStateWithLifecycle()
    val cargando by vm.cargando.collectAsStateWithLifecycle()
    val sinConexion by vm.sinConexion.collectAsStateWithLifecycle()
    val favoritos by prefs.favoritos.collectAsStateWithLifecycle()
    val nombre by prefs.nombre.collectAsStateWithLifecycle()
    val servidor by prefs.servidor.collectAsStateWithLifecycle()

    // ventana para buscar por el codigo del letrero
    var mostrarCodigo by remember { mutableStateOf(false) }
    var codigo by remember { mutableStateOf("") }
    var errorCodigo by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Image(painterResource(R.drawable.logo), contentDescription = "Caracoli Inmobiliaria", modifier = Modifier.height(48.dp)) },
                actions = {
                    TextButton(onClick = onFavoritos) {
                        Icon(Icons.Default.Favorite, contentDescription = "Favoritos", tint = RojoCaracoli)
                        Text(" ${favoritos.size}")
                    }
                    IconButton(onClick = onSolicitudes) { Icon(Icons.Default.Email, contentDescription = "Mis solicitudes") }
                    IconButton(onClick = onAjustes) { Icon(Icons.Default.Settings, contentDescription = "Ajustes") }
                }
            )
        }
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp)) {
            item {
                // Encabezado rojo con el saludo y el eslogan
                Column(
                    Modifier.fillMaxWidth().padding(top = 8.dp)
                        .background(RojoCaracoli, RoundedCornerShape(12.dp)).padding(18.dp)
                ) {
                    Text(if (nombre.isBlank()) "¡Hola!" else "¡Hola, $nombre!", color = Color.White, fontSize = 15.sp)
                    Text("¿Buscas tu propiedad ideal en Cartago?", color = Color.White, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                    Spacer(Modifier.height(4.dp))
                    Text(CaracoliConfig.ESLOGAN, color = Color.White, fontStyle = FontStyle.Italic, fontSize = 14.sp)
                }
                Spacer(Modifier.height(10.dp))

                if (sinConexion) {
                    AvisoSinConexion("Sin conexión: estás viendo el último catálogo guardado en tu celular.")
                }

                // Buscador: cada letra cambia el texto en el ViewModel y la lista se filtra sola
                OutlinedTextField(
                    value = texto,
                    onValueChange = { vm.cambiarTexto(it) },
                    label = { Text("Buscar por barrio, tipo o código") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    OutlinedButton(onClick = { codigo = ""; errorCodigo = false; mostrarCodigo = true }, modifier = Modifier.weight(1f)) {
                        Text("Código del letrero")
                    }
                    Spacer(Modifier.width(8.dp))
                    OutlinedButton(onClick = { vm.cargar() }) {
                        Icon(Icons.Default.Refresh, contentDescription = null)
                        Text(" Actualizar")
                    }
                }
                Spacer(Modifier.height(8.dp))

                // Filtro: 3 botones, el elegido en rojo
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    BotonFiltro("Todos", FiltroOperacion.TODOS, filtro) { vm.cambiarFiltro(it) }
                    BotonFiltro("Venta", FiltroOperacion.VENTA, filtro) { vm.cambiarFiltro(it) }
                    BotonFiltro("Arriendo", FiltroOperacion.ARRIENDO, filtro) { vm.cambiarFiltro(it) }
                }
                Text("${inmuebles.size} inmuebles disponibles", fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp))
            }

            if (cargando) {
                item {
                    Box(Modifier.fillMaxWidth().padding(32.dp), contentAlignment = Alignment.Center) { CircularProgressIndicator() }
                }
            } else if (inmuebles.isEmpty()) {
                item {
                    Text(
                        if (sinConexion && texto.isBlank()) "No hay inmuebles guardados. Conéctate a internet y toca Actualizar."
                        else "No encontramos inmuebles con esa búsqueda.",
                        modifier = Modifier.padding(vertical = 24.dp)
                    )
                }
            }

            // Una tarjeta por inmueble. key = id para que Compose identifique cada tarjeta.
            items(inmuebles, key = { it.id }) { inmueble ->
                val esFavorito = favoritos.contains(inmueble.id)
                InmuebleCard(inmueble, servidor, esFavorito, onFavorito = { prefs.cambiarFavorito(inmueble.id, esFavorito) }) { onDetalle(inmueble.id) }
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }

    // AlertDialog: escribir el codigo que aparece en el letrero (ej: CAR-102)
    if (mostrarCodigo) {
        AlertDialog(
            onDismissRequest = { mostrarCodigo = false },
            title = { Text("Código del letrero") },
            text = {
                Column {
                    Text("Escribe el código que aparece en el letrero de Caracoli (ej: CAR-102).")
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = codigo,
                        onValueChange = { codigo = it; errorCodigo = false },
                        label = { Text("Código") },
                        singleLine = true,
                        isError = errorCodigo
                    )
                    if (errorCodigo) Text("Inmueble no encontrado", color = RojoCaracoli)
                }
            },
            confirmButton = {
                TextButton(onClick = {
                    val encontrado = vm.buscarPorCodigo(codigo)
                    if (encontrado != null) {
                        mostrarCodigo = false
                        onDetalle(encontrado.id)
                    } else {
                        errorCodigo = true
                    }
                }) { Text("Buscar") }
            },
            dismissButton = { TextButton(onClick = { mostrarCodigo = false }) { Text("Cancelar") } }
        )
    }
}

// Boton del filtro: rojo si esta elegido, gris si no.
@Composable
fun BotonFiltro(texto: String, opcion: FiltroOperacion, seleccionado: FiltroOperacion, onClick: (FiltroOperacion) -> Unit) {
    val activo = opcion == seleccionado
    Button(
        onClick = { onClick(opcion) },
        colors = ButtonDefaults.buttonColors(
            containerColor = if (activo) RojoCaracoli else Color(0xFFE6E6E6),
            contentColor = if (activo) Color.White else Negro
        ),
        contentPadding = PaddingValues(horizontal = 18.dp)
    ) { Text(texto) }
}
