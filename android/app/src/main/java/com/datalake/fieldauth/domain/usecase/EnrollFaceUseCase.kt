package com.datalake.fieldauth.domain.usecase

import android.graphics.Bitmap
import com.datalake.fieldauth.data.local.db.DbConverters
import com.datalake.fieldauth.data.local.db.EnrolledFaceDao
import com.datalake.fieldauth.data.local.db.EnrolledFaceEntity
import com.datalake.fieldauth.domain.model.EnrolledFace
import com.datalake.fieldauth.ml.FaceDetector
import com.datalake.fieldauth.ml.FaceEmbedder
import com.datalake.fieldauth.presentation.components.PointF
import java.util.Date

class EnrollFaceUseCase(
    private val faceDetector: FaceDetector,
    private val faceEmbedder: FaceEmbedder,
    private val enrolledFaceDao: EnrolledFaceDao,
    private val dbConverters: DbConverters
) {
    sealed interface EnrollmentResult {
        data class Success(val enrolledFace: EnrolledFace) : EnrollmentResult
        data class Failure(val message: String) : EnrollmentResult
    }

    /**
     * Executes enroll signature workflow.
     * Generates standard float vector signature files and persists records.
     */
    suspend fun execute(
        name: String,
        employeeId: String,
        role: String,
        faceFrame: Bitmap
    ): EnrollmentResult {
        if (name.isBlank() || employeeId.isBlank()) {
            return EnrollmentResult.Failure("Fields cannot be empty")
        }

        // 1. Detect faces
        val detections = faceDetector.detectFaces(faceFrame)
        if (detections.isEmpty()) {
            return EnrollmentResult.Failure("No face found in enrollment preview")
        }

        val targetFace = detections.maxByOrNull { it.confidence }!!

        // 2. Crop Face area
        val faceCrop = cropFace(faceFrame, targetFace.boundingBox.left, targetFace.boundingBox.top, targetFace.boundingBox.width(), targetFace.boundingBox.height())
            ?: return EnrollmentResult.Failure("Cropping target boundary failure")

        // 3. Extract 128 Dimension signature embedding arrays
        val embedding = faceEmbedder.generateEmbedding(faceCrop)

        val newFace = EnrolledFace(
            name = name,
            employeeId = employeeId,
            role = role,
            embedding = embedding,
            timestamp = Date().time
        )

        // 4. Save entity securely to encrypted SQLite
        enrolledFaceDao.insertEnrolledFace(EnrolledFaceEntity.fromDomain(newFace, dbConverters))

        return EnrollmentResult.Success(newFace)
    }

    private fun cropFace(source: Bitmap, left: Float, top: Float, width: Float, height: Float): Bitmap? {
        return try {
            val x = left.toInt().coerceIn(0, source.width - 1)
            val y = top.toInt().coerceIn(0, source.height - 1)
            val w = width.toInt().coerceAtMost(source.width - x)
            val h = height.toInt().coerceAtMost(source.height - y)
            Bitmap.createBitmap(source, x, y, w, h)
        } catch (e: Exception) {
            null
        }
    }
}
