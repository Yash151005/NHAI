package com.datalake.fieldauth.data.local.db

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface AttendanceDao {
    @Query("SELECT * FROM attendance_records ORDER BY timestamp DESC")
    fun getAllAttendanceRecords(): Flow<List<AttendanceRecordEntity>>

    @Query("SELECT * FROM attendance_records WHERE isSynced = 0 ORDER BY timestamp ASC")
    suspend fun getUnsyncedRecords(): List<AttendanceRecordEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAttendanceRecord(record: AttendanceRecordEntity)

    @Query("UPDATE attendance_records SET isSynced = 1, syncTimestamp = :syncTime WHERE id = :id")
    suspend fun markAsSynced(id: Int, syncTime: Long)

    @Query("DELETE FROM attendance_records WHERE isSynced = 1 AND timestamp < :olderThanLimit")
    suspend fun purgeSyncedRecords(olderThanLimit: Long)

    @Query("DELETE FROM attendance_records")
    suspend fun deleteAllRecords()
}
