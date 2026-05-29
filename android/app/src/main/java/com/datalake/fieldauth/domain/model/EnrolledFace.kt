package com.datalake.fieldauth.domain.model

data class EnrolledFace(
    val id: Int = 0,
    val name: String,
    val employeeId: String,
    val role: String,
    val embedding: FloatArray,
    val timestamp: Long
) {
    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is EnrolledFace) return false
        if (id != other.id) return false
        if (name != other.name) return false
        if (employeeId != other.employeeId) return false
        if (role != other.role) return false
        if (!embedding.contentEquals(other.embedding)) return false
        if (timestamp != other.timestamp) return false
        return true
    }

    override fun hashCode(): Int {
        var result = id
        result = 31 * result + name.hashCode()
        result = 31 * result + employeeId.hashCode()
        result = 31 * result + role.hashCode()
        result = 31 * result + embedding.contentHashCode()
        result = 31 * result + timestamp.hashCode()
        return result
    }
}
