package com.datalake.fieldauth.ml

import com.datalake.fieldauth.domain.model.EnrolledFace
import com.datalake.fieldauth.domain.model.VerificationResult

class FaceMatcher {

    /**
     * Matches a newly generated face embedding against a local list of enrolled employee vectors.
     * Searches for matching patterns above confidence.
     */
    fun matchFace(
        probeEmbedding: FloatArray,
        enrolledFaces: List<EnrolledFace>,
        matchingThreshold: Float = 0.80f // Configurable via Settings
    ): VerificationResult {
        if (enrolledFaces.isEmpty()) {
            return VerificationResult(
                isMatched = false,
                employeeName = "Unknown",
                employeeId = "None",
                role = "None",
                confidenceScore = 0.0f
            )
        }

        var maxSimilarity = -1.0f
        var bestMatch: EnrolledFace? = null

        for (enrolled in enrolledFaces) {
            val similarity = calculateCosineSimilarity(probeEmbedding, enrolled.embedding)
            if (similarity > maxSimilarity) {
                maxSimilarity = similarity
                bestMatch = enrolled
            }
        }

        // Scale similarity score from [-1..1] or [0..1] to [0..100] percentage
        val scorePercentage = ((maxSimilarity + 1.0f) / 2.0f) * 100.0f
        val isMatch = maxSimilarity >= matchingThreshold

        return if (isMatch && bestMatch != null) {
            VerificationResult(
                isMatched = true,
                employeeName = bestMatch.name,
                employeeId = bestMatch.employeeId,
                role = bestMatch.role,
                confidenceScore = scorePercentage
            )
        } else {
            VerificationResult(
                isMatched = false,
                employeeName = "Unknown (${scorePercentage.toInt()}% similarity)",
                employeeId = "None",
                role = "None",
                confidenceScore = scorePercentage
            )
        }
    }

    /**
     * Cosine Similarity calculation formula:
     * CosineSimilarity = (A · B) / (||A|| * ||B||)
     * Because the embeddings generated in FaceEmbedder are L2 normalized,
     * their norms are 1.0, meaning similarity is simply the Dot Product!
     */
    private fun calculateCosineSimilarity(vectorA: FloatArray, vectorB: FloatArray): Float {
        if (vectorA.size != vectorB.size) return 0.0f
        var dotProduct = 0.0f
        for (i in vectorA.indices) {
            dotProduct += vectorA[i] * vectorB[i]
        }
        return dotProduct
    }
}
