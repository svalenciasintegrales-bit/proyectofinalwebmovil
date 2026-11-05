// ViewModel de la BASE DE DATOS LOCAL (DataStore): conecta PreferencesManager con las pantallas.
package com.example.caracoli.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.caracoli.config.CaracoliConfig
import com.example.caracoli.data.local.PreferencesManager
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

class PreferencesViewModel(private val manager: PreferencesManager) : ViewModel() {

    // stateIn: convierte el Flow de DataStore en StateFlow (siempre tiene un valor actual).
    val oscuro = manager.oscuro.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), false)
    val nombre = manager.nombre.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")
    val telefono = manager.telefono.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), "")
    val servidor = manager.servidor.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), CaracoliConfig.SERVIDOR_POR_DEFECTO)
    val favoritos = manager.favoritos.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptySet<String>())

    // Las funciones de guardar son suspend, por eso van dentro de viewModelScope.launch.
    fun finalizarOnboarding() = viewModelScope.launch { manager.finalizarOnboarding() }
    fun guardarOscuro(valor: Boolean) = viewModelScope.launch { manager.guardarOscuro(valor) }
    fun guardarDatos(nombre: String, telefono: String) = viewModelScope.launch { manager.guardarDatos(nombre, telefono) }
    fun guardarServidor(valor: String) = viewModelScope.launch { manager.guardarServidor(valor) }

    // Si ya es favorito lo quita, si no lo agrega.
    fun cambiarFavorito(id: String, esFavorito: Boolean) = viewModelScope.launch { manager.cambiarFavorito(id, !esFavorito) }
}
