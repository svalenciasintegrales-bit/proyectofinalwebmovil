// Pantalla 7: AJUSTES. Datos del cliente, direccion del servidor (API) y modo oscuro (todo en DataStore).
package com.example.caracoli.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.caracoli.R
import com.example.caracoli.config.CaracoliConfig
import com.example.caracoli.viewmodel.InmuebleViewModel
import com.example.caracoli.viewmodel.PreferencesViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AjustesScreen(prefs: PreferencesViewModel, inmuebleVM: InmuebleViewModel, onVolver: () -> Unit) {
    val oscuro by prefs.oscuro.collectAsStateWithLifecycle()
    val nombreGuardado by prefs.nombre.collectAsStateWithLifecycle()
    val telefonoGuardado by prefs.telefono.collectAsStateWithLifecycle()
    val servidorGuardado by prefs.servidor.collectAsStateWithLifecycle()
    val cargando by inmuebleVM.cargando.collectAsStateWithLifecycle()
    val sinConexion by inmuebleVM.sinConexion.collectAsStateWithLifecycle()

    var nombre by rememberSaveable { mutableStateOf("") }
    var telefono by rememberSaveable { mutableStateOf("") }
    var servidor by rememberSaveable { mutableStateOf("") }
    var guardado by remember { mutableStateOf(false) }
    var probado by remember { mutableStateOf(false) }

    LaunchedEffect(nombreGuardado, telefonoGuardado, servidorGuardado) {
        if (nombre.isBlank()) nombre = nombreGuardado
        if (telefono.isBlank()) telefono = telefonoGuardado
        if (servidor.isBlank()) servidor = servidorGuardado
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Ajustes") },
                navigationIcon = { IconButton(onClick = onVolver) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver") } }
            )
        }
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            item {
                Text("Mis datos", style = MaterialTheme.typography.titleLarge)
                Text("Se usan para llenar los formularios de solicitudes.")
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(value = nombre, onValueChange = { nombre = it; guardado = false }, label = { Text("Nombre") }, singleLine = true, modifier = Modifier.fillMaxWidth())
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = telefono, onValueChange = { telefono = it; guardado = false }, label = { Text("Celular") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(10.dp))
                Button(onClick = { prefs.guardarDatos(nombre, telefono); guardado = true }) { Text("Guardar datos") }
                if (guardado) Text("Datos guardados en el celular", color = MaterialTheme.colorScheme.primary)

                Spacer(Modifier.height(24.dp))
                Text("Conexión con la inmobiliaria", style = MaterialTheme.typography.titleLarge)
                Text("Dirección de la API. En un celular real usa la IP del computador, por ejemplo http://192.168.1.50:3900/api", fontSize = 13.sp)
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = servidor, onValueChange = { servidor = it; probado = false }, label = { Text("Servidor") }, singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri), modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
                Button(onClick = {
                    probado = true
                    // primero se guarda la direccion y, cuando termina, se vuelve a pedir el catalogo
                    prefs.guardarServidor(servidor).invokeOnCompletion { inmuebleVM.cargar() }
                }) { Text("Guardar y probar conexión") }
                if (probado && !cargando) {
                    Text(
                        if (sinConexion) "No se pudo conectar. Revisa la dirección y que la API esté prendida." else "Conectado con Caracoli Inmobiliaria ✓",
                        color = MaterialTheme.colorScheme.primary
                    )
                }

                Spacer(Modifier.height(24.dp))
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Column(Modifier.weight(1f)) {
                        Text("Modo oscuro", style = MaterialTheme.typography.titleMedium)
                        Text("Cambia los colores de la app")
                    }
                    // Switch: al cambiarlo se guarda en DataStore y MainActivity cambia el tema
                    Switch(checked = oscuro, onCheckedChange = { prefs.guardarOscuro(it) })
                }

                Spacer(Modifier.height(32.dp))
                Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                    Image(painterResource(R.drawable.logo), contentDescription = "Caracoli Inmobiliaria", modifier = Modifier.height(90.dp))
                    Text(CaracoliConfig.ESLOGAN, fontStyle = FontStyle.Italic)
                    Text("${CaracoliConfig.DIRECCION} · ${CaracoliConfig.TELEFONO}")
                }
            }
        }
    }
}
