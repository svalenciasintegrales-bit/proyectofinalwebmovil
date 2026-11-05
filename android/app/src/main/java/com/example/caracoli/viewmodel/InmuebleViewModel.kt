// ViewModel de los INMUEBLES: la lista, el filtro, el buscador y si hay conexion.
package com.example.caracoli.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.caracoli.data.repository.InmuebleRepository
import com.example.caracoli.model.FiltroOperacion
import com.example.caracoli.model.Inmueble
import kotlin.math.pow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class InmuebleViewModel(private val repository: InmuebleRepository) : ViewModel() {

    // MutableStateFlow privado (solo el ViewModel lo cambia) y asStateFlow publico (las pantallas solo leen).
    private val _filtro = MutableStateFlow(FiltroOperacion.TODOS)
    val filtro = _filtro.asStateFlow()

    private val _texto = MutableStateFlow("")
    val texto = _texto.asStateFlow()

    private val _inmuebles = MutableStateFlow<List<Inmueble>>(emptyList())
    val inmuebles = _inmuebles.asStateFlow()

    private val _cargando = MutableStateFlow(true)
    val cargando = _cargando.asStateFlow()

    // true = no hubo conexion y se esta mostrando el ultimo catalogo guardado
    private val _sinConexion = MutableStateFlow(false)
    val sinConexion = _sinConexion.asStateFlow()

    init {
        cargar()
    }

    // Pide los inmuebles al Repository (API o, sin internet, DataStore)
    fun cargar() = viewModelScope.launch {
        _cargando.value = true
        _sinConexion.value = !repository.cargar()
        actualizarLista()
        _cargando.value = false
    }

    fun cambiarFiltro(nuevo: FiltroOperacion) {
        _filtro.value = nuevo
        actualizarLista()
    }

    fun cambiarTexto(nuevo: String) {
        _texto.value = nuevo
        actualizarLista()
    }

    private fun actualizarLista() {
        _inmuebles.value = repository.filtrar(_filtro.value, _texto.value)
    }

    fun buscarInmueble(id: String): Inmueble? = repository.buscarInmueble(id)

    fun buscarPorCodigo(codigo: String): Inmueble? = repository.buscarPorCodigo(codigo)

    // Convierte los ids favoritos en la lista de inmuebles.
    fun inmueblesFavoritos(ids: Set<String>): List<Inmueble> {
        val lista = mutableListOf<Inmueble>()
        ids.forEach { id -> repository.buscarInmueble(id)?.let { lista.add(it) } }
        return lista
    }

    // SIMULADOR DE CUOTA: cuota fija mensual de un credito.
    // tasaAnual = tasa efectiva anual en %. Se pasa a tasa mensual: (1 + EA)^(1/12) - 1
    // Formula: prestamo * i / (1 - (1 + i)^-meses)
    fun cuotaMensual(precio: Long, cuotaInicial: Double, anios: Int, tasaAnual: Double): Long {
        val prestamo = precio * (1 - cuotaInicial / 100)
        val meses = anios * 12
        if (prestamo <= 0 || meses <= 0) return 0
        val tasaMes = (1 + tasaAnual / 100).pow(1.0 / 12) - 1
        if (tasaMes == 0.0) return (prestamo / meses).toLong()
        return (prestamo * tasaMes / (1 - (1 + tasaMes).pow(-meses.toDouble()))).toLong()
    }
}
