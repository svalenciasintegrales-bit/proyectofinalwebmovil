// CARPETA data/remote: la conexion con la API de Node (la misma que usa el panel del administrador).
// Se usa HttpURLConnection, que ya viene en Android (no se instala ninguna libreria),
// y JSONObject / JSONArray de Android para leer las respuestas de la API.
package com.example.caracoli.data.remote

import com.example.caracoli.model.Inmueble
import com.example.caracoli.model.Solicitud
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject

object ApiClient {

    // Lee la respuesta. Si la api responde con error (404, 500) el texto viene en errorStream.
    private fun leer(conexion: HttpURLConnection): String {
        val flujo = if (conexion.responseCode < 400) conexion.inputStream else conexion.errorStream
        if (flujo == null) return "{}"
        return flujo.bufferedReader().readText()
    }

    // GET: pedir datos. withContext(Dispatchers.IO): se hace fuera de la pantalla para que no se congele.
    // Si no hay internet lanza un error (IOException) que el Repository atrapa con try/catch.
    suspend fun get(url: String): JSONObject = withContext(Dispatchers.IO) {
        val conexion = URL(url).openConnection() as HttpURLConnection
        conexion.connectTimeout = 5000
        conexion.readTimeout = 8000
        try {
            JSONObject(leer(conexion))
        } finally {
            conexion.disconnect()
        }
    }

    // POST: enviar datos en formato JSON (igual que Postman o Angular)
    suspend fun post(url: String, datos: JSONObject): JSONObject = withContext(Dispatchers.IO) {
        val conexion = URL(url).openConnection() as HttpURLConnection
        conexion.connectTimeout = 5000
        conexion.readTimeout = 8000
        conexion.requestMethod = "POST"
        conexion.doOutput = true
        conexion.setRequestProperty("Content-Type", "application/json; charset=utf-8")
        try {
            conexion.outputStream.write(datos.toString().toByteArray(Charsets.UTF_8))
            JSONObject(leer(conexion))
        } finally {
            conexion.disconnect()
        }
    }

    // MongoDB manda null en algunos campos (ej: imagen). optString devolveria el texto "null".
    private fun texto(j: JSONObject, campo: String): String = if (j.isNull(campo)) "" else j.optString(campo, "")

    // Convierte un inmueble de la API en un objeto Inmueble
    fun inmuebleDesdeJson(j: JSONObject): Inmueble = Inmueble(
        id = texto(j, "_id"),
        codigo = texto(j, "codigo"),
        titulo = texto(j, "titulo"),
        tipo = texto(j, "tipo"),
        operacion = texto(j, "operacion"),
        precio = j.optLong("precio", 0),
        barrio = texto(j, "barrio"),
        ciudad = texto(j, "ciudad"),
        area = j.optInt("area", 0),
        habitaciones = j.optInt("habitaciones", 0),
        banos = j.optInt("banos", 0),
        descripcion = texto(j, "descripcion"),
        imagen = texto(j, "imagen"),
        estado = texto(j, "estado").ifBlank { "disponible" }
    )

    // Convierte una solicitud de la API (coleccion Citas) en un objeto Solicitud
    fun solicitudDesdeJson(j: JSONObject, porEnviar: Boolean): Solicitud = Solicitud(
        id = texto(j, "_id"),
        inmuebleId = texto(j, "inmueble_id"),
        tipo = texto(j, "tipo").ifBlank { "visita" },
        fechaCita = texto(j, "fecha_cita"),
        hora = texto(j, "hora"),
        mensaje = texto(j, "observaciones"),
        respuesta = texto(j, "respuesta"),
        estado = if (porEnviar) "por enviar" else texto(j, "estado").ifBlank { "pendiente" },
        fecha = texto(j, "fecha"),
        porEnviar = porEnviar
    )
}
