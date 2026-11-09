// CARPETA data/local: PREFERENCIAS del celular con DataStore (datos sueltos de llave = valor).
// Lo que se guarda aqui NO se borra al cerrar la app:
// - bienvenida vista (onboarding), modo oscuro y direccion del servidor
// - datos del cliente (nombre, celular y su id en MongoDB) para no escribirlos otra vez
// - favoritos
// Los DATOS (catalogo, solicitudes y borradores) van en Room: ver data/local/room.
package com.example.caracoli.data.local

import android.content.Context
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.core.stringSetPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.example.caracoli.config.CaracoliConfig
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

// Crea el archivo de preferencias "caracoli_preferences" (uno solo para toda la app).
private val Context.dataStore by preferencesDataStore("caracoli_preferences")

class PreferencesManager(private val context: Context) {
                              
    // LLAVES (como las columnas de una tabla)
    companion object {
        private val ONBOARDING = booleanPreferencesKey("onboarding")
        private val OSCURO = booleanPreferencesKey("oscuro")
        private val SERVIDOR = stringPreferencesKey("servidor")
        private val NOMBRE = stringPreferencesKey("nombre")
        private val TELEFONO = stringPreferencesKey("telefono")
        private val CLIENTE_ID = stringPreferencesKey("cliente_id")
        private val FAVORITOS = stringSetPreferencesKey("favoritos") // conjunto de ids de inmuebles
    }

    // ---------- LEER (cada dato es un Flow que avisa cuando cambia) ----------
    val onboardingCompletado: Flow<Boolean> = context.dataStore.data.map { it[ONBOARDING] ?: false }
    val oscuro: Flow<Boolean> = context.dataStore.data.map { it[OSCURO] ?: false }
    val servidor: Flow<String> = context.dataStore.data.map { it[SERVIDOR] ?: CaracoliConfig.SERVIDOR_POR_DEFECTO }
    val nombre: Flow<String> = context.dataStore.data.map { it[NOMBRE] ?: "" }
    val telefono: Flow<String> = context.dataStore.data.map { it[TELEFONO] ?: "" }
    val clienteId: Flow<String> = context.dataStore.data.map { it[CLIENTE_ID] ?: "" }
    val favoritos: Flow<Set<String>> = context.dataStore.data.map { it[FAVORITOS] ?: emptySet() }

    // ---------- GUARDAR (suspend: se llaman dentro de una corrutina) ----------
    suspend fun finalizarOnboarding() { context.dataStore.edit { it[ONBOARDING] = true } }
    suspend fun guardarOscuro(valor: Boolean) { context.dataStore.edit { it[OSCURO] = valor } }

    // al cambiar de servidor se olvida el id del cliente (en el otro servidor no existe);
    // sin ese id, el SolicitudRepository borra la copia de solicitudes del servidor anterior
    suspend fun guardarServidor(valor: String) {
        context.dataStore.edit {
            it[SERVIDOR] = valor.trim().trimEnd('/')
            it[CLIENTE_ID] = ""
        }
    }

    suspend fun guardarDatos(nombre: String, telefono: String) {
        context.dataStore.edit {
            it[NOMBRE] = nombre.trim()
            it[TELEFONO] = telefono.trim()
        }
    }

    suspend fun guardarClienteId(id: String) { context.dataStore.edit { it[CLIENTE_ID] = id } }

    suspend fun cambiarFavorito(id: String, agregar: Boolean) {
        context.dataStore.edit {
            val actuales = (it[FAVORITOS] ?: emptySet()).toMutableSet()
            if (agregar) actuales.add(id) else actuales.remove(id)
            it[FAVORITOS] = actuales
        }
    }

}
