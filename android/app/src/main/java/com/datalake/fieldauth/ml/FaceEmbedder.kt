package com.datalake.fieldauth.ml

import android.content.Context
import android.graphics.Bitmap
import org.tensorflow.lite.Interpreter
import org.tensorflow.lite.support.common.FileUtil
import org.tensorflow.lite.support.image.ImageProcessor
import org.tensorflow.lite.support.image.TensorImage
import org.tensorflow.lite.support.image.ops.ResizeOp
import org.tensorflow.lite.support.image.ops.NormalizeOp
import java.io.nio.MappedByteBuffer

class FaceEmbedder(private val context: Context) {
    private var interpreter: Interpreter? = null
    private val modelFileName = "mobilefacenet_int8_quant.tflite" // MobileFaceNet optimized quantized model
    private val inputSize = 112 // Standard input dimension of MobileFaceNet
    private val embeddingDimension = 128 // Generates 128 metric vectors

    init {
        initializeInterpreter()
    }

    private fun initializeInterpreter() {
        try {
            val modelBuffer: MappedByteBuffer = FileUtil.loadMappedFile(context, modelFileName)
            val options = Interpreter.Options().apply {
                setNumThreads(4) // Parallel performance optimization
            }
            interpreter = Interpreter(modelBuffer, options)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    /**
     * Extracts a 128-dimensional feature embedding FloatArray from a provided facial crop Bitmap.
     */
    fun generateEmbedding(faceCrop: Bitmap): FloatArray {
        val tInterpreter = interpreter ?: return FloatArray(embeddingDimension)

        // Preprocess: Crop must be resized exactly to 112x112 and converted to normalized RGB float tensors
        // Normalizes intensities from range [0..255] to mean 127.5 and standard deviation 127.5 -> Range [-1..1]
        val imageProcessor = ImageProcessor.Builder()
            .add(ResizeOp(inputSize, inputSize, ResizeOp.Method.BILINEAR))
            .add(NormalizeOp(127.5f, 127.5f))
            .build()

        val tensorImage = TensorImage(org.tensorflow.lite.DataType.FLOAT32)
        tensorImage.load(faceCrop)
        val processedTensorImage = imageProcessor.process(tensorImage)

        // Output buffer holds the 128-dimensional normalized float array
        val outputEmbedding = Array(1) { FloatArray(embeddingDimension) }

        // Execute 128 dimensional vector computation
        tInterpreter.run(processedTensorImage.buffer, outputEmbedding)

        // Return array mapping feature layers, normalized to unit length for robust L2 or Cosine distance calc
        return normalize(outputEmbedding[0])
    }

    /**
     * L2 normalization to ensure that the vectors reside on the hypersphere, allowing cosine similarity
     * calculation simply with a dot product comparison.
     */
    private fun normalize(vector: FloatArray): FloatArray {
        var sum = 0f
        for (f in vector) {
            sum += f * f
        }
        val norm = Math.sqrt(sum.toDouble()).toFloat()
        if (norm == 0f) return vector

        val normalized = FloatArray(vector.size)
        for (i in vector.indices) {
            normalized[i] = vector[i] / norm
        }
        return normalized
    }

    fun close() {
        interpreter?.close()
        interpreter = null
    }
}
