// CARPETA data/local/room: BASE DE DATOS LOCAL con Room (SQLite dentro del celular).
// Cada @Entity es una TABLA. Lo que se guarda aqui sigue ahi al cerrar y abrir la app.
// MongoDB (por la API) es la fuente de verdad: Room solo guarda una COPIA para ver sin internet
// y los BORRADORES de solicitudes que todavia no han llegado al servidor.
package com.example.caracoli.data.local.room

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.example.caracoli.model.Inmueble
import com.example.caracoli.model.Solicitud

// Tabla "inmuebles": copia del ultimo catalogo que se descargo de la API.
@Entity(tableName = "inmuebles")
data class InmuebleEntity(
    @PrimaryKey val id: String, // el _id de MongoDB
    val codigo: String,
    val titulo: String,
    val tipo: String,
    val operacion: String,
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

// Tabla "solicitudes": copia de las solicitudes del cliente que ya estan en MongoDB
// (con el estado y la respuesta que puso el administrador en el panel).
@Entity(tableName = "solicitudes")
data class SolicitudEntity(
    @PrimaryKey val id: String, // el _id de MongoDB
    val inmuebleId: String,
    val tipo: String,
    val fechaCita: String,
    val hora: String,
    val mensaje: String,
    val respuesta: String,
    val estado: String,
    val fecha: String
)

// Tabla "borradores": solicitudes hechas en el celular que AUN NO estan confirmadas por el servidor.
// estadoEnvio: "pendiente" (se envia cuando haya conexion) o "error" (el servidor la rechazo, ver campo error).
// Cuando el servidor la guarda, el borrador se borra de aqui y la solicitud pasa a la tabla "solicitudes".
@Entity(tableName = "borradores")
data class BorradorEntity(
    @PrimaryKey(autoGenerate = true) val localId: Long = 0, // id que pone Room (1, 2, 3...)
    val inmuebleId: String,
    val tipo: String,
    val nombre: String,
    val telefono: String,
    val mensaje: String,
    val fechaCita: String,
    val hora: String,
    val estadoEnvio: String,
    val error: String,
    val creada: Long // fecha en milisegundos
)

// ---------- CONVERTIR entre las tablas y los modelos que usan las pantallas ----------

fun inmuebleDesdeTabla(e: InmuebleEntity): Inmueble = Inmueble(
    e.id, e.codigo, e.titulo, e.tipo, e.operacion, e.precio, e.barrio, e.ciudad, e.area, e.habitaciones, e.banos, e.descripcion, e.imagen, e.estado
)

fun inmuebleParaTabla(i: Inmueble): InmuebleEntity = InmuebleEntity(
    i.id, i.codigo, i.titulo, i.tipo, i.operacion, i.precio, i.barrio, i.ciudad, i.area, i.habitaciones, i.banos, i.descripcion, i.imagen, i.estado
)

fun solicitudDesdeTabla(e: SolicitudEntity): Solicitud = Solicitud(
    id = e.id, inmuebleId = e.inmuebleId, tipo = e.tipo, fechaCita = e.fechaCita, hora = e.hora,
    mensaje = e.mensaje, respuesta = e.respuesta, estado = e.estado, fecha = e.fecha, porEnviar = false
)

fun solicitudParaTabla(s: Solicitud): SolicitudEntity = SolicitudEntity(s.id, s.inmuebleId, s.tipo, s.fechaCita, s.hora, s.mensaje, s.respuesta, s.estado, s.fecha)

// el borrador se muestra en "Mis solicitudes" con el estado "por enviar" o "error al enviar"
fun borradorDesdeTabla(b: BorradorEntity): Solicitud = Solicitud(
    id = "local-${b.localId}", inmuebleId = b.inmuebleId, tipo = b.tipo, fechaCita = b.fechaCita, hora = b.hora,
    mensaje = b.mensaje, respuesta = "",
    estado = if (b.estadoEnvio == "error") "error al enviar" else "por enviar",
    fecha = "", porEnviar = true, localId = b.localId, errorEnvio = b.error
)
