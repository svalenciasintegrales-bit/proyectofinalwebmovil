// Descarga la foto de un inmueble desde la API y la guarda en el celular.
// La siguiente vez se lee del celular: asi las fotos tambien se ven SIN conexion.
package com.example.caracoli.data.remote

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object FotoCache {

    suspend fun cargar(context: Context, servidor: String, imagen: String): Bitmap? = withContext(Dispatchers.IO) {
        if (imagen.isBlank()) return@withContext null
        // filesDir: carpeta privada de la app en el celular
        val archivo = File(context.filesDir, "foto_$imagen")
        try {
            if (!archivo.exists()) {
                val conexion = URL("$servidor/get-image/$imagen").openConnection() as HttpURLConnection
                conexion.connectTimeout = 5000
                conexion.readTimeout = 10000
                try {
                    if (conexion.responseCode == 200) {
                        val temporal = File(context.filesDir, "foto_$imagen.tmp")
                        temporal.writeBytes(conexion.inputStream.readBytes())
                        temporal.renameTo(archivo)
                    }
                } finally {
                    conexion.disconnect()
                }
            }
            if (archivo.exists()) BitmapFactory.decodeFile(archivo.path) else null
        } catch (e: Exception) {
            null // sin internet y sin foto guardada: la pantalla muestra el logo
        }
    }
}
