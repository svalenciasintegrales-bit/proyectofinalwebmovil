// La base de datos Room de la app: archivo "caracoli.db" dentro del celular con 3 tablas.
// Se crea UNA sola vez (patron singleton) y se comparte en toda la app.
package com.example.caracoli.data.local.room

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase

@Database(
    entities = [InmuebleEntity::class, SolicitudEntity::class, BorradorEntity::class],
    version = 1,
    exportSchema = false
)
abstract class CaracoliDatabase : RoomDatabase() {

    abstract fun inmuebleDao(): InmuebleDao
    abstract fun solicitudDao(): SolicitudDao
    abstract fun borradorDao(): BorradorDao

    companion object {
        private var instancia: CaracoliDatabase? = null

        // si ya existe se devuelve; si no, se crea (se llama una sola vez desde MainActivity)
        fun obtener(context: Context): CaracoliDatabase {
            val actual = instancia
            if (actual != null) return actual
            val nueva = Room.databaseBuilder(context.applicationContext, CaracoliDatabase::class.java, "caracoli.db").build()
            instancia = nueva
            return nueva
        }
    }
}
