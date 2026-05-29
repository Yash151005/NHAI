package com.datalake.fieldauth.ml

import android.content.Context
import android.graphics.Bitmap
import android.graphics.RectF
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.support.image.ImageProcessor
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp
import java.io.nio.MappedByteBuffer
import java.util.HashMap

data class FaceDetectionResult(
    val boundingBox: RectF,
    val confidence: Float,
    val landmarks: List<PointF> // Standard 6/5 keypoints for alignment
)

data class PointF(val x: Float, val y: Float)

class FaceDetector(private val context: Context) {
    private var interpreter: Interpreter? = null
    private val modelFileName = "blazeface_back_quantized.tflite" // Standard on-device model
    private val inputSize = 128 // BlazeFace standard input

    init {
        initializeInterpreter()
    }

    private fun initializeInterpreter() {
        try {
            val modelBuffer: MappedByteBuffer = FileUtil.loadMappedFile(context, modelFileName)
            val options = Interpreter.Options().apply {
                setNumThreads(4) // Parallel multi-threaded optimization on Snapdragon/Helio devices
                // Support GPU or NNAPI acceleration if needed
            }
            interpreter = Interpreter(modelBuffer, options)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Executes Face Detection on a given raw Bitmap.
     * Extracts coordinates mapping to bounding frames.
     */
    fun detectFaces(bitmap: Bitmap): List<FaceDetectionResult> {
        val tInterpreter = interpreter ?: return emptyList()

        // 1. Image Preprocessing: Scaling to 128x128 Model input
        val imageProcessor = ImageProcessor.Builder()
            .add(ResizeOp(inputSize, inputSize, ResizeOp.Method.BILINEAR))
            .build()

        val tensorImage = TensorImage(org.tensorflow.lite.DataType.UINT8)
        tensorImage.load(bitmap)
        val processedTensorImage = imageProcessor.process(tensorImage)

        // 2. Prepare Output Targets
        // BlazeFace returns high dimension outputs (e.g., bounding boxes + confidence points)
        // Output coordinates shape is [1, 896, 16] or specific configuration depending on anchors
        val outputMap = HashMap<Int, Any>()
        val boxes = Array(1) { Array(896) { FloatArray(16) } } // [1, 896, 16] shape mapping bounding box + keypoints
        outputMap[0] = boxes

        // 3. Execute inference
        tInterpreter.runForMultipleInputsOutputs(arrayOf(processedTensorImage.buffer), outputMap)

        // 4. Postprocess coordinates (extract score thresholds, perform Non-Maximum Suppression (NMS))
        val results = mutableListOf<FaceDetectionResult>()
        val width = bitmap.width.toFloat()
        val height = bitmap.height.toFloat()

        for (i in 0 until 896) {
            val box = boxes[0][i]
            val xCenter = box[0] * width
            val yCenter = box[1] * height
            val w = box[2] * width
            val h = box[3] * height

            val confidence = box[4]
            if (confidence > 0.75f) { // High threshold for enterprise accuracy
                val rect = RectF(
                    xCenter - w / 2,
                    yCenter - h / 2,
                    xCenter + w / 2,
                    yCenter + h / 2
                )

                // Keypoints Extraction (mapping eyes, nose, mouth corners, ears)
                val landmarks = mutableListOf<PointF>()
                for (k in 0 until 6) {
                    val kx = box[5 + k * 2] * width
                    val ky = box[6 + k * 2] * height
                    landmarks.add(PointF(kx, ky))
                }

                results.add(
                    FaceDetectionResult(
                        boundingBox = rect,
                        confidence = confidence,
                        landmarks = landmarks
                    )
                )
            }
        }

        // Apply simple NMS fallback on bounding boxes
        return applyNMS(results)
    }

    private fun applyNMS(detections: List<FaceDetectionResult>): List<FaceDetectionResult> {
        if (detections.isEmpty()) return emptyList()
        // Sort by confidence descending
        val sorted = detections.sortedByDescending { it.confidence }
        val active = BooleanArray(sorted.size) { true }
        val finalDetections = mutableListOf<FaceDetectionResult>()

        for (i in sorted.indices) {
            if (active[i]) {
                val candidate = sorted[i]
                finalDetections.add(candidate)
                for (j in i + 1 until sorted.size) {
                    if (active[j]) {
                        val overlap = calculateIoU(candidate.boundingBox, sorted[j].boundingBox)
                        if (overlap > 0.45f) { // Overlap threshold
                            active[j] = false
                        }
                    }
                }
            }
        }
        return finalDetections
    }

    private fun calculateIoU(box1: RectF, box2: RectF): Float {
        val interLeft = maxOf(box1.left, box2.left)
        val interTop = maxOf(box1.top, box2.top)
        val interRight = minOf(box1.right, box2.right)
        val interBottom = minOf(box1.bottom, box2.bottom)

        if (interLeft < interRight && interTop < interBottom) {
            val interArea = (interRight - interLeft) * (interBottom - interTop)
            val box1Area = (box1.right - box1.left) * (box1.bottom - box1.top)
            val box2Area = (box2.right - box2.left) * (box2.bottom - box2.top)
            return interArea / (box1Area + box2Area - interArea)
        }
        return 0.0f
    }

    fun close() {
        interpreter?.close()
        interpreter = null
    }
}
