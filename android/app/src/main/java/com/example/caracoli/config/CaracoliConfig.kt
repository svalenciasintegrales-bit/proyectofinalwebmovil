// CARPETA config: datos fijos de la inmobiliaria (object + const val).
package com.example.caracoli.config

object CaracoliConfig {
    const val NOMBRE = "Caracoli Inmobiliaria"
    const val ESLOGAN = "Tu confianza, nuestra prioridad"
    const val CIUDAD = "Cartago, Valle del Cauca"
    const val DIRECCION = "Cra 3 # 11-89 Centro, Cartago"
    const val TELEFONO = "314 780 2883"
    const val TELEFONO_2 = "310 650 1884"

    // direccion de la API por defecto. 10.0.2.2 = el computador visto desde el emulador de Android.
    // En un celular real se cambia en Ajustes por la IP del computador (ej: http://192.168.1.50:3900/api).
    const val SERVIDOR_POR_DEFECTO = "http://10.0.2.2:3900/api"
}
