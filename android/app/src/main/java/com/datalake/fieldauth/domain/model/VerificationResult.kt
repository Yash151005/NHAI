package com.datalake.fieldauth.domain.model

data class VerificationResult(
    val isMatched: Boolean,
    val employeeName: String,
    val employeeId: String,
    val role: String,
    val confidenceScore: Float
)
