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
        @Volatile
        private var instancia: CaracoliDatabase? = null

        fun obtener(context: Context): CaracoliDatabase {
            // si ya existe se devuelve; si no, se crea (synchronized: evita crear dos a la vez)
            return instancia ?: synchronized(this) {
                val nueva = Room.databaseBuilder(context.applicationContext, CaracoliDatabase::class.java, "caracoli.db").build()
                instancia = nueva
                nueva
            }
        }
    }
}
