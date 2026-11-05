// Tema de la app con los colores de Caracoli Inmobiliaria (rojo del logo, rojo oscuro y negro).
package com.example.caracoli.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Typography
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val RojoCaracoli = Color(0xFFE3141B)
val RojoOscuro = Color(0xFF8B0000)
val Negro = Color(0xFF111111)
val GrisTexto = Color(0xFF4A4A4A)
val GrisClaro = Color(0xFFF4F4F4)
val RojoSuave = Color(0xFFFF6B6F)

// Titulos con letra serif (como Georgia en los videos y la pagina de Caracoli).
val CaracoliTypography = Typography(
    headlineLarge = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 30.sp),
    headlineMedium = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 24.sp),
    titleLarge = TextStyle(fontFamily = FontFamily.Serif, fontWeight = FontWeight.Bold, fontSize = 20.sp),
    titleMedium = TextStyle(fontWeight = FontWeight.Bold, fontSize = 16.sp)
)

// oscuro viene de DataStore: si el usuario lo activa en Ajustes, toda la app cambia.
@Composable
fun CaracoliTheme(oscuro: Boolean, content: @Composable () -> Unit) {
    val colores = if (oscuro) darkColorScheme(primary = RojoSuave, secondary = RojoCaracoli, onPrimary = Color.White)
                  else lightColorScheme(primary = RojoCaracoli, secondary = RojoOscuro, onPrimary = Color.White, surfaceVariant = GrisClaro)
    MaterialTheme(colorScheme = colores, typography = CaracoliTypography, content = content)
}
