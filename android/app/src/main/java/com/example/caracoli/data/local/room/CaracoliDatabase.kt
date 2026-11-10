// La base de datos Room de la app: archivo "caracoli.db" dentro del celular con 3 tablas.
// Se crea UNA sola vez (patron singleton) y se comparte en toda la app.
package com.example.caracoli.data.local.room

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

@Database(
    entities = [InmuebleEntity::class, SolicitudEntity::class, BorradorEntity::class],
    version = 2, // version 2: la tabla inmuebles tiene las fotos del carrusel y el video
    exportSchema = false
)
abstract class CaracoliDatabase : RoomDatabase() {

    abstract fun inmuebleDao(): InmuebleDao
    abstract fun solicitudDao(): SolicitudDao
    abstract fun borradorDao(): BorradorDao

    companion object {
        // MIGRACION: los celulares que ya tenian la version 1 agregan las 2 columnas nuevas
        // sin borrar lo guardado (catalogo, solicitudes y borradores sin enviar)
        val MIGRACION_1_2 = object : Migration(1, 2) {
            override fun migrate(db: SupportSQLiteDatabase) {
                db.execSQL("ALTER TABLE inmuebles ADD COLUMN imagenes TEXT NOT NULL DEFAULT ''")
                db.execSQL("ALTER TABLE inmuebles ADD COLUMN video TEXT NOT NULL DEFAULT ''")
            }
        }

        private var instancia: CaracoliDatabase? = null

        // si ya existe se devuelve; si no, se crea (se llama una sola vez desde MainActivity)
        fun obtener(context: Context): CaracoliDatabase {
            val actual = instancia
            if (actual != null) return actual
            val nueva = Room.databaseBuilder(context.applicationContext, CaracoliDatabase::class.java, "caracoli.db")
                .addMigrations(MIGRACION_1_2)
                .build()
            instancia = nueva
            return nueva
        }
    }
}
