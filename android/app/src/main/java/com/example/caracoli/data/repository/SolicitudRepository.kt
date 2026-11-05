// Repository de las SOLICITUDES del cliente (pedir informacion o agendar visita).
// Asi se une la app con el administrador: la solicitud llega por la API a MongoDB,
// el administrador la responde en el panel y la app muestra la respuesta.
//
// Room guarda dos cosas:
// - tabla "borradores": lo que el cliente envio y el servidor TODAVIA NO confirma
//   (pendiente = sin conexion, se reintenta | error = el servidor la rechazo, el cliente decide)
// - tabla "solicitudes": copia de las que ya estan en MongoDB, para verlas sin internet
// Una solicitud solo se muestra como enviada cuando el servidor responde que la guardo.
package com.example.caracoli.data.repository

import com.example.caracoli.data.local.PreferencesManager
import com.example.caracoli.data.local.room.BorradorDao
import com.example.caracoli.data.local.room.BorradorEntity
import com.example.caracoli.data.local.room.SolicitudDao
import com.example.caracoli.data.local.room.SolicitudEntity
import com.example.caracoli.data.local.room.aEntidad
import com.example.caracoli.data.local.room.aModelo
import com.example.caracoli.data.remote.ApiClient
import com.example.caracoli.model.Envio
import com.example.caracoli.model.ResultadoEnvio
import com.example.caracoli.model.Solicitud
import java.io.IOException
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.json.JSONArray
import org.json.JSONObject

class SolicitudRepository(
    private val manager: PreferencesManager,
    private val borradorDao: BorradorDao,
    private val solicitudDao: SolicitudDao
) {

    // Mutex: si se piden dos envios al tiempo (al abrir la app y al abrir "Mis solicitudes"),
    // el segundo espera al primero. Asi un mismo borrador no se envia dos veces.
    private val candado = Mutex()

    // ---------- ENVIAR UNA SOLICITUD ----------
    suspend fun enviar(inmuebleId: String, tipo: String, nombre: String, telefono: String, mensaje: String, fecha: String, hora: String): Envio {
        // los datos del cliente quedan en el celular para no escribirlos otra vez
        manager.guardarDatos(nombre, telefono)

        // 1. primero se guarda el BORRADOR en Room (si la app se cierra, no se pierde)
        val borrador = BorradorEntity(
            inmuebleId = inmuebleId, tipo = tipo, nombre = nombre.trim(), telefono = telefono.trim(),
            mensaje = mensaje.trim(), fechaCita = if (tipo == "visita") fecha.trim() else "", hora = if (tipo == "visita") hora else "",
            estadoEnvio = "pendiente", error = "", creada = System.currentTimeMillis()
        )
        val guardado = borrador.copy(localId = borradorDao.insertar(borrador))

        // 2. se intenta enviar
        return candado.withLock {
            try {
                val error = enviarAhora(guardado)
                if (error == null) {
                    borradorDao.eliminar(guardado) // el servidor la guardo: ya no es borrador
                    Envio(ResultadoEnvio.ENVIADA, "")
                } else {
                    // el servidor la rechazo: el formulario conserva lo escrito para corregirlo
                    borradorDao.eliminar(guardado)
                    Envio(ResultadoEnvio.ERROR, error)
                }
            } catch (e: IOException) {
                // sin conexion: el borrador queda "pendiente" en Room y se envia despues
                Envio(ResultadoEnvio.SIN_CONEXION, "")
            } catch (e: Exception) {
                // ej: la direccion del servidor esta mal escrita y responde otra cosa
                Envio(ResultadoEnvio.SIN_CONEXION, "")
            }
        }
    }

    // Envia un borrador a la API. Devuelve null si el servidor lo guardo, o el mensaje de error de la API.
    // Si no hay internet lanza IOException.
    private suspend fun enviarAhora(borrador: BorradorEntity): String? {
        val servidor = manager.servidor.first()

        // 1. el cliente se registra una sola vez; su id de MongoDB queda guardado en DataStore
        var clienteId = manager.clienteId.first()
        if (clienteId.isBlank()) {
            val cliente = JSONObject()
            cliente.put("nombre", borrador.nombre)
            cliente.put("telefono", borrador.telefono)
            val r = ApiClient.post("$servidor/save-cliente", cliente)
            if (r.optString("status") != "success") return r.optString("message", "No se pudo registrar el cliente")
            clienteId = r.getJSONObject("cliente").getString("_id")
            manager.guardarClienteId(clienteId)
        }

        // 2. se guarda la solicitud (coleccion Citas)
        val datos = JSONObject()
        datos.put("inmueble_id", borrador.inmuebleId)
        datos.put("cliente_id", clienteId)
        datos.put("tipo", borrador.tipo)
        datos.put("observaciones", borrador.mensaje)
        if (borrador.tipo == "visita") {
            datos.put("fecha_cita", borrador.fechaCita)
            datos.put("hora", borrador.hora)
        }
        val r = ApiClient.post("$servidor/save-cita", datos)
        if (r.optString("status") == "success") return null
        // 409 con la cita: el servidor YA la tenia (ej: se envio pero se corto la respuesta) -> no se duplica
        if (r.has("cita")) return null
        return r.optString("message", "No se pudo enviar la solicitud")
    }

    // ---------- ENVIAR LOS BORRADORES PENDIENTES ----------
    // Devuelve cuantos se enviaron. Si sigue sin internet, quedan pendientes en Room.
    suspend fun sincronizarPendientes(): Int = candado.withLock {
        var enviadas = 0
        for (borrador in borradorDao.pendientes()) {
            try {
                val error = enviarAhora(borrador)
                if (error == null) {
                    borradorDao.eliminar(borrador)
                    enviadas++
                } else {
                    // el servidor la rechazo (ej: el inmueble ya se vendio): se conserva con el motivo
                    borradorDao.actualizar(borrador.copy(estadoEnvio = "error", error = error))
                }
            } catch (e: Exception) {
                break // sin conexion: los demas tambien fallarian, se intenta en la proxima
            }
        }
        enviadas
    }

    // El cliente pide reintentar un borrador con error: vuelve a "pendiente" y se intenta enviar
    suspend fun reintentar(localId: Long) {
        val borrador = borradorDao.buscar(localId) ?: return
        borradorDao.actualizar(borrador.copy(estadoEnvio = "pendiente", error = ""))
        sincronizarPendientes()
    }

    suspend fun eliminarBorrador(localId: Long) {
        val borrador = borradorDao.buscar(localId) ?: return
        borradorDao.eliminar(borrador)
    }

    // ---------- MIS SOLICITUDES ----------
    // Arriba los borradores de Room (por enviar o con error). Debajo las del servidor:
    // con internet se piden a la API y REEMPLAZAN la copia de Room; sin internet se muestra la copia.
    // Devuelve la lista y si se pudo conectar.
    suspend fun misSolicitudes(): Pair<List<Solicitud>, Boolean> {
        val lista = mutableListOf<Solicitud>()
        borradorDao.todos().forEach { lista.add(it.aModelo()) }

        val clienteId = manager.clienteId.first()
        var conectado = true
        if (clienteId.isBlank()) {
            // todavia no se ha registrado (o cambio de servidor): no hay solicitudes del servidor
            solicitudDao.borrarTodas()
        } else {
            try {
                val servidor = manager.servidor.first()
                val r = ApiClient.get("$servidor/citas-cliente/$clienteId")
                val datos = if (r.optString("status") == "success") r.getJSONArray("citas") else JSONArray()
                val filas = mutableListOf<SolicitudEntity>()
                for (i in 0 until datos.length()) {
                    filas.add(ApiClient.solicitudDesdeJson(datos.getJSONObject(i), porEnviar = false).aEntidad())
                }
                solicitudDao.reemplazar(filas)
            } catch (e: Exception) {
                conectado = false
            }
            solicitudDao.todas().forEach { lista.add(it.aModelo()) }
        }
        return Pair(lista, conectado)
    }
}
