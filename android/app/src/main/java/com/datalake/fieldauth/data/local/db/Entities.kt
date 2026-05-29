package com.datalake.fieldauth.data.local.db

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverter
import com.datalake.fieldauth.domain.model.AttendanceRecord
import com.datalake.fieldauth.domain.model.EnrolledFace
import java.nio.ByteBuffer
import java.nio.FloatBuffer

@Entity(tableName = "enrolled_faces")
data class EnrolledFaceEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val name: String,
    val employeeId: String,
    val role: String,
    val embeddingBlob: ByteArray, // Encoded FloatArray
    val timestamp: Long
) {
    fun toDomain(converters: DbConverters): EnrolledFace {
        return EnrolledFace(
            id = id,
            name = name,
            employeeId = employeeId,
            role = role,
            embedding = converters.fromByteArray(embeddingBlob),
            timestamp = timestamp
        )
    }

    companion object {
        fun fromDomain(face: EnrolledFace, converters: DbConverters): EnrolledFaceEntity {
            return EnrolledFaceEntity(
                id = face.id,
                name = face.name,
                employeeId = face.employeeId,
                role = face.role,
                embeddingBlob = converters.toByteArray(face.embedding),
                timestamp = face.timestamp
            )
        }
    }
}

@Entity(tableName = "attendance_records")
data class AttendanceRecordEntity(
    @PrimaryKey(autoGenerate = true) val id: Int = 0,
    val employeeId: String,
    val employeeName: String,
    val timestamp: Long,
    val latitude: Double,
    val longitude: Double,
    val confidence: Float,
    val isSynced: Boolean,
    val syncTimestamp: Long?
) {
    fun toDomain(): AttendanceRecord {
        return AttendanceRecord(
            id = id,
            employeeId = employeeId,
            employeeName = employeeName,
            timestamp = timestamp,
            latitude = latitude,
            longitude = longitude,
            confidence = confidence,
            isSynced = isSynced,
            syncTimestamp = syncTimestamp
        )
    }

    companion object {
        fun fromDomain(record: AttendanceRecord): AttendanceRecordEntity {
            return AttendanceRecordEntity(
                id = record.id,
                employeeId = record.employeeId,
                employeeName = record.employeeName,
                timestamp = record.timestamp,
                latitude = record.latitude,
                longitude = record.longitude,
                confidence = record.confidence,
                isSynced = record.isSynced,
                syncTimestamp = record.syncTimestamp
            )
        }
    }
}

class DbConverters {
    @TypeConverter
    fun toByteArray(floatArray: FloatArray): ByteArray {
        val byteBuffer = ByteBuffer.allocate(floatArray.size * 4)
        val floatBuffer = byteBuffer.asFloatBuffer()
        floatBuffer.put(floatArray)
        return byteBuffer.array()
    }

    @TypeConverter
    fun fromByteArray(byteArray: ByteArray): FloatArray {
        val byteBuffer = ByteBuffer.wrap(byteArray)
        val floatBuffer = byteBuffer.asFloatBuffer()
        val floatArray = FloatArray(byteArray.size / 4)
        floatBuffer.get(floatArray)
        return floatArray
    }
}
