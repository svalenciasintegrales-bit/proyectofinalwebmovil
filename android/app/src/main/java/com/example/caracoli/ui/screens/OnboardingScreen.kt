// Pantalla 1: BIENVENIDA (solo la primera vez). HorizontalPager + Lottie + indicador hecho a mano.
package com.example.caracoli.ui.screens

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.HorizontalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.airbnb.lottie.compose.LottieAnimation
import com.airbnb.lottie.compose.LottieCompositionSpec
import com.airbnb.lottie.compose.LottieConstants
import com.airbnb.lottie.compose.rememberLottieComposition
import com.example.caracoli.R
import kotlinx.coroutines.launch

@Composable
fun OnboardingScreen(onTerminar: () -> Unit) {
    // Contenido de las 3 paginas
    val animaciones = listOf(R.raw.welcome, R.raw.onboarding_phone, R.raw.onboarding_resumen)
    val titulos = listOf("Bienvenido a Caracoli", "Encuentra tu inmueble", "Agenda tu visita")
    val textos = listOf(
        "Casas, apartamentos, locales y lotes en venta y arriendo en Cartago, Valle del Cauca.",
        "Busca por barrio o tipo, mira las fotos y calcula la cuota de tu crédito.",
        "Guarda tus favoritos y agenda visitas. Todo queda guardado en tu celular, aunque no tengas internet."
    )

    val pagerState = rememberPagerState(pageCount = { 3 })
    val scope = rememberCoroutineScope() // para mover el pager desde los botones

    Column(Modifier.fillMaxSize().padding(24.dp), horizontalAlignment = Alignment.CenterHorizontally) {
        Image(painter = painterResource(id = R.drawable.logo), contentDescription = "Caracoli Inmobiliaria", modifier = Modifier.height(110.dp))

        // HorizontalPager: las paginas se deslizan con el dedo
        HorizontalPager(state = pagerState, modifier = Modifier.weight(1f)) { pagina ->
            Column(Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
                AnimacionLottie(animaciones[pagina], Modifier.size(240.dp))
                Spacer(Modifier.height(16.dp))
                Text(titulos[pagina], style = MaterialTheme.typography.headlineMedium, textAlign = TextAlign.Center)
                Spacer(Modifier.height(12.dp))
                Text(textos[pagina], textAlign = TextAlign.Center)
            }
        }

        // Indicador: una barrita por pagina, la actual en rojo
        Row(horizontalArrangement = Arrangement.Center) {
            repeat(3) { Indicador(seleccionado = it == pagerState.currentPage) }
        }
        Spacer(Modifier.height(20.dp))

        Row(Modifier.fillMaxWidth(), horizontalArrangement = if (pagerState.currentPage > 0) Arrangement.SpaceBetween else Arrangement.Center) {
            if (pagerState.currentPage > 0) {
                OutlinedButton(onClick = { scope.launch { pagerState.animateScrollToPage(pagerState.currentPage - 1) } }) { Text("Anterior") }
            }
            Button(onClick = {
                if (pagerState.currentPage < 2) scope.launch { pagerState.animateScrollToPage(pagerState.currentPage + 1) }
                else onTerminar()
            }) { Text(if (pagerState.currentPage == 2) "Empezar" else "Siguiente") }
        }
    }
}

// Animacion Lottie que se repite siempre (igual que LoaderData de tumovil)
@Composable
fun AnimacionLottie(animacion: Int, modifier: Modifier) {
    val composition by rememberLottieComposition(spec = LottieCompositionSpec.RawRes(resId = animacion))
    LottieAnimation(composition = composition, iterations = LottieConstants.IterateForever, modifier = modifier)
}

@Composable
fun Indicador(seleccionado: Boolean) {
    Box(
        Modifier.padding(5.dp).height(10.dp).width(if (seleccionado) 30.dp else 12.dp).clip(CircleShape)
            .background(if (seleccionado) MaterialTheme.colorScheme.primary else Color.LightGray)
    )
}
