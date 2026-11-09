// Pantalla 4: FORMULARIO para PEDIR INFORMACION o AGENDAR VISITA.
// Al enviar, la solicitud viaja por la API a MongoDB y aparece en el panel del administrador.
// Sin internet queda guardada en el celular (DataStore) y se envia sola cuando vuelve la conexion.
package com.example.caracoli.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import com.example.caracoli.model.ResultadoEnvio
import com.example.caracoli.ui.theme.Negro
import com.example.caracoli.ui.theme.RojoCaracoli
import com.example.caracoli.viewmodel.InmuebleViewModel
import com.example.caracoli.viewmodel.PreferencesViewModel
import com.example.caracoli.viewmodel.SolicitudViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SolicitudScreen(
    id: String, tipo: String, inmuebleVM: InmuebleViewModel, solicitudVM: SolicitudViewModel, prefs: PreferencesViewModel,
    onVolver: () -> Unit, onVerSolicitudes: () -> Unit
) {
    val inmueble = inmuebleVM.buscarInmueble(id)
    val esVisita = tipo == "visita"
    val nombreGuardado by prefs.nombre.collectAsStateWithLifecycle()
    val telefonoGuardado by prefs.telefono.collectAsStateWithLifecycle()
    val enviando by solicitudVM.enviando.collectAsStateWithLifecycle()
    val resultado by solicitudVM.resultado.collectAsStateWithLifecycle()

    var nombre by rememberSaveable { mutableStateOf("") }
    var telefono by rememberSaveable { mutableStateOf("") }
    var mensaje by rememberSaveable { mutableStateOf("") }
    var fecha by rememberSaveable { mutableStateOf("") }
    var hora by rememberSaveable { mutableStateOf("") }
    var intentoEnviar by remember { mutableStateOf(false) }

    // Si el cliente ya escribio sus datos antes (DataStore), se llenan solos
    LaunchedEffect(nombreGuardado, telefonoGuardado) {
        if (nombre.isBlank()) nombre = nombreGuardado
        if (telefono.isBlank()) telefono = telefonoGuardado
    }

    val horas = listOf("8:00 a.m.", "9:00 a.m.", "10:00 a.m.", "11:00 a.m.", "2:00 p.m.", "3:00 p.m.", "4:00 p.m.", "5:00 p.m.")
    // La fecha debe tener el formato AAAA-MM-DD, con mes entre 1 y 12 y dia entre 1 y 31
    val mes = if (fecha.length == 10) fecha.substring(5, 7).toIntOrNull() ?: 0 else 0
    val dia = if (fecha.length == 10) fecha.substring(8, 10).toIntOrNull() ?: 0 else 0
    // Si la fecha ya paso, el servidor la rechaza y su mensaje sale en el dialogo (lo escrito se conserva)
    val fechaValida = fecha.length == 10 && fecha[4] == '-' && fecha[7] == '-' && mes in 1..12 && dia in 1..31

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (esVisita) "Agendar visita" else "Pedir información") },
                navigationIcon = { IconButton(onClick = onVolver) { Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver") } }
            )
        }
    ) { padding ->
        LazyColumn(Modifier.fillMaxSize().padding(padding).padding(16.dp)) {
            item {
                Text(inmueble?.titulo ?: "", style = MaterialTheme.typography.titleLarge)
                Text("Código ${inmueble?.codigo ?: ""} · ${inmueble?.barrio ?: ""}")
                Spacer(Modifier.height(16.dp))

                OutlinedTextField(
                    value = nombre, onValueChange = { nombre = it }, label = { Text("Nombre completo *") },
                    isError = intentoEnviar && nombre.isBlank(), singleLine = true, modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))
                OutlinedTextField(
                    value = telefono, onValueChange = { telefono = it }, label = { Text("Celular *") },
                    isError = intentoEnviar && telefono.isBlank(), singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone), modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(8.dp))

                if (esVisita) {
                    OutlinedTextField(
                        value = fecha, onValueChange = { fecha = it }, label = { Text("Fecha * (AAAA-MM-DD)") },
                        placeholder = { Text("2026-11-20") },
                        isError = intentoEnviar && !fechaValida, singleLine = true,
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number), modifier = Modifier.fillMaxWidth()
                    )
                    if (intentoEnviar && !fechaValida) Text("Escribe la fecha así: 2026-11-20", color = RojoCaracoli)
                    Spacer(Modifier.height(12.dp))
                    Text("Hora *", color = if (intentoEnviar && hora.isBlank()) RojoCaracoli else MaterialTheme.colorScheme.onBackground)
                    // LazyRow: las horas en una fila que se desliza; la elegida se pinta de rojo
                    LazyRow {
                        items(horas) { h ->
                            val activa = h == hora
                            Button(
                                onClick = { hora = h },
                                modifier = Modifier.padding(end = 8.dp),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (activa) RojoCaracoli else Color(0xFFE6E6E6),
                                    contentColor = if (activa) Color.White else Negro
                                )
                            ) { Text(h) }
                        }
                    }
                    Spacer(Modifier.height(12.dp))
                }

                OutlinedTextField(
                    value = mensaje, onValueChange = { mensaje = it },
                    label = { Text(if (esVisita) "Comentario (opcional)" else "¿Qué quieres saber? *") },
                    placeholder = { Text(if (esVisita) "Ej: voy con mi familia" else "Ej: ¿el precio es negociable?") },
                    isError = intentoEnviar && !esVisita && mensaje.isBlank(),
                    minLines = 3,
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(Modifier.height(20.dp))

                Button(
                    onClick = {
                        intentoEnviar = true
                        val completo = nombre.isNotBlank() && telefono.isNotBlank() &&
                                (if (esVisita) fechaValida && hora.isNotBlank() else mensaje.isNotBlank())
                        if (completo) solicitudVM.enviar(id, tipo, nombre, telefono, mensaje, fecha, hora)
                    },
                    enabled = !enviando,
                    modifier = Modifier.fillMaxWidth().height(52.dp)
                ) {
                    if (enviando) CircularProgressIndicator(modifier = Modifier.size(22.dp), color = Color.White, strokeWidth = 2.dp)
                    else Text(if (esVisita) "Confirmar visita" else "Enviar pregunta")
                }
                Text("La inmobiliaria responde por la app, en \"Mis solicitudes\".", modifier = Modifier.padding(top = 8.dp))
            }
        }
    }

    // Dialogo con el resultado del envio
    resultado?.let { envio ->
        val titulo = when (envio.resultado) {
            ResultadoEnvio.ENVIADA -> if (esVisita) "¡Visita agendada!" else "¡Solicitud enviada!"
            ResultadoEnvio.SIN_CONEXION -> "Guardada sin conexión"
            ResultadoEnvio.ERROR -> "No se pudo enviar"
        }
        val texto = when (envio.resultado) {
            ResultadoEnvio.ENVIADA -> "$nombre, Caracoli Inmobiliaria ya recibió tu solicitud. Te responderemos en \"Mis solicitudes\" y al $telefono."
            ResultadoEnvio.SIN_CONEXION -> "No hay internet. Tu solicitud quedó guardada en el celular y se enviará sola cuando tengas conexión."
            ResultadoEnvio.ERROR -> envio.mensaje
        }
        AlertDialog(
            onDismissRequest = { solicitudVM.limpiarResultado() },
            title = { Text(titulo) },
            text = { Text(texto) },
            confirmButton = {
                TextButton(onClick = {
                    val salio = envio.resultado != ResultadoEnvio.ERROR
                    solicitudVM.limpiarResultado()
                    if (salio) onVerSolicitudes()
                }) { Text(if (envio.resultado == ResultadoEnvio.ERROR) "Aceptar" else "Ver mis solicitudes") }
            }
        )
    }
}
