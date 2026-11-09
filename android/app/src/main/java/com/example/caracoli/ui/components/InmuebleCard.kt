// CARPETA ui/components: piezas que se repiten en varias pantallas.
package com.example.caracoli.ui.components

import android.graphics.Bitmap
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Favorite
import androidx.compose.material.icons.filled.FavoriteBorder
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.caracoli.R
import com.example.caracoli.data.remote.FotoCache
import com.example.caracoli.model.Inmueble
import com.example.caracoli.model.formatoPrecio
import com.example.caracoli.ui.theme.Negro
import com.example.caracoli.ui.theme.RojoCaracoli

// Foto del inmueble: se descarga de la API.
// Mientras carga (o si no hay foto o internet) se muestra el simbolo de Caracoli.
@Composable
fun FotoInmueble(imagen: String, servidor: String, modifier: Modifier) {
    var foto by remember(imagen) { mutableStateOf<Bitmap?>(null) }
    LaunchedEffect(imagen, servidor) {
        foto = FotoCache.cargar(servidor, imagen)
    }
    val bitmap = foto
    if (bitmap != null) {
        Image(bitmap = bitmap.asImageBitmap(), contentDescription = null, contentScale = ContentScale.Crop, modifier = modifier)
    } else {
        Box(modifier.background(Color(0xFF1B1B1B)), contentAlignment = Alignment.Center) {
            Image(painterResource(R.drawable.simbolo), contentDescription = null, modifier = Modifier.size(70.dp))
        }
    }
}

// Tarjeta de un inmueble: foto, etiqueta de venta/arriendo, precio, nombre, barrio y corazon de favorito.
@Composable
fun InmuebleCard(inmueble: Inmueble, servidor: String, esFavorito: Boolean, onFavorito: () -> Unit, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp).clickable { onClick() },
        shape = RoundedCornerShape(10.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Box {
            FotoInmueble(inmueble.imagen, servidor, Modifier.fillMaxWidth().height(190.dp))
            EtiquetaOperacion(inmueble.operacion, Modifier.align(Alignment.TopStart).padding(top = 12.dp))
            IconButton(
                onClick = onFavorito,
                modifier = Modifier.align(Alignment.TopEnd).padding(6.dp).background(Color.White, RoundedCornerShape(50))
            ) {
                Icon(
                    imageVector = if (esFavorito) Icons.Default.Favorite else Icons.Default.FavoriteBorder,
                    contentDescription = "Favorito",
                    tint = RojoCaracoli
                )
            }
        }
        Column(Modifier.padding(14.dp)) {
            Row(verticalAlignment = Alignment.Bottom) {
                Text(formatoPrecio(inmueble.precio), color = MaterialTheme.colorScheme.primary, fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 22.sp)
                if (inmueble.operacion == "arriendo") Text(" /mes", fontSize = 13.sp)
            }
            Text(inmueble.titulo, style = MaterialTheme.typography.titleLarge)
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Place, contentDescription = null, tint = RojoCaracoli, modifier = Modifier.size(16.dp))
                Text(" ${inmueble.barrio}, ${inmueble.ciudad} · ${inmueble.codigo}", fontSize = 14.sp)
            }
            Spacer(Modifier.height(6.dp))
            Text(datosCortos(inmueble), fontSize = 13.sp)
        }
    }
}

// Etiqueta roja "SE VENDE" o negra "SE ARRIENDA" (como en el panel web).
@Composable
fun EtiquetaOperacion(operacion: String, modifier: Modifier = Modifier) {
    Text(
        text = if (operacion == "venta") "SE VENDE" else "SE ARRIENDA",
        color = Color.White,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 12.sp,
        letterSpacing = 1.5.sp,
        modifier = modifier
            .background(if (operacion == "venta") RojoCaracoli else Negro, RoundedCornerShape(topEnd = 4.dp, bottomEnd = 4.dp))
            .padding(horizontal = 12.dp, vertical = 6.dp)
    )
}

// Estado de una solicitud con su color (igual que en el panel del administrador)
@Composable
fun EstadoChip(estado: String) {
    val colores = when (estado) { // Pair(fondo, letra)
        "pendiente" -> Pair(Color(0xFFFDF1DF), Color(0xFFB45309))
        "confirmada" -> Pair(Color(0xFFE6EDFD), Color(0xFF1D4ED8))
        "realizada" -> Pair(Color(0xFFE3F5EA), Color(0xFF15803D))
        "por enviar" -> Pair(Color(0xFFFDF1DF), Color(0xFF8A4B00))
        "error al enviar" -> Pair(Color(0xFFFDE8E8), RojoCaracoli)
        else -> Pair(Color(0xFFEEEEEE), Color(0xFF6B7280))
    }
    val fondo = colores.first
    val letra = colores.second
    Text(
        estado.uppercase(),
        color = letra,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 11.sp,
        modifier = Modifier.background(fondo, RoundedCornerShape(20.dp)).padding(horizontal = 10.dp, vertical = 4.dp)
    )
}

// Aviso cuando no hay internet
@Composable
fun AvisoSinConexion(texto: String) {
    Text(
        "⚠ $texto",
        color = Color(0xFF8A4B00),
        fontSize = 13.sp,
        modifier = Modifier.fillMaxWidth().padding(vertical = 6.dp)
            .background(Color(0xFFFFF3D6), RoundedCornerShape(8.dp)).padding(10.dp)
    )
}

// "120 m² · 3 hab. · 2 baños" (solo lo que tenga el inmueble).
fun datosCortos(inmueble: Inmueble): String {
    var texto = "${inmueble.area} m²"
    if (inmueble.habitaciones > 0) texto += " · ${inmueble.habitaciones} hab."
    if (inmueble.banos > 0) texto += " · ${inmueble.banos} baños"
    return texto
}
