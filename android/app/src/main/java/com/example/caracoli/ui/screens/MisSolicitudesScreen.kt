// Pantalla 5: MIS SOLICITUDES. Lo que el cliente envio, con el ESTADO y la RESPUESTA del administrador.
// Aqui se ve la union de la app con el panel web.
package com.example.caracoli.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Email
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.caracoli.model.formatoFecha
import com.example.caracoli.ui.components.AvisoSinConexion
import com.example.caracoli.ui.components.EstadoChip
import com.example.caracoli.viewmodel.InmuebleViewModel
import com.example.caracoli.viewmodel.SolicitudViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MisSolicitudesScreen(inmuebleVM: InmuebleViewModel, solicitudVM: SolicitudViewModel, onDetalle: (String) -> Unit, onVolver: () -> Unit) {
    val solicitudes by solicitudVM.solicitudes.collectAsStateWithLifecycle()
    val cargando by solicitudVM.cargando.collectAsStateWithLifecycle()
    val sinConexion by solicitudVM.sinConexion.collectAsStateWithLifecycle()

    // borrador que se quiere eliminar (se pide confirmacion antes)
    var porEliminar by remember { mutableStateOf<Long?>(null) }

    // al abrir la pantalla: enviar pendientes y traer las respuestas del administrador
    LaunchedEffect(Unit) { solicitudVM.cargarMisSolicitudes() }

    porEliminar?.let { localId ->
        AlertDialog(
            onDismissRequest = { porEliminar = null },
            title = { Text("¿Eliminar esta solicitud?") },
            text = { Text("No llegó a la inmobiliaria. Si la eliminas se borra de tu celular.") },
            confirmButton = { TextButton(onClick = { solicitudVM.eliminarBorrador(localId); porEliminar = null }) { Text("Eliminar") } },
            dismissButton = { TextButton(onClick = { porEliminar = null }) { Text("Cancelar") } }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mis solicitudes") },
                navigationIcon = { IconButton(onClick = onVolver) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver") } },
                actions = { IconButton(onClick = { solicitudVM.cargarMisSolicitudes() }) { Icon(Icons.Default.Refresh, contentDescription = "Actualizar") } }
            )
        }
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(horizontal = 16.dp)) {
            item {
                if (sinConexion) AvisoSinConexion("Sin conexión: estas son las últimas respuestas guardadas en tu celular.")
                if (cargando) {
                    Box(Modifier.fillMaxWidth().padding(vertical = 8.dp), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            }

            if (!cargando && solicitudes.isEmpty()) {
                item {
                    Column(Modifier.fillMaxWidth().padding(32.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(Icons.Default.Email, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(80.dp))
                        Spacer(Modifier.height(12.dp))
                        Text("Aún no tienes solicitudes", style = MaterialTheme.typography.titleLarge)
                        Text("Abre un inmueble y toca \"Agendar visita\" o \"Pedir información\".", textAlign = TextAlign.Center)
                    }
                }
            }

            items(solicitudes) { s ->
                val inmueble = inmuebleVM.buscarInmueble(s.inmuebleId)
                Card(Modifier.fillMaxWidth().padding(vertical = 6.dp).clickable(enabled = inmueble != null) { onDetalle(s.inmuebleId) }) {
                    Column(Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(if (s.tipo == "informacion") "Pedir información" else "Visita", fontWeight = FontWeight.Bold, modifier = Modifier.weight(1f))
                            EstadoChip(s.estado)
                        }
                        Text(inmueble?.let { "${it.codigo} · ${it.titulo}" } ?: "Inmueble ya no disponible", fontSize = 14.sp)
                        if (s.tipo == "visita" && s.fechaCita.isNotBlank()) {
                            Text("${formatoFecha(s.fechaCita)} · ${s.hora}", color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Bold)
                        }
                        if (s.mensaje.isNotBlank()) Text("Tú: ${s.mensaje}", fontSize = 14.sp, modifier = Modifier.padding(top = 4.dp))

                        // respuesta del administrador (desde el panel web)
                        if (s.respuesta.isNotBlank()) {
                            Column(
                                Modifier.fillMaxWidth().padding(top = 10.dp)
                                    .background(Color(0xFFFDE8E8), RoundedCornerShape(8.dp)).padding(10.dp)
                            ) {
                                Text("Respuesta de Caracoli", fontWeight = FontWeight.Bold, fontSize = 13.sp, color = MaterialTheme.colorScheme.primary)
                                Text(s.respuesta, color = Color(0xFF111111))
                            }
                        } else if (s.porEnviar && s.errorEnvio.isNotBlank()) {
                            // borrador que el servidor rechazo: se muestra el motivo y el cliente decide
                            Text(s.errorEnvio, color = MaterialTheme.colorScheme.error, fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp))
                            Row(Modifier.padding(top = 4.dp)) {
                                TextButton(onClick = { solicitudVM.reintentar(s.localId) }, enabled = !cargando) { Text("Reintentar") }
                                TextButton(onClick = { porEliminar = s.localId }) { Text("Eliminar") }
                            }
                        } else if (s.porEnviar) {
                            Text("Guardada en tu celular. Se enviará cuando tengas conexión.", fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp))
                        } else {
                            Text("Esperando respuesta de la inmobiliaria.", fontSize = 13.sp, modifier = Modifier.padding(top = 8.dp))
                        }
                    }
                }
            }
            item { Spacer(Modifier.height(16.dp)) }
        }
    }
}
