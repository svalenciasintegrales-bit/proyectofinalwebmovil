// CARPETA model: los "moldes" de los datos de la app.
package com.example.caracoli.model

// Un inmueble publicado por el administrador en el panel web (viene de la API / MongoDB).
// id = el _id de MongoDB | imagen = nombre del archivo de la foto en el servidor
data class Inmueble(
    val id: String,
    val codigo: String,
    val titulo: String,
    val tipo: String,
    val operacion: String, // "venta" o "arriendo"
    val precio: Long,
    val barrio: String,
    val ciudad: String,
    val area: Int,
    val habitaciones: Int,
    val banos: Int,
    val descripcion: String,
    val imagen: String,
    val estado: String
)

// Una solicitud del cliente: pedir informacion o agendar visita.
// porEnviar = true cuando es un BORRADOR guardado en Room que todavia no confirma el servidor
// (localId = su id en Room | errorEnvio = por que el servidor la rechazo, si fue asi).
data class Solicitud(
    val id: String,
    val inmuebleId: String,
    val tipo: String, // "informacion" o "visita"
    val fechaCita: String,
    val hora: String,
    val mensaje: String,
    val respuesta: String,
    val estado: String, // pendiente, confirmada, realizada o cancelada (o "por enviar" / "error al enviar" si es borrador)
    val fecha: String,
    val porEnviar: Boolean,
    val localId: Long = 0,
    val errorEnvio: String = ""
)

// enum class: las 3 opciones del filtro de la lista.
enum class FiltroOperacion { TODOS, VENTA, ARRIENDO }

// Como termino el envio de una solicitud.
enum class ResultadoEnvio { ENVIADA, SIN_CONEXION, ERROR }

data class Envio(val resultado: ResultadoEnvio, val mensaje: String)

// Convierte un numero en precio con puntos: 250000000 -> "$250.000.000"
// Se recorre el texto del numero y cada 3 cifras (contando desde el final) se pone un punto.
fun formatoPrecio(valor: Long): String {
    val texto = valor.toString()
    var resultado = ""
    for (i in texto.indices) {
        val faltan = texto.length - i
        resultado += texto[i]
        if (faltan > 1 && (faltan - 1) % 3 == 0) resultado += "."
    }
    return "$$resultado"
}

// "2026-11-04T00:00:00.000Z" -> "04/11/2026"
fun formatoFecha(fecha: String): String {
    if (fecha.length < 10) return fecha
    return fecha.substring(8, 10) + "/" + fecha.substring(5, 7) + "/" + fecha.substring(0, 4)
}
