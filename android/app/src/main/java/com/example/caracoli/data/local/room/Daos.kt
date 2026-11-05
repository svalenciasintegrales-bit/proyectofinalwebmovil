// DAO (Data Access Object): las CONSULTAS a cada tabla de Room.
// Room escribe el codigo SQL por nosotros a partir de @Query, @Insert, @Update y @Delete.
// Todas son suspend: se ejecutan dentro de una corrutina y no congelan la pantalla.
// Se usan clases abstractas (como en clase no vimos interface) y @Transaction para hacer varios pasos juntos.
package com.example.caracoli.data.local.room

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update

@Dao
abstract class InmuebleDao {
    @Query("SELECT * FROM inmuebles ORDER BY codigo")
    abstract suspend fun todos(): List<InmuebleEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    abstract suspend fun guardar(lista: List<InmuebleEntity>)

    @Query("DELETE FROM inmuebles")
    abstract suspend fun borrarTodos()

    // al descargar de la API el catalogo local se REEMPLAZA completo (asi desaparecen los que ya no estan)
    @Transaction
    open suspend fun reemplazar(lista: List<InmuebleEntity>) {
        borrarTodos()
        guardar(lista)
    }
}

@Dao
abstract class SolicitudDao {
    @Query("SELECT * FROM solicitudes ORDER BY fecha DESC")
    abstract suspend fun todas(): List<SolicitudEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    abstract suspend fun guardar(lista: List<SolicitudEntity>)

    @Query("DELETE FROM solicitudes")
    abstract suspend fun borrarTodas()

    // la copia local se reemplaza con lo que diga el servidor (estado y respuesta actualizados)
    @Transaction
    open suspend fun reemplazar(lista: List<SolicitudEntity>) {
        borrarTodas()
        guardar(lista)
    }
}

@Dao
abstract class BorradorDao {
    @Query("SELECT * FROM borradores ORDER BY creada DESC")
    abstract suspend fun todos(): List<BorradorEntity>

    @Query("SELECT * FROM borradores WHERE estadoEnvio = 'pendiente' ORDER BY creada")
    abstract suspend fun pendientes(): List<BorradorEntity>

    @Query("SELECT * FROM borradores WHERE localId = :localId")
    abstract suspend fun buscar(localId: Long): BorradorEntity?

    // devuelve el localId que le puso Room
    @Insert
    abstract suspend fun insertar(borrador: BorradorEntity): Long

    @Update
    abstract suspend fun actualizar(borrador: BorradorEntity)

    @Delete
    abstract suspend fun eliminar(borrador: BorradorEntity)
}
