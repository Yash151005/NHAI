package com.datalake.fieldauth.ml

import android.graphics.PointF

class LivenessAnalyzer {

    // Threshold boundaries for authentic biometric actions
    private val BLINK_EAR_THRESHOLD = 0.22f  // EAR < 0.22 indicates eye closure duration
    private val SMILE_MAR_THRESHOLD = 0.55f  // MAR > 0.55 indicates dental/smile contraction
    private val YAW_LEFT_ANGLE_THRESHOLD = 25f // Leftward head turn degree

    var currentChallengeState = LivenessChallengeType.IDLE
        private set

    private var activeStateCallback: ((LivenessChallengeType) -> Unit)? = null

    fun setOnChallengeStateChanged(callback: (LivenessChallengeType) -> Unit) {
        this.activeStateCallback = callback
    }

    fun startWorkflow() {
        updateState(LivenessChallengeType.DETECTING_FACE)
    }

    fun reset() {
        updateState(LivenessChallengeType.IDLE)
    }

    private fun updateState(newState: LivenessChallengeType) {
        currentChallengeState = newState
        activeStateCallback?.invoke(newState)
    }

    /**
     * Evaluates face landmarks to measure liveness.
     * @param landmarks468 The landmarks returned from a FaceMesh.
     */
    fun analyzeLandmarks(landmarks468: List<Point3D>) {
        if (landmarks468.isEmpty()) return

        when (currentChallengeState) {
            LivenessChallengeType.DETECTING_FACE -> {
                // Confirm a face is centered and steady
                if (isFaceCentered(landmarks468)) {
                    updateState(LivenessChallengeType.BLINK)
                }
            }
            LivenessChallengeType.BLINK -> {
                val leftEAR = calculateEAR(
                    p1 = landmarks468[33],   // Eye corner markers mapping standard FaceMesh
                    p2 = landmarks468[160],
                    p3 = landmarks468[158],
                    p4 = landmarks468[133],
                    p5 = landmarks468[153],
                    p6 = landmarks468[144]
                )
                val rightEAR = calculateEAR(
                    p1 = landmarks468[263],
                    p2 = landmarks468[387],
                    p3 = landmarks468[385],
                    p4 = landmarks468[362],
                    p5 = landmarks468[373],
                    p6 = landmarks468[380]
                )
                val avgEAR = (leftEAR + rightEAR) / 2.0f
                if (avgEAR < BLINK_EAR_THRESHOLD) {
                    updateState(LivenessChallengeType.SMILE)
                }
            }
            LivenessChallengeType.SMILE -> {
                val mar = calculateMAR(
                    p1 = landmarks468[78],  // Mouth corners
                    p2 = landmarks468[81],  // Top lip inner
                    p3 = landmarks468[311],
                    p4 = landmarks468[308], // Outside corner
                    p5 = landmarks468[402], // Bottom lip inner
                    p6 = landmarks468[178]
                )
                if (mar > SMILE_MAR_THRESHOLD) {
                    updateState(LivenessChallengeType.TURN_LEFT)
                }
            }
            LivenessChallengeType.TURN_LEFT -> {
                val yawAngle = calculateHeadYaw(landmarks468)
                if (yawAngle > YAW_LEFT_ANGLE_THRESHOLD) { // Positive angle denotes left direction turn
                    updateState(LivenessChallengeType.MATCHING)
                }
            }
            else -> {}
        }
    }

    /**
     * Eye Aspect Ratio Formula:
     * EAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
     */
    private fun calculateEAR(
        p1: Point3D, p2: Point3D, p3: Point3D,
        p4: Point3D, p5: Point3D, p6: Point3D
    ): Float {
        val dist1 = distance3D(p2, p6)
        val dist2 = distance3D(p3, p5)
        val dist3 = distance3D(p1, p4)

        if (dist3 == 0f) return 0.0f
        return (dist1 + dist2) / (2.0f * dist3)
    }

    /**
     * Mouth Aspect Ratio Formula:
     * MAR = (||p2-p6|| + ||p3-p5||) / (2 * ||p1-p4||)
     */
    private fun calculateMAR(
        p1: Point3D, p2: Point3D, p3: Point3D,
        p4: Point3D, p5: Point3D, p6: Point3D
    ): Float {
        val dist1 = distance3D(p2, p6)
        val dist2 = distance3D(p3, p5)
        val dist3 = distance3D(p1, p4)

        if (dist3 == 0f) return 0.0f
        return (dist1 + dist2) / (2.0f * dist3)
    }

    /**
     * Estimates head turn yaw angle in degrees.
     * Approximates by measuring asymmetry of nose tip to outer eye corners.
     */
    private fun calculateHeadYaw(landmarks: List<Point3D>): Float {
        // Point index: 1 = Nose tip, 33 = left eye outer, 263 = right eye outer
        val nose = landmarks[1]
        val leftEyeExt = landmarks[33]
        val rightEyeExt = landmarks[263]

        val leftDist = distance3D(nose, leftEyeExt)
        val rightDist = distance3D(nose, rightEyeExt)

        if (leftDist + rightDist == 0f) return 0f

        // Asymmetry ratio mapping rotation
        val ratio = leftDist / rightDist
        // Logarithmic conversion into degrees for stable tilt measurement
        val angle = Math.log(ratio.toDouble()) * 40.0
        return angle.toFloat()
    }

    private fun isFaceCentered(landmarks: List<Point3D>): Boolean {
        // Nose bridge should reside in middle quadrants of target oval
        val nose = landmarks[1]
        // Checks normalized coordinate frame offsets
        return nose.x in 0.35f..0.65f && nose.y in 0.30f..0.70f
    }

    private fun distance3D(p1: Point3D, p2: Point3D): Float {
        return Math.sqrt(
            Math.pow((p1.x - p2.x).toDouble(), 2.0) +
            Math.pow((p1.y - p2.y).toDouble(), 2.0) +
            Math.pow((p1.z - p2.z).toDouble(), 2.0)
        ).toFloat()
    }
}

data class Point3D(val x: Float, val y: Float, val z: Float)
