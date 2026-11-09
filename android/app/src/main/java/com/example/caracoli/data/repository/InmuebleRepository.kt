// CARPETA data/repository: el Repository decide DE DONDE salen los inmuebles.
// Con internet: de la API (los publica el administrador en el panel web) y se guarda una copia en Room.
// Sin internet: de la copia guardada en Room (tabla "inmuebles").
// Las pantallas no saben de donde vienen los datos: siempre le piden al ViewModel y este al Repository.
package com.example.caracoli.data.repository

import com.example.caracoli.data.local.PreferencesManager
import com.example.caracoli.data.local.room.InmuebleDao
import com.example.caracoli.data.local.room.InmuebleEntity
import com.example.caracoli.data.local.room.inmuebleDesdeTabla
import com.example.caracoli.data.local.room.inmuebleParaTabla
import com.example.caracoli.data.remote.ApiClient
import com.example.caracoli.model.FiltroOperacion
import com.example.caracoli.model.Inmueble
import kotlinx.coroutines.flow.first
import org.json.JSONArray

class InmuebleRepository(private val manager: PreferencesManager, private val dao: InmuebleDao) {

    private val inmuebles = mutableListOf<Inmueble>()

    // Devuelve true si los datos vinieron de internet y false si se uso la copia de Room.
    suspend fun cargar(): Boolean {
        val servidor = manager.servidor.first()
        return try {
            val respuesta = ApiClient.get("$servidor/inmuebles")
            // la api responde 404 con status "error" cuando no hay inmuebles: lista vacia
            val lista = if (respuesta.optString("status") == "success") respuesta.getJSONArray("inmuebles") else JSONArray()
            val descargados = mutableListOf<Inmueble>()
            for (i in 0 until lista.length()) {
                descargados.add(ApiClient.inmuebleDesdeJson(lista.getJSONObject(i)))
            }
            // la copia local se REEMPLAZA completa con lo del servidor (los favoritos de DataStore no se tocan)
            val filas = mutableListOf<InmuebleEntity>()
            descargados.forEach { filas.add(inmuebleParaTabla(it)) }
            dao.reemplazar(filas)
            llenar(descargados)
            true
        } catch (e: Exception) {
            // sin conexion: lo ultimo que se guardo en Room
            val guardados = mutableListOf<Inmueble>()
            dao.todos().forEach { guardados.add(inmuebleDesdeTabla(it)) }
            llenar(guardados)
            false
        }
    }

    // El cliente solo ve los inmuebles DISPONIBLES.
    private fun llenar(lista: List<Inmueble>) {
        inmuebles.clear()
        lista.forEach { inmueble ->
            if (inmueble.estado == "disponible") inmuebles.add(inmueble)
        }
    }

    fun obtenerInmuebles(): List<Inmueble> = inmuebles.toList()

    fun buscarInmueble(id: String): Inmueble? = inmuebles.find { it.id == id }

    // Busca por el codigo que aparece en el letrero (sin importar mayusculas): "car-102" = "CAR-102"
    fun buscarPorCodigo(codigo: String): Inmueble? = inmuebles.find { it.codigo.equals(codigo.trim(), ignoreCase = true) }

    // Filtra por operacion y por el texto del buscador (titulo, barrio, tipo o codigo).
    // Se recorre con forEach y se decide con when, como en MiRuta.
    fun filtrar(filtro: FiltroOperacion, texto: String): List<Inmueble> {
        val resultado = mutableListOf<Inmueble>()
        val buscado = texto.trim()
        inmuebles.forEach { inmueble ->
            val cumpleOperacion = when (filtro) {
                FiltroOperacion.TODOS -> true
                FiltroOperacion.VENTA -> inmueble.operacion == "venta"
                FiltroOperacion.ARRIENDO -> inmueble.operacion == "arriendo"
            }
            val cumpleTexto = buscado.isBlank() ||
                    inmueble.titulo.contains(buscado, ignoreCase = true) ||
                    inmueble.barrio.contains(buscado, ignoreCase = true) ||
                    inmueble.tipo.contains(buscado, ignoreCase = true) ||
                    inmueble.codigo.contains(buscado, ignoreCase = true)
            if (cumpleOperacion && cumpleTexto) resultado.add(inmueble)
        }
        return resultado
    }
}
