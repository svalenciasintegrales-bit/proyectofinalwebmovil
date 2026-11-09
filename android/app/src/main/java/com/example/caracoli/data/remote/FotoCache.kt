// Descarga la foto de un inmueble desde la API (la misma que muestra el panel web).
// Si no hay internet o el inmueble no tiene foto, la pantalla muestra el simbolo de Caracoli.
package com.example.caracoli.data.remote

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object FotoCache {

    suspend fun cargar(servidor: String, imagen: String): Bitmap? = withContext(Dispatchers.IO) {
        if (imagen.isBlank()) return@withContext null
        try {
            val conexion = URL("$servidor/get-image/$imagen").openConnection() as HttpURLConnection
            conexion.connectTimeout = 5000
            conexion.readTimeout = 10000
            try {
                if (conexion.responseCode == 200) BitmapFactory.decodeStream(conexion.inputStream) else null
            } finally {
                conexion.disconnect()
            }
        } catch (e: Exception) {
            null // sin internet: la pantalla muestra el simbolo
        }
    }
}
