package com.datalake.fieldauth.domain.model

data class AttendanceRecord(
    val id: Int = 0,
    val employeeId: String,
    val employeeName: String,
    val timestamp: Long,
    val latitude: Double,
    val longitude: Double,
    val confidence: Float,
    val isSynced: Boolean,
    val syncTimestamp: Long? = null
)
