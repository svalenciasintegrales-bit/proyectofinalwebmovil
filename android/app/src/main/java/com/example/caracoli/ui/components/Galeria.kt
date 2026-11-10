// CARRUSEL de fotos y VIDEO de YouTube del detalle del inmueble.
package com.example.caracoli.ui.components

import android.annotation.SuppressLint
import android.webkit.WebChromeClient
import android.webkit.WebView
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.example.caracoli.model.Inmueble

// Fotos del carrusel: primero la portada y despues las demas (sin repetir).
// Los inmuebles viejos solo tienen la portada; si no hay ninguna foto queda una vacia (sale el simbolo).
fun fotosDelCarrusel(inmueble: Inmueble): List<String> {
    val fotos = mutableListOf<String>()
    if (inmueble.imagen.isNotBlank()) fotos.add(inmueble.imagen)
    for (foto in inmueble.imagenes) {
        if (foto.isNotBlank() && !fotos.contains(foto)) fotos.add(foto)
    }
    if (fotos.isEmpty()) fotos.add("")
    return fotos
}

// HorizontalPager: las fotos se deslizan con el dedo (igual que la bienvenida).
// Abajo: la etiqueta SE VENDE / SE ARRIENDA, los puntos del carrusel y el contador (ej: 2/5).
@Composable
fun CarruselFotos(fotos: List<String>, servidor: String, operacion: String, modifier: Modifier) {
    val estado = rememberPagerState(pageCount = { fotos.size })
    Box(modifier) {
        HorizontalPager(state = estado, modifier = Modifier.fillMaxSize()) { pagina ->
            FotoInmueble(fotos[pagina], servidor, Modifier.fillMaxSize())
        }
        EtiquetaOperacion(operacion, Modifier.align(Alignment.BottomStart).padding(bottom = 14.dp))

        if (fotos.size > 1) {
            // contador arriba a la derecha
            Text(
                "${estado.currentPage + 1}/${fotos.size}",
                color = Color.White, fontSize = 13.sp,
                modifier = Modifier.align(Alignment.TopEnd).padding(12.dp)
                    .background(Color(0x99000000), RoundedCornerShape(12.dp))
                    .padding(horizontal = 10.dp, vertical = 3.dp)
            )
            // puntos: el de la foto actual es mas ancho y blanco
            Row(Modifier.align(Alignment.BottomCenter).padding(bottom = 16.dp), horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                for (i in fotos.indices) {
                    val actual = i == estado.currentPage
                    Box(
                        Modifier.height(8.dp).width(if (actual) 22.dp else 8.dp).clip(CircleShape)
                            .background(if (actual) Color.White else Color(0x99FFFFFF))
                    )
                }
            }
        }
    }
}

// id del video (11 letras/numeros) del enlace que guarda la api: https://www.youtube.com/watch?v=ID
fun idVideoYoutube(enlace: String): String {
    val despues = enlace.substringAfter("v=", "")
    return if (despues.length >= 11) despues.substring(0, 11) else ""
}

// VIDEO DE YOUTUBE dentro de la app: un WebView con el reproductor de YouTube (iframe).
// YouTube pide saber desde donde se reproduce: por eso la pagina se carga con la direccion
// https://com.example.caracoli (el id de la app), que viaja como "Referer".
@SuppressLint("SetJavaScriptEnabled")
@Composable
fun VideoYoutube(enlace: String, modifier: Modifier) {
    val id = idVideoYoutube(enlace)
    if (id.isBlank()) return
    val html = "<!DOCTYPE html><html><head><meta name='viewport' content='width=device-width, initial-scale=1'>" +
            // position:fixed + inset:0: el reproductor ocupa todo el WebView (con height:100% quedaba en 0)
            "<style>html,body{margin:0;background:#000}iframe{position:fixed;top:0;left:0;right:0;bottom:0;border:0;width:100%;height:100%}</style></head><body>" +
            "<iframe src='https://www.youtube.com/embed/$id?playsinline=1&rel=0' " +
            "allow='accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen' " +
            "referrerpolicy='strict-origin-when-cross-origin' allowfullscreen></iframe></body></html>"

    AndroidView(
        factory = { context ->
            val web = WebView(context)
            web.settings.javaScriptEnabled = true // el reproductor de YouTube funciona con JavaScript
            web.settings.domStorageEnabled = true
            web.settings.mediaPlaybackRequiresUserGesture = false
            web.webChromeClient = WebChromeClient() // necesario para reproducir video
            web.loadDataWithBaseURL("https://com.example.caracoli", html, "text/html", "utf-8", null)
            web
        },
        // al salir de la pantalla se destruye el WebView (el video deja de sonar)
        onRelease = { web -> web.destroy() },
        modifier = modifier.clip(RoundedCornerShape(12.dp))
    )
}
