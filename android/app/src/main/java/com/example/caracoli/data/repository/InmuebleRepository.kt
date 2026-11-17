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
            val status = respuesta.optString("status")
            // la api responde 404 con "No hay inmuebles para mostrar" cuando el catalogo de verdad esta vacio.
            // ANTES: cualquier otra respuesta (error 500, servidor equivocado, respuesta vacia "{}") tambien se
            // tomaba como lista vacia y se BORRABA la copia de Room, guardando la tabla vacia.
            // AHORA: si la respuesta no es valida se lanza un error y se usa la copia guardada (catch).
            val catalogoVacio = status == "error" && respuesta.optString("message").startsWith("No hay inmuebles")
            if (status != "success" && !catalogoVacio) throw IllegalStateException("Respuesta no valida del servidor")
            val lista = if (status == "success") respuesta.optJSONArray("inmuebles") ?: JSONArray() else JSONArray()

            val descargados = mutableListOf<Inmueble>()
            for (i in 0 until lista.length()) {
                val json = lista.optJSONObject(i) ?: continue
                val inmueble = ApiClient.inmuebleDesdeJson(json)
                // ANTES se guardaban en Room tal cual, aunque vinieran sin id, sin codigo o sin titulo.
                // AHORA solo se guardan los inmuebles con sus datos obligatorios completos.
                if (inmuebleCompleto(inmueble)) descargados.add(limpiar(inmueble))
            }
            // si el servidor mando inmuebles pero ninguno sirve, no se borra lo que ya estaba guardado
            if (lista.length() > 0 && descargados.isEmpty()) throw IllegalStateException("Inmuebles sin datos")

            // la copia local se REEMPLAZA completa con lo del servidor (los favoritos de DataStore no se tocan)
            val filas = mutableListOf<InmuebleEntity>()
            descargados.forEach { filas.add(inmuebleParaTabla(it)) }
            dao.reemplazar(filas)
            llenar(descargados)
            true
        } catch (e: Exception) {
            // sin conexion o respuesta no valida: lo ultimo que se guardo en Room
            val guardados = mutableListOf<Inmueble>()
            dao.todos().forEach { guardados.add(inmuebleDesdeTabla(it)) }
            llenar(guardados)
            false
        }
    }

    // datos obligatorios de un inmueble: id, codigo, titulo, tipo, operacion y precio mayor que 0
    // (son los mismos que exige la API al publicarlo desde el panel)
    private fun inmuebleCompleto(inmueble: Inmueble): Boolean =
        inmueble.id.isNotBlank() && inmueble.codigo.isNotBlank() && inmueble.titulo.isNotBlank() &&
                inmueble.tipo.isNotBlank() && (inmueble.operacion == "venta" || inmueble.operacion == "arriendo") &&
                inmueble.precio > 0

    // quita los espacios sobrantes de los textos antes de guardarlos
    private fun limpiar(inmueble: Inmueble): Inmueble = inmueble.copy(
        id = inmueble.id.trim(), codigo = inmueble.codigo.trim(), titulo = inmueble.titulo.trim(),
        tipo = inmueble.tipo.trim(), barrio = inmueble.barrio.trim(), ciudad = inmueble.ciudad.trim(),
        descripcion = inmueble.descripcion.trim(), estado = inmueble.estado.trim()
    )

    // El cliente solo ve los inmuebles DISPONIBLES y con sus datos completos
    // (asi tampoco salen filas vacias que hubieran quedado guardadas en Room de antes).
    private fun llenar(lista: List<Inmueble>) {
        inmuebles.clear()
        lista.forEach { inmueble ->
            if (inmueble.estado == "disponible" && inmuebleCompleto(inmueble)) inmuebles.add(inmueble)
        }
    }

    fun obtenerInmuebles(): List<Inmueble> = inmuebles.toList()

    // con un id vacio no se busca nada (antes podia encontrar un inmueble guardado sin id)
    fun buscarInmueble(id: String): Inmueble? =
        if (id.isBlank()) null else inmuebles.find { it.id == id }

    // Busca por el codigo que aparece en el letrero (sin importar mayusculas): "car-102" = "CAR-102"
    // Si el codigo llega vacio no se busca (antes devolvia un inmueble guardado sin codigo).
    fun buscarPorCodigo(codigo: String): Inmueble? {
        val buscado = codigo.trim()
        if (buscado.isBlank()) return null
        return inmuebles.find { it.codigo.equals(buscado, ignoreCase = true) }
    }

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
