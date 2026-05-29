package com.datalake.fieldauth.data.local.db

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface EnrolledFaceDao {
    @Query("SELECT * FROM enrolled_faces")
    fun getAllEnrolledFaces(): Flow<List<EnrolledFaceEntity>>

    @Query("SELECT * FROM enrolled_faces WHERE employeeId = :empId LIMIT 1")
    suspend fun getFaceByEmployeeId(empId: String): EnrolledFaceEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertEnrolledFace(face: EnrolledFaceEntity)

    @Delete
    suspend fun deleteEnrolledFace(face: EnrolledFaceEntity)

    @Query("DELETE FROM enrolled_faces")
    suspend fun deleteAllFaces()
}
