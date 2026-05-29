package com.datalake.fieldauth.domain.usecase

import android.graphics.Bitmap
import com.datalake.fieldauth.data.local.db.AttendanceDao
import com.datalake.fieldauth.data.local.db.AttendanceRecordEntity
import com.datalake.fieldauth.data.local.db.DbConverters
import com.datalake.fieldauth.data.local.db.EnrolledFaceDao
import com.datalake.fieldauth.domain.model.AttendanceRecord
import com.datalake.fieldauth.domain.model.VerificationResult
import com.datalake.fieldauth.ml.FaceDetector
import com.datalake.fieldauth.ml.FaceEmbedder
import com.datalake.fieldauth.ml.FaceMatcher
import kotlinx.coroutines.flow.first
import java.util.Date

class VerifyFaceUseCase(
    private val faceDetector: FaceDetector,
    private val faceEmbedder: FaceEmbedder,
    private val faceMatcher: FaceMatcher,
    private val enrolledFaceDao: EnrolledFaceDao,
    private val attendanceDao: AttendanceDao,
    private val dbConverters: DbConverters,
    private val threshold: Float // Injected via state preferences
) {

    /**
     * Executes the formal Biometric Verification sequence.
     * Takes a face bitmap from high resolution camera sensors, verifies landmarks,
     * computes embeddings, comparisons against local DB keys, and saves access logging.
     */
    suspend fun execute(
        cameraFrame: Bitmap,
        mockLatitude: Double = 0.0,
        mockLongitude: Double = 0.0
    ): VerificationResult {
        // 1. Run face detection mapping
        val detections = faceDetector.detectFaces(cameraFrame)
        if (detections.isEmpty()) {
            return VerificationResult(
                isMatched = false,
                employeeName = "No face detected",
                employeeId = "None",
                role = "None",
                confidenceScore = 0.0f
            )
        }

        // Target the primary face (largest preview bounding dimensions or highest confidence score)
        val targetFace = detections.maxByOrNull { it.confidence }!!

        // 2. Crop face image exactly using target bounding coordinates
        val faceCrop = cropFace(cameraFrame, targetFace.boundingBox.left, targetFace.boundingBox.top, targetFace.boundingBox.width(), targetFace.boundingBox.height())
            ?: return VerificationResult(
                isMatched = false,
                employeeName = "Frame processing bounds err",
                employeeId = "None",
                role = "None",
                confidenceScore = 0.0f
            )

        // 3. Extract 128-dim embedding via MobileFaceNet TFLite
        val probeEmbedding = faceEmbedder.generateEmbedding(faceCrop)

        // 4. Retrieve all enrolled biometric templates from secure Room DB
        val dbEntities = enrolledFaceDao.getAllEnrolledFaces().first()
        val enrolledFaces = dbEntities.map { it.toDomain(dbConverters) }

        // 5. Run matching matrix (cosine metrics)
        val result = faceMatcher.matchFace(
            probeEmbedding = probeEmbedding,
            enrolledFaces = enrolledFaces,
            matchingThreshold = threshold
        )

        // 6. Record log transactional item to central SQLite database
        val attendanceLog = AttendanceRecord(
            employeeId = if (result.isMatched) result.employeeId else "UNKNOWN",
            employeeName = result.employeeName,
            timestamp = Date().time,
            latitude = mockLatitude,
            longitude = mockLongitude,
            confidence = result.confidenceScore,
            isSynced = false
        )

        attendanceDao.insertAttendanceRecord(AttendanceRecordEntity.fromDomain(attendanceLog))

        return result
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
