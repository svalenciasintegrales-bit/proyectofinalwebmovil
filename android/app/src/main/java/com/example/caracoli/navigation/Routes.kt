// CARPETA navigation: nombres de las pantallas (rutas) y el NavHost que cambia entre ellas.
package com.example.caracoli.navigation

// object con las rutas como constantes (asi no se escriben a mano en cada lugar).
object Routes {
    const val ONBOARDING = "onboarding"
    const val HOME = "home"
    const val DETAIL = "detail/{id}" // {id} = id del inmueble en MongoDB
    const val SOLICITUD = "solicitud/{id}/{tipo}" // tipo = informacion o visita
    const val MIS_SOLICITUDES = "mis_solicitudes"
    const val FAVORITOS = "favoritos"
    const val AJUSTES = "ajustes"

    fun detalle(id: String) = "detail/$id"
    fun solicitud(id: String, tipo: String) = "solicitud/$id/$tipo"
}
