// ViewModel de las SOLICITUDES: enviar (informacion o visita), enviar las pendientes y "Mis solicitudes".
package com.example.caracoli.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.caracoli.data.repository.SolicitudRepository
import com.example.caracoli.model.Envio
import com.example.caracoli.model.Solicitud
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class SolicitudViewModel(private val repository: SolicitudRepository) : ViewModel() {

    private val _enviando = MutableStateFlow(false)
    val enviando = _enviando.asStateFlow()

    // resultado del ultimo envio (null = no hay dialogo que mostrar)
    private val _resultado = MutableStateFlow<Envio?>(null)
    val resultado = _resultado.asStateFlow()

    private val _solicitudes = MutableStateFlow<List<Solicitud>>(emptyList())
    val solicitudes = _solicitudes.asStateFlow()

    private val _cargando = MutableStateFlow(false)
    val cargando = _cargando.asStateFlow()

    private val _sinConexion = MutableStateFlow(false)
    val sinConexion = _sinConexion.asStateFlow()

    fun enviar(inmuebleId: String, tipo: String, nombre: String, telefono: String, mensaje: String, fecha: String, hora: String) =
        viewModelScope.launch {
            _enviando.value = true
            _resultado.value = repository.enviar(inmuebleId, tipo, nombre, telefono, mensaje, fecha, hora)
            _enviando.value = false
        }

    fun limpiarResultado() {
        _resultado.value = null
    }

    // primero intenta enviar las pendientes y luego trae la lista actualizada
    fun cargarMisSolicitudes() = viewModelScope.launch {
        _cargando.value = true
        repository.sincronizarPendientes()
        val respuesta = repository.misSolicitudes() // Pair(lista, conectado)
        _solicitudes.value = respuesta.first
        _sinConexion.value = !respuesta.second
        _cargando.value = false
    }

    // se llama al abrir la app: envia lo que quedo guardado sin conexion
    fun sincronizar() = viewModelScope.launch {
        repository.sincronizarPendientes()
    }

    // borrador con error: volver a intentarlo
    fun reintentar(localId: Long) = viewModelScope.launch {
        _cargando.value = true
        repository.reintentar(localId)
        cargarMisSolicitudes()
    }

    // borrador con error: el cliente decide descartarlo (la pantalla pide confirmacion antes)
    fun eliminarBorrador(localId: Long) = viewModelScope.launch {
        repository.eliminarBorrador(localId)
        cargarMisSolicitudes()
    }
}
