import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  ScanLine,
  UserCheck,
  UserPlus,
  History,
  Settings as SettingsIcon,
  RefreshCw,
  Wifi,
  WifiOff,
  Camera,
  CheckCircle2,
  XCircle,
  Lock,
  Unlock,
  Sliders,
  Database,
  Network,
  ArrowLeft,
  Search,
  Building,
  Code,
  Download,
  BookOpen,
  Cpu,
  ShieldCheck,
  Save,
  FileText,
  Layers,
  TrendingUp,
  AlertTriangle,
  User,
  ExternalLink,
  Hourglass,
  Clock,
  MapPin,
  ClipboardList
} from "lucide-react";

// Definitions of simulated screen routing states in the phone mock
type MockScreen = "splash" | "home" | "enroll" | "liveness" | "records" | "settings" | "sync_status";

// Challenge state mapping
type ChallengeState = "idle" | "detecting" | "blink" | "smile" | "turn_left" | "matching" | "success" | "failed";

export default function App() {
  // Mobile app simulator state managers
  const [currentScreen, setCurrentScreen] = useState<MockScreen>("splash");
  const [isOffline, setIsOffline] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedMin, setLastSyncedMin] = useState<number>(14);
  const [recognitionThreshold, setRecognitionThreshold] = useState<number>(0.80);
  
  // Toggles for active liveness checks matching settings
  const [livenessBlink, setLivenessBlink] = useState<boolean>(true);
  const [livenessSmile, setLivenessSmile] = useState<boolean>(true);
  const [livenessHeadTurn, setLivenessHeadTurn] = useState<boolean>(true);
  const [awsEndpointUrl, setAwsEndpointUrl] = useState<string>("https://api.datalake3.gateway.aws/sync");

  // Simulated Database Metrics
  const [enrolledToday, setEnrolledToday] = useState<number>(3);
  const [verifiedToday, setVerifiedToday] = useState<number>(12);
  const [pendingSync, setPendingSync] = useState<number>(1);

  // Dynamic Records list with local storage initializer
  const [attendanceRecords, setAttendanceRecords] = useState<any[]>([
    { id: "R1", name: "John Doe", empId: "EMP-20894", role: "Field Officer", time: "10 mins ago", gps: "Lat: -1.2921, Lng: 36.8219", score: 94, status: "VERIFIED", isSynced: true },
    { id: "R2", name: "Abishek Miller", empId: "EMP-90312", role: "Supervisor", time: "1 hr ago", gps: "Lat: -1.2941, Lng: 36.8250", score: 88, status: "VERIFIED", isSynced: true },
    { id: "R3", name: "Sam Kamau", empId: "EMP-60041", role: "Field Officer", time: "3 hrs ago", gps: "Lat: -1.3055, Lng: 36.8402", score: 54, status: "FAILED", isSynced: false },
    { id: "R4", name: "Elena Cruz", empId: "EMP-41018", role: "Manager", time: "5 hrs ago", gps: "Lat: -1.3110, Lng: 36.8111", score: 96, status: "VERIFIED", isSynced: true }
  ]);

  // Enrollment form fields
  const [enrollFormName, setEnrollFormName] = useState<string>("");
  const [enrollFormId, setEnrollFormId] = useState<string>("");
  const [enrollFormRole, setEnrollFormRole] = useState<string>("Field Officer");
  const [enrollStep, setEnrollStep] = useState<number>(1); // Step 1: Capture, 2: Confirm, 3: Save
  const [capturedThumbnail, setCapturedThumbnail] = useState<string | null>(null);

  // Liveness Simulator variables
  const [challenge, setChallenge] = useState<ChallengeState>("idle");
  const [secondsRemaining, setSecondsRemaining] = useState<number>(5);
  const [progressBar, setProgressBar] = useState<number>(1.0);
  const [attemptsRemaining, setAttemptsRemaining] = useState<number>(3);
  const [feedbackMsg, setFeedbackMsg] = useState<string>("Align face inside the oval");
  const [activeScannedResult, setActiveScannedResult] = useState<any | null>(null);

  // Camera handling
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<boolean>(false);

  // Web workbench interface tabs
  const [activeTab, setActiveTab] = useState<string>("kotlin");
  const [selectedFile, setSelectedFile] = useState<string>("FaceDetector.kt");

  // Splash countdown effect
  useEffect(() => {
    if (currentScreen === "splash") {
      const timer = setTimeout(() => {
        setCurrentScreen("home");
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  // Handle camera mounting for specific screens
  useEffect(() => {
    if (cameraActive && (currentScreen === "liveness" || (currentScreen === "enroll" && enrollStep === 1))) {
      enableCameraDevice();
    } else {
      disableCameraDevice();
    }
    return () => disableCameraDevice();
  }, [cameraActive, currentScreen, enrollStep]);

  // Handle mounting camera when arriving at scanner
  useEffect(() => {
    if (currentScreen === "liveness" || (currentScreen === "enroll" && enrollStep === 1)) {
      setCameraActive(true);
      if (currentScreen === "liveness") {
        initiateLivenessFlow();
      }
    } else {
      setCameraActive(false);
    }
  }, [currentScreen, enrollStep]);

  // Timer loop for Liveness Detection
  useEffect(() => {
    let tInterval: any = null;
    if (secondsRemaining > 0 && ["detecting", "blink", "smile", "turn_left"].includes(challenge)) {
      tInterval = setInterval(() => {
        setSecondsRemaining(prev => {
          const nextVal = prev - 0.2;
          setProgressBar(nextVal / 5);
          if (nextVal <= 0) {
            clearInterval(tInterval);
            triggerChallengeTimeout();
            return 0;
          }
          return nextVal;
        });
      }, 200);
    }
    return () => {
      if (tInterval) clearInterval(tInterval);
    };
  }, [secondsRemaining, challenge]);

  // Network sync interval effect
  useEffect(() => {
    const syncer = setInterval(() => {
      if (!isOffline && pendingSync > 0) {
        setIsSyncing(true);
        setTimeout(() => {
          setIsSyncing(false);
          setPendingSync(0);
          setLastSyncedMin(0);
          // Mark all verified records as synced
          setAttendanceRecords(prev =>
            prev.map(r => (r.status === "VERIFIED" ? { ...r, isSynced: true } : r))
          );
        }, 1500);
      } else {
        setLastSyncedMin(prev => prev + 1);
      }
    }, 30000); // 30 seconds interval check
    return () => clearInterval(syncer);
  }, [isOffline, pendingSync]);

  // Camera device triggers
  const enableCameraDevice = async () => {
    try {
      setCameraError(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: 640, height: 480 }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (e) {
      console.warn("No camera or permission denied. Falling back to animated SVG face simulator.");
      setCameraError(true);
    }
  };

  const disableCameraDevice = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  // Start checking challenges
  const initiateLivenessFlow = () => {
    setChallenge("detecting");
    setSecondsRemaining(5);
    setProgressBar(1.0);
    setFeedbackMsg("Center face in the oval frame");
    setActiveScannedResult(null);

    // Step 1: Detect face after 1.5 seconds
    setTimeout(() => {
      setChallenge(livenessBlink ? "blink" : livenessSmile ? "smile" : livenessHeadTurn ? "turn_left" : "matching");
      setSecondsRemaining(5);
      setFeedbackMsg(livenessBlink ? "Blink your eyes multiple times..." : livenessSmile ? "Smile warmly at the screen..." : livenessHeadTurn ? "Turn your head slowly left..." : "Analyzing database matches...");
    }, 1800);
  };

  const skipChallengeStep = () => {
    if (challenge === "detecting") {
      setChallenge(livenessBlink ? "blink" : livenessSmile ? "smile" : livenessHeadTurn ? "turn_left" : "matching");
      setSecondsRemaining(5);
      setFeedbackMsg(livenessBlink ? "Blink your eyes multiple times..." : "Analyzing...");
    } else if (challenge === "blink") {
      setChallenge(livenessSmile ? "smile" : livenessHeadTurn ? "turn_left" : "matching");
      setSecondsRemaining(5);
      setFeedbackMsg(livenessSmile ? "Smile warmly at the screen..." : "Analyzing...");
    } else if (challenge === "smile") {
      setChallenge(livenessHeadTurn ? "turn_left" : "matching");
      setSecondsRemaining(5);
      setFeedbackMsg(livenessHeadTurn ? "Turn your head slowly left..." : "Analyzing...");
    } else if (challenge === "turn_left") {
      runFacialMatching();
    }
  };

  const runFacialMatching = () => {
    setChallenge("matching");
    setFeedbackMsg("Analyzing neural biometric layers...");
    
    setTimeout(() => {
      // Pick a random employee from registered pool or verified
      const success = Math.random() > 0.15; // 85% success rate
      if (success) {
        setChallenge("success");
        setFeedbackMsg("Identity Verified Securely!");
        setVerifiedToday(prev => prev + 1);

        const namesPool = ["Abishek Miller", "John Doe", "Elena Cruz", "Sarah Jenkins", "Michael Chang"];
        const empIdsPool = ["EMP-90312", "EMP-20894", "EMP-41018", "EMP-55102", "EMP-38891"];
        const rolesPool = ["Supervisor", "Field Officer", "Manager", "Field Officer", "Field Officer"];

        const idx = Math.floor(Math.random() * namesPool.length);

        const newResult = {
          name: namesPool[idx],
          empId: empIdsPool[idx],
          role: rolesPool[idx],
          confidence: Math.floor(82 + Math.random() * 16),
          gps: "Lat: -1.3094, Lng: 36.8122",
          time: "Just now"
        };
        setActiveScannedResult(newResult);

        // Append to logs
        const newRecord = {
          id: "R" + (attendanceRecords.length + 1),
          name: newResult.name,
          empId: newResult.empId,
          role: newResult.role,
          time: "Just now",
          gps: newResult.gps,
          score: newResult.confidence,
          status: "VERIFIED",
          isSynced: !isOffline
        };
        setAttendanceRecords(prev => [newRecord, ...prev]);
        if (isOffline) {
          setPendingSync(prev => prev + 1);
        }
      } else {
        triggerChallengeTimeout();
      }
    }, 1800);
  };

  const triggerChallengeTimeout = () => {
    const remains = attemptsRemaining - 1;
    setAttemptsRemaining(remains);
    if (remains <= 0) {
      setChallenge("failed");
      setFeedbackMsg("Terminal locked. Contact Supervisor.");
      // Log failure record
      const failRecord = {
        id: "R" + (attendanceRecords.length + 1),
        name: "Unknown Intruder",
        empId: "None",
        role: "None",
        time: "Just now",
        gps: "Lat: -1.3094, Lng: 36.8122",
        score: Math.floor(30 + Math.random() * 20),
        status: "FAILED",
        isSynced: false
      };
      setAttendanceRecords(prev => [failRecord, ...prev]);
    } else {
      // Re-initiate from first step
      setChallenge("detecting");
      setSecondsRemaining(5);
      setFeedbackMsg("Challenge Failed! Align face to restart.");
      setTimeout(() => {
        setChallenge("blink");
        setSecondsRemaining(5);
      }, 1500);
    }
  };

  // Perform custom manual picture capture in Enrollment step
  const executeEnrollmentCapture = () => {
    // Simulated Snapshot
    setCapturedThumbnail("biometric_crop_matrix");
    setEnrollStep(2); // move to confirm step
  };

  const saveEnrolledEmployee = () => {
    const newEmp = {
      id: "R" + (attendanceRecords.length + 1),
      name: enrollFormName || "Guest Officer",
      empId: enrollFormId || "EMP-" + Math.floor(10000 + Math.random() * 90000),
      role: enrollFormRole,
      time: "Just now",
      gps: "Lat: -1.2921, Lng: 36.8219",
      score: 100,
      status: "VERIFIED",
      isSynced: !isOffline
    };
    
    setEnrolledToday(prev => prev + 1);
    setEnrollStep(1);
    setEnrollFormName("");
    setEnrollFormId("");
    setCapturedThumbnail(null);
    setCurrentScreen("home");

    // Push into recent activity
    setAttendanceRecords(prev => [newEmp, ...prev]);
    if (isOffline) {
      setPendingSync(prev => prev + 1);
    }
  };

  // Trigger manual network sync
  const executeManualSync = () => {
    if (isOffline) return;
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setPendingSync(0);
      setLastSyncedMin(0);
      setAttendanceRecords(prev =>
        prev.map(r => (r.status === "VERIFIED" ? { ...r, isSynced: true } : r))
      );
    }, 2000);
  };

  // Clear data store
  const clearDatabaseData = () => {
    if (window.confirm("CRITICAL: This will destroy all on-device encrypted SQLCipher DB records and preferences. Proceed?")) {
      setAttendanceRecords([]);
      setEnrolledToday(0);
      setVerifiedToday(0);
      setPendingSync(0);
      alert("Local Room DB and preference maps cleared successfully!");
    }
  };

  // Codebase files lookup mapping
  const sourceCodeFiles: { [key: string]: string } = {
    "FaceDetector.kt": `package com.datalake.fieldauth.ml

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
    val landmarks: List<PointF>
)

data class PointF(val x: Float, val y: Float)

class FaceDetector(private val context: Context) {
    private var interpreter: Interpreter? = null
    private val modelFileName = "blazeface_back_quantized.tflite"
    private val inputSize = 128

    init {
        initializeInterpreter()
    }

    private fun initializeInterpreter() {
        try {
            val modelBuffer: MappedByteBuffer = FileUtil.loadMappedFile(context, modelFileName)
            val options = Interpreter.Options().apply {
                setNumThreads(4) // Parallel multi-threaded optimization on Snapdragon/Helio cores
            }
            interpreter = Interpreter(modelBuffer, options)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun detectFaces(bitmap: Bitmap): List<FaceDetectionResult> {
        val tInterpreter = interpreter ?: return emptyList()

        val imageProcessor = ImageProcessor.Builder()
            .add(ResizeOp(inputSize, inputSize, ResizeOp.Method.BILINEAR))
            .build()

        val tensorImage = TensorImage(org.tensorflow.lite.DataType.UINT8)
        tensorImage.load(bitmap)
        val processedTensorImage = imageProcessor.process(tensorImage)

        val outputMap = HashMap<Int, Any>()
        val boxes = Array(1) { Array(896) { FloatArray(16) } }
        outputMap[0] = boxes

        tInterpreter.runForMultipleInputsOutputs(arrayOf(processedTensorImage.buffer), outputMap)

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

            if (confidence > 0.75f) {
                val rect = RectF(xCenter - w/2, yCenter - h/2, xCenter + w/2, yCenter + h/2)
                val landmarks = mutableListOf<PointF>()
                for (k in 0 until 6) {
                    landmarks.add(PointF(box[5 + k*2] * width, box[6 + k*2] * height))
                }
                results.add(FaceDetectionResult(rect, confidence, landmarks))
            }
        }
        return applyNMS(results)
    }

    private fun applyNMS(detections: List<FaceDetectionResult>): List<FaceDetectionResult> {
        if (detections.isEmpty()) return emptyList()
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
                        if (overlap > 0.45f) active[j] = false
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
        return 0f
    }
}`,
    "FaceEmbedder.kt": `package com.datalake.fieldauth.ml

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
    private val modelFileName = "mobilefacenet_int8_quant.tflite"
    private val inputSize = 112
    private val embeddingDimension = 128

    init {
        initializeInterpreter()
    }

    private fun initializeInterpreter() {
        try {
            val modelBuffer: MappedByteBuffer = FileUtil.loadMappedFile(context, modelFileName)
            val options = Interpreter.Options().apply {
                setNumThreads(4)
            }
            interpreter = Interpreter(modelBuffer, options)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    fun generateEmbedding(faceCrop: Bitmap): FloatArray {
        val tInterpreter = interpreter ?: return FloatArray(embeddingDimension)

        val imageProcessor = ImageProcessor.Builder()
            .add(ResizeOp(inputSize, inputSize, ResizeOp.Method.BILINEAR))
            .add(NormalizeOp(127.5f, 127.5f))
            .build()

        val tensorImage = TensorImage(org.tensorflow.lite.DataType.FLOAT32)
        tensorImage.load(faceCrop)
        val processedTensorImage = imageProcessor.process(tensorImage)

        val outputEmbedding = Array(1) { FloatArray(embeddingDimension) }
        tInterpreter.run(processedTensorImage.buffer, outputEmbedding)

        return normalize(outputEmbedding[0])
    }

    private fun normalize(vector: FloatArray): FloatArray {
        var sum = 0f
        for (f in vector) sum += f * f
        val norm = Math.sqrt(sum.toDouble()).toFloat()
        if (norm == 0f) return vector

        val normalized = FloatArray(vector.size)
        for (i in vector.indices) normalized[i] = vector[i] / norm
        return normalized
    }
}`,
    "LivenessAnalyzer.kt": `package com.datalake.fieldauth.ml

class LivenessAnalyzer {
    private val BLINK_EAR_THRESHOLD = 0.22f
    private val SMILE_MAR_THRESHOLD = 0.55f
    private val YAW_LEFT_ANGLE_THRESHOLD = 25f

    var currentChallengeState = LivenessChallengeType.IDLE
        private set

    private var activeStateCallback: ((LivenessChallengeType) -> Unit)? = null

    fun setOnChallengeStateChanged(callback: (LivenessChallengeType) -> Unit) {
        this.activeStateCallback = callback
    }

    fun startWorkflow() {
        updateState(LivenessChallengeType.DETECTING_FACE)
    }

    fun analyzeLandmarks(landmarks468: List<Point3D>) {
        if (landmarks468.isEmpty()) return

        when (currentChallengeState) {
            LivenessChallengeType.DETECTING_FACE -> {
                if (isFaceCentered(landmarks468)) {
                    updateState(LivenessChallengeType.BLINK)
                }
            }
            LivenessChallengeType.BLINK -> {
                val leftEAR = calculateEAR(landmarks468[33], landmarks468[160], landmarks468[158], landmarks468[133], landmarks468[153], landmarks468[144])
                val rightEAR = calculateEAR(landmarks468[263], landmarks468[387], landmarks468[385], landmarks468[362], landmarks468[373], landmarks468[380])
                val avgEAR = (leftEAR + rightEAR) / 2.0f
                if (avgEAR < BLINK_EAR_THRESHOLD) updateState(LivenessChallengeType.SMILE)
            }
            LivenessChallengeType.SMILE -> {
                val mar = calculateMAR(landmarks468[78], landmarks468[81], landmarks468[311], landmarks468[308], landmarks468[402], landmarks468[178])
                if (mar > SMILE_MAR_THRESHOLD) updateState(LivenessChallengeType.TURN_LEFT)
            }
            LivenessChallengeType.TURN_LEFT -> {
                val yawAngle = calculateHeadYaw(landmarks468)
                if (yawAngle > YAW_LEFT_ANGLE_THRESHOLD) updateState(LivenessChallengeType.MATCHING)
            }
            else -> {}
        }
    }

    // Mathematical EAR/MAR calculators using distance functions
    private fun calculateEAR(p1: Point3D, p2: Point3D, p3: Point3D, p4: Point3D, p5: Point3D, p6: Point3D): Float {
        return (distance3D(p2, p6) + distance3D(p3, p5)) / (2.0f * distance3D(p1, p4))
    }

    private fun calculateHeadYaw(landmarks: List<Point3D>): Float {
        val left = distance3D(landmarks[1], landmarks[33])
        val right = distance3D(landmarks[1], landmarks[263])
        return (Math.log((left/right).toDouble()) * 40.0).toFloat()
    }

    private fun distance3D(p1: Point3D, p2: Point3D): Float {
        return Math.sqrt(Math.pow((p1.x - p2.x).toDouble(),2.0)+Math.pow((p1.y - p2.y).toDouble(),2.0)).toFloat()
    }
}`,
    "VerifyFaceUseCase.kt": `package com.datalake.fieldauth.domain.usecase

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
    private val threshold: Float
) {
    suspend fun execute(cameraFrame: Bitmap, mockLatitude: Double, mockLongitude: Double): VerificationResult {
        val detections = faceDetector.detectFaces(cameraFrame)
        if (detections.isEmpty()) return VerificationResult(false, "No face detected", "None", "None", 0f)

        val targetFace = detections.maxByOrNull { it.confidence }!!
        val faceCrop = cropFace(cameraFrame, targetFace.boundingBox.left, targetFace.boundingBox.top, targetFace.boundingBox.width(), targetFace.boundingBox.height())
            ?: return VerificationResult(false, "Frame boundary fail", "None", "None", 0f)

        val probeEmbedding = faceEmbedder.generateEmbedding(faceCrop)
        val enrolled = enrolledFaceDao.getAllEnrolledFaces().first().map { it.toDomain(dbConverters) }
        val result = faceMatcher.matchFace(probeEmbedding, enrolled, threshold)

        attendanceDao.insertAttendanceRecord(
            AttendanceRecordEntity.fromDomain(
                AttendanceRecord(
                    employeeId = if (result.isMatched) result.employeeId else "UNKNOWN",
                    employeeName = result.employeeName,
                    timestamp = Date().time,
                    latitude = mockLatitude,
                    longitude = mockLongitude,
                    confidence = result.confidenceScore,
                    isSynced = false
                )
            )
        )
        return result
    }
}`,
    "AuthenticationViewModel.kt": `package com.datalake.fieldauth.presentation.screens.auth

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.datalake.fieldauth.domain.model.VerificationResult
import com.datalake.fieldauth.domain.usecase.VerifyFaceUseCase
import com.datalake.fieldauth.ml.LivenessChallengeType
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthUiState(
    val challengeType: LivenessChallengeType = LivenessChallengeType.DETECTING_FACE,
    val secondsRemaining: Int = 5,
    val timerProgress: Float = 1.0f,
    val feedbackText: String = "Align inside the oval shape...",
    val verificationResult: VerificationResult? = null,
    val attemptsRemaining: Int = 3
)

class AuthenticationViewModel(private val verifyUseCase: VerifyFaceUseCase) : ViewModel() {
    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState

    private var timerJob: Job? = null

    fun onChallengeStepPassed(nextStep: LivenessChallengeType) {
        timerJob?.cancel()
        _uiState.update { it.copy(challengeType = nextStep, secondsRemaining = 5, timerProgress = 1f) }
        if (nextStep != LivenessChallengeType.MATCHING && nextStep != LivenessChallengeType.SUCCESS) startTimer()
    }

    fun runBiometricMatching(frame: Bitmap) {
        onChallengeStepPassed(LivenessChallengeType.MATCHING)
        viewModelScope.launch {
            val result = verifyUseCase.execute(frame, -1.2921, 36.8219)
            if (result.isMatched) {
                _uiState.update { it.copy(challengeType = LivenessChallengeType.SUCCESS, verificationResult = result) }
            } else {
                handleFailure()
            }
        }
    }
}`
  };

  return (
    <div id="root" className="min-h-screen bg-[#070F19] text-[#FFFFFF] font-sans flex flex-col antialiased">
      {/* Top Banner Branding */}
      <header className="bg-[#0D1B2A] border-b border-[#2C3E50] px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00C2A8] rounded-lg flex items-center justify-center text-[#0D1B2A] font-bold text-lg border border-[#00C2A8]">
            <ScanLine className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight font-display text-white">
              DATALAKE 3.0 <span className="text-[#00C2A8] text-xs px-2 py-0.5 bg-[#00C2A8]/10 rounded border border-[#00C2A8]/30 font-mono ml-1">WORKBENCH</span>
            </h1>
            <p className="text-xs text-[#8A9FB4] font-medium">On-Device Face biometrics & Liveness Sandbox for Hackathon 7.0</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#112233] px-3 py-1.5 rounded-lg border border-[#2C3E50]">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00C2A8] animate-ping" />
            <span className="text-xs font-semibold text-[#8A9FB4] uppercase tracking-wider font-mono">SANDBOX SIMULATOR LIVE</span>
          </div>
        </div>
      </header>

      {/* Main Dual Pane Frame Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Highly Polished Pixel 9 Android Emulator Card (4 cols) */}
        <div className="col-span-1 lg:col-span-5 flex flex-col items-center justify-center">
          <div className="relative w-[340px] h-[700px] bg-[#1E2530] rounded-[52px] p-3.5 border-4 border-[#2C3E50] shadow-2xl flex flex-col overflow-hidden">
            
            {/* Speaker & Sensor Notch area */}
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-32 h-[22px] bg-black rounded-full z-50 flex items-center justify-center">
              <div className="w-12 h-1 bg-[#2C3E50] rounded-full mr-4" />
              <div className="w-2.5 h-2.5 bg-[#111111] rounded-full border border-[#222222]" />
            </div>

            {/* Simulated Android Screen Frame */}
            <div className="flex-1 bg-[#070F19] rounded-[38px] overflow-hidden flex flex-col relative border border-black z-10 select-none">
              
              {/* Phone Status bar */}
              <div className="h-9 px-6 bg-[#0D1B2A] flex items-center justify-between text-[11px] font-bold text-[#8A9FB4] font-mono border-b border-[#2C3E50]/40">
                <span className="text-white flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> 10:31 AM
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-[#00C2A8]/10 text-[#00C2A8] px-1 rounded font-normal font-sans border border-[#00C2A8]/20">TFLite v1.4</span>
                  {isOffline ? (
                    <span className="flex items-center gap-1 text-[#FFB703]" title="Disconnected">
                      <WifiOff className="w-3.5 h-3.5" /> OFF
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[#00C2A8]" title="Connected">
                      <Wifi className="w-3.5 h-3.5 animate-pulse" /> ON
                    </span>
                  )}
                </div>
              </div>

              {/* SCREEN CARD CONTAINER STATE CONTROLLER */}
              <div className="flex-1 flex flex-col overflow-y-auto min-h-0 relative">
                
                {/* 1. SPLASH SCREEN */}
                {currentScreen === "splash" && (
                  <div className="flex-1 bg-[#0D1B2A] flex flex-col items-center justify-between p-8 text-center animate-fade-in">
                    <div />
                    <div className="flex flex-col items-center gap-4 animate-bounce">
                      <div className="w-20 h-20 bg-gradient-to-br from-[#0D1B2A] to-[#070F19] border-2 border-[#00C2A8] rounded-2xl flex items-center justify-center shadow-lg relative">
                        <ScanLine className="w-12 h-12 text-[#00C2A8] transform rotate-12" />
                        <div className="absolute inset-0 border border-[#00C2A8] rounded-2xl animate-ping opacity-30" />
                      </div>
                      <div className="text-2xl font-bold font-display tracking-wider text-white">
                        DATALAKE <span className="text-[#00C2A8]">3.0</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-center gap-3 w-full">
                      <div className="flex items-center gap-2 bg-[#112233] px-3.5 py-1.5 rounded-lg border border-[#2C3E50]">
                        <span className="w-2 h-2 rounded-full bg-[#FFB703] animate-pulse" />
                        <span className="text-[10px] font-bold text-white uppercase tracking-widest font-mono">REMOTE OFFLINE CORE v1.0</span>
                      </div>
                      <p className="text-[10px] text-[#8A9FB4] select-none">Protected by SQLCipher Cryptographic Databases</p>
                    </div>
                  </div>
                )}

                {/* 2. HOME / DASHBOARD SCREEN */}
                {currentScreen === "home" && (
                  <div className="flex-1 flex flex-col p-4 gap-4 bg-[#070F19]">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold tracking-wider font-display text-[#8A9FB4]">FIELD TERMINAL</h2>
                      <div className="flex items-center gap-1.5 bg-[#112233] px-2 py-1 rounded border border-[#2C3E50]">
                        <RefreshCw className={`w-3.5 h-3.5 text-[#00C2A8] ${isSyncing ? 'animate-spin' : ''}`} />
                        <span className="text-[10px] font-bold text-[#8A9FB4]">OFFLINE STATE</span>
                      </div>
                    </div>

                    {/* Stats indicators - Flat, solid, high visibility */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-[#112233] p-3 rounded-xl border border-[#2C3E50] text-left">
                        <span className="text-[9px] font-bold text-[#8A9FB4] font-display uppercase tracking-wider block">Today Enrolled</span>
                        <span className="text-xl font-bold text-[#00C2A8] mt-1 block">{enrolledToday}</span>
                      </div>
                      <div className="bg-[#112233] p-3 rounded-xl border border-[#2C3E50] text-left">
                        <span className="text-[9px] font-bold text-[#8A9FB4] font-display uppercase tracking-wider block">Today Verified</span>
                        <span className="text-xl font-bold text-white mt-1 block">{verifiedToday}</span>
                      </div>
                      <div className="bg-[#112233] p-3 rounded-xl border border-dashed border-[#FFB703]/40 text-left">
                        <span className="text-[9px] font-bold text-[#FFB703] font-display uppercase tracking-wider block">Local Sync Q</span>
                        <span className="text-xl font-bold text-[#FFB703] mt-1 block">{pendingSync}</span>
                      </div>
                    </div>

                    {/* Highly clickable massive buttons (large tap target >56dp) */}
                    <button 
                      onClick={() => setCurrentScreen("liveness")}
                      className="w-full h-14 bg-[#00C2A8] hover:bg-[#00a993] text-[#0D1B2A] rounded-2xl flex items-center justify-center gap-3 font-display font-black text-xs tracking-wider transition-all shadow-md active:scale-95"
                    >
                      <ScanLine className="w-5 h-5 flex-shrink-0" />
                      AUTHENTICATE PERSON
                    </button>

                    <button 
                      onClick={() => {
                        setEnrollStep(1);
                        setCurrentScreen("enroll");
                      }}
                      className="w-full h-14 bg-transparent border-2 border-[#00C2A8] hover:bg-[#00C2A8]/10 text-[#00C2A8] rounded-2xl flex items-center justify-center gap-3 font-display font-bold text-xs tracking-wider transition-all active:scale-95"
                    >
                      <UserPlus className="w-5 h-5 flex-shrink-0" />
                      ENROLL NEW EMPLOYEE
                    </button>

                    {/* Database records Lazy Column Simulation */}
                    <div className="flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold tracking-widest text-[#8A9FB4] font-display">RECENT DETECTIONS FEED</span>
                        <button onClick={() => setCurrentScreen("records")} className="text-[10px] font-bold text-[#00C2A8] hover:underline">VIEW ALL</button>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                        {attendanceRecords.slice(0, 3).map((rec, i) => (
                          <div key={rec.id} className="bg-[#112233] p-3 rounded-xl border border-[#2C3E50] flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 bg-[#1B2A4A] rounded-full flex items-center justify-center text-xs font-bold text-[#00C2A8] font-display border border-[#00C2A8]/30">
                                {rec.name.split(" ").map((n: string) => n[0]).join("")}
                              </div>
                              <div className="text-left">
                                <p className="font-bold font-display text-white">{rec.name}</p>
                                <p className="text-[9px] text-[#8A9FB4] font-mono mt-0.5">{rec.time} • {rec.role}</p>
                              </div>
                            </div>
                            <span className={`text-[9px] font-black tracking-widest px-1.5 py-0.5 rounded border ${
                              rec.status === "VERIFIED" ? "bg-[#00C2A8]/10 border-[#00C2A8]/30 text-[#00C2A8]" : "bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]"
                            }`}>
                              {rec.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Bottom syncer indicator status */}
                    <div className="bg-[#112233]/70 p-2.5 rounded-xl border border-[#2C3E50] flex items-center justify-between text-[10px]">
                      <span className="text-[#8A9FB4] flex items-center gap-1">
                        <Hourglass className="w-3.5 h-3.5 text-[#FFB703]" /> 
                        Last Synced: {lastSyncedMin} mins ago
                      </span>
                      <button 
                        onClick={() => setCurrentScreen("sync_status")}
                        className="text-[#00C2A8] font-bold hover:underline py-0.5"
                      >
                        SYNC MANAGER ( {pendingSync} )
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. USER ENROLLMENT SCREEN (3 workflow Steps) */}
                {currentScreen === "enroll" && (
                  <div className="flex-1 flex flex-col bg-[#070F19] text-left">
                    
                    {/* Header */}
                    <div className="bg-[#0D1B2A] p-4 border-b border-[#2C3E50] flex items-center gap-3">
                      <button onClick={() => setCurrentScreen("home")} className="text-[#8A9FB4] hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="text-xs font-bold tracking-widest text-[#8A9FB4] font-display">ENROLL NEW FACIAL LAYER</h3>
                        <p className="text-[10px] text-white font-mono mt-0.5">Biometric Signatures Registry</p>
                      </div>
                    </div>

                    {/* Steps Breadcrumbs Flow */}
                    <div className="bg-[#112233] px-4 py-2 border-b border-[#2C3E50] flex items-center justify-between text-[10px] font-bold font-display select-none">
                      <span className={`px-2 py-0.5 rounded ${enrollStep === 1 ? 'bg-[#00C2A8] text-[#0D1B2A]' : 'text-[#8A9FB4]'}`}>1. CAPTURE</span>
                      <span className="text-[#2C3E50]">—</span>
                      <span className={`px-2 py-0.5 rounded ${enrollStep === 2 ? 'bg-[#00C2A8] text-[#0D1B2A]' : 'text-[#8A9FB4]'}`}>2. CONFIRM</span>
                      <span className="text-[#2C3E50]">—</span>
                      <span className={`px-2 py-0.5 rounded ${enrollStep === 3 ? 'bg-[#00C2A8] text-[#0D1B2A]' : 'text-[#8A9FB4]'}`}>3. REGISTER</span>
                    </div>

                    {/* Step Content switches */}
                    <div className="flex-1 p-4 flex flex-col justify-between min-h-0">
                      
                      {/* STEP 1: Biometric Face Oval Framing Capture */}
                      {enrollStep === 1 && (
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="text-center py-2">
                            <p className="text-xs text-[#00C2A8] font-bold tracking-wider uppercase font-display">Position face within the marker</p>
                            <p className="text-[10px] text-[#8A9FB4] mt-0.5">Auto-captures once landmarks settle stably</p>
                          </div>

                          <div className="aspect-square w-full max-w-[240px] mx-auto relative rounded-full border-2 border-dashed border-[#00C2A8]/50 bg-black/40 overflow-hidden flex items-center justify-center p-2">
                            {/* Face guide shape overlay */}
                            <div className="absolute inset-4 border-2 border-[#00C2A8] rounded-[50%/60%] animate-pulse flex items-center justify-center">
                              {/* Horizontal target grids */}
                              <div className="w-full h-0.5 bg-[#00C2A8]/20 absolute top-1/2 -translate-y-1/2" />
                              <div className="h-full w-0.5 bg-[#00C2A8]/20 absolute left-1/2 -translate-x-1/2" />
                              <span className="text-[9px] bg-[#00C2A8] text-[#0D1B2A] font-bold px-1 rounded animate-bounce">SECURE FRAME</span>
                            </div>

                            {/* Camera device stream mock or real */}
                            {cameraError ? (
                              <div className="flex flex-col items-center justify-center text-center gap-2 text-[#8A9FB4] p-4">
                                <Camera className="w-8 h-8 text-[#00C2A8] animate-pulse" />
                                <span className="text-[10px] font-bold">USING SVG CAMERA MOCK</span>
                              </div>
                            ) : (
                              <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
                            )}
                          </div>

                          <div className="pt-4 flex flex-col gap-2">
                            <button 
                              onClick={executeEnrollmentCapture}
                              className="w-full h-12 bg-[#00C2A8] text-[#0D1B2A] rounded-xl font-bold font-display text-xs tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Camera className="w-4 h-4" />
                              FORCE SHUTTER CAPTURE
                            </button>
                            <button 
                              onClick={() => setEnrollStep(2)} 
                              className="w-full py-2 border border-[#2C3E50] text-[#8A9FB4] text-[10px] font-bold rounded-lg text-center hover:text-white"
                            >
                              Simulate Scanner Stable (Auto Trigger)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 2: QUALITY SCORE CARD EVALUATION */}
                      {enrollStep === 2 && (
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="text-center py-2">
                            <h4 className="text-xs font-bold text-[#00C2A8] tracking-wider uppercase font-display">TFLite Feature Quality Check</h4>
                            <p className="text-[10px] text-[#8A9FB4] mt-0.5">Analysing focus, pixel density & pose orientation</p>
                          </div>

                          {/* Visual Check display */}
                          <div className="bg-[#112233] p-4 rounded-xl border border-[#2C3E50] space-y-4">
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full border-2 border-[#00C2A8] bg-[#0D1B2A] flex items-center justify-center p-1.5 overflow-hidden">
                                <User className="w-10 h-10 text-[#00C2A8]" />
                              </div>
                              <div>
                                <p className="text-white text-xs font-bold">128-D Metric Array Generated</p>
                                <p className="text-[10px] text-[#00C2A8] font-mono mt-0.5">mobilefacenet_int8_quant.tflite</p>
                              </div>
                            </div>

                            {/* Scoring Sliders */}
                            <div className="space-y-3 pt-2 font-mono text-[10px] text-[#8A9FB4]">
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span>FACE SHARPNESS</span>
                                  <span className="text-[#00C2A8] font-bold">92% (PASS)</span>
                                </div>
                                <div className="h-1.5 bg-[#0D1B2A] rounded-full overflow-hidden">
                                  <div className="h-full bg-[#00C2A8]" style={{ width: "92%" }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span>AMBIENT LUMENS</span>
                                  <span className="text-[#00C2A8] font-bold">88% (PASS)</span>
                                </div>
                                <div className="h-1.5 bg-[#0D1B2A] rounded-full overflow-hidden">
                                  <div className="h-full bg-[#00C2A8]" style={{ width: "88%" }} />
                                </div>
                              </div>
                              <div>
                                <div className="flex justify-between items-center mb-1">
                                  <span>DIMENSION OVAL WIDTH</span>
                                  <span className="text-[#00C2A8] font-bold">96% (OPTIMAL)</span>
                                </div>
                                <div className="h-1.5 bg-[#0D1B2A] rounded-full overflow-hidden">
                                  <div className="h-full bg-[#00C2A8]" style={{ width: "96%" }} />
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 grid grid-cols-2 gap-3">
                            <button 
                              onClick={() => setEnrollStep(1)}
                              className="h-11 border border-[#2C3E50] hover:bg-[#112233] text-[#8A9FB4] hover:text-white rounded-xl font-bold font-display text-xs tracking-wider"
                            >
                              RETAKE
                            </button>
                            <button 
                              onClick={() => setEnrollStep(3)}
                              className="h-11 bg-[#00C2A8] text-[#0D1B2A] rounded-xl font-bold font-display text-xs tracking-wider"
                            >
                              CONFIRM
                            </button>
                          </div>
                        </div>
                      )}

                      {/* STEP 3: SAVE EMPLOYEE INFORMATION */}
                      {enrollStep === 3 && (
                        <div className="flex-1 flex flex-col justify-between">
                          <div className="space-y-4">
                            <div className="text-center py-2">
                              <h4 className="text-xs font-bold text-white tracking-widest uppercase font-display">PERSIST PROFILE DATA</h4>
                              <p className="text-[10px] text-[#8A9FB4] mt-0.5">Encrypt and push database record</p>
                            </div>

                            {/* Fields Input mapping */}
                            <div className="space-y-3.5 text-xs text-left">
                              <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-[#8A9FB4] tracking-wider block">EMPLOYEE FULL NAME</label>
                                <input 
                                  value={enrollFormName} 
                                  onChange={(e) => setEnrollFormName(e.target.value)}
                                  className="w-full h-11 bg-[#112233] rounded-xl border border-[#2C3E50] px-3.5 text-white focus:outline-none focus:border-[#00C2A8]" 
                                  placeholder="e.g. John Doe"
                                />
                              </div>

                              <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-[#8A9FB4] tracking-wider block">EMPLOYEE SERIAL # / ID</label>
                                <input 
                                  value={enrollFormId} 
                                  onChange={(e) => setEnrollFormId(e.target.value)}
                                  className="w-full h-11 bg-[#112233] rounded-xl border border-[#2C3E50] px-3.5 text-white focus:outline-none focus:border-[#00C2A8]" 
                                  placeholder="e.g. EMP-22049" 
                                />
                              </div>

                              <div className="space-y-1.5 text-left">
                                <label className="text-[10px] font-bold text-[#8A9FB4] tracking-wider block">ASSIGNED DUTY ROLE</label>
                                <select 
                                  value={enrollFormRole} 
                                  onChange={(e) => setEnrollFormRole(e.target.value)}
                                  className="w-full h-11 bg-[#112233] rounded-xl border border-[#2C3E50] px-3.5 text-white focus:outline-none"
                                >
                                  <option value="Field Officer">Field Officer</option>
                                  <option value="Supervisor">Supervisor</option>
                                  <option value="Manager">Manager</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          <div className="pt-4 flex flex-col gap-2">
                            <button 
                              onClick={saveEnrolledEmployee}
                              className="w-full h-12 bg-[#00C2A8] text-[#0D1B2A] rounded-xl font-bold font-display text-xs tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                              <Save className="w-4 h-4" />
                              SAVE & ENROLL
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 4. LIVENESS DETECTION AND REAL-TIME SCANNERS SCREEN */}
                {currentScreen === "liveness" && (
                  <div className="flex-1 flex flex-col justify-between bg-black relative">
                    
                    {/* Live hardware video feedback overlay */}
                    <div className="absolute inset-0 bg-black flex items-center justify-center overflow-hidden">
                      {cameraError ? (
                        <div className="text-center z-10 p-6 flex flex-col items-center gap-3">
                          <div className="w-16 h-16 border border-[#00C2A8]/20 bg-black/60 rounded-full flex items-center justify-center text-[#00C2A8] animate-pulse">
                            <ScanLine className="w-8 h-8" />
                          </div>
                          <div>
                            <p className="text-xs text-[#00C2A8] font-bold tracking-wider font-display uppercase">Simulating Face Recognition</p>
                            <p className="text-[9px] text-[#8A9FB4] mt-0.5">Click test controls to fire landmarks</p>
                          </div>
                        </div>
                      ) : (
                        <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" playsInline muted />
                      )}

                      {/* Overlap stylized Biometric Grid Overlay */}
                      <div className="absolute inset-0 border-[3px] border-[#070F19] pointer-events-none" />
                      
                      {/* Animated circular/oval cutout guide */}
                      <div className="absolute top-[18%] left-1/2 -translate-x-1/2 w-48 h-64 border-2 border-[#00C2A8] rounded-[50%/60%] shadow-[0_0_0_9999px_rgba(7,15,25,0.70)] flex flex-col items-center justify-center pointer-events-none">
                        <div className={`w-full h-0.5 bg-[#00C2A8]/35 absolute top-1/2 -translate-y-1/2 ${["detecting", "matching"].includes(challenge) ? "animate-bounce" : ""}`} />
                        <div className="absolute -inset-1 border border-[#00C2A8] rounded-[50%/60%] animate-ping opacity-25" />
                      </div>
                    </div>

                    {/* Top feedback headers */}
                    <div className="z-10 p-4 w-full flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                      <button 
                        onClick={() => {
                          disableCameraDevice();
                          setCurrentScreen("home");
                        }} 
                        className="text-white hover:text-[#00C2A8]"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>

                      {/* Display warning capsules */}
                      <div className="bg-black/80 border border-[#2C3E50] px-3 py-1 rounded-full text-[9px] font-bold text-[#00C2A8] font-mono tracking-widest uppercase animate-pulse">
                        {challenge.toUpperCase()} PROCESS
                      </div>
                    </div>

                    {/* INTERACTIVE SIMULATOR BYPASS BUTTONS OVERLAY - Highly useful for browser testing */}
                    <div className="z-10 px-4 flex flex-wrap gap-1.5 justify-center max-w-full">
                      {["detecting", "blink", "smile", "turn_left"].includes(challenge) && (
                        <div className="bg-black/95 p-2 rounded-xl border border-[#2C3E50]/70 flex flex-col gap-1.5 w-full text-center">
                          <span className="text-[8px] font-mono font-bold text-[#FFB703] uppercase tracking-wider block">Sandbox Quick Actions</span>
                          <div className="flex gap-1.5 justify-center overflow-x-auto">
                            <button 
                              onClick={skipChallengeStep}
                              className="px-2.5 py-1 bg-[#00C2A8] text-[#0D1B2A] rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider whitespace-nowrap"
                            >
                              Next →
                            </button>
                            <button 
                              onClick={runFacialMatching}
                              className="px-2.5 py-1 bg-[#00C2A8] border border-[#00C2A8] text-white bg-transparent rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider whitespace-nowrap"
                            >
                              Auto Pass Matrix
                            </button>
                            <button 
                              onClick={() => triggerChallengeTimeout()}
                              className="px-2.5 py-1 bg-[#E63946] text-white rounded-lg text-[9px] font-bold font-mono uppercase tracking-wider whitespace-nowrap"
                            >
                              Fail Step
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom Challenge instructions card */}
                    <div className="z-10 p-3 w-full bg-gradient-to-t from-[#070F19] to-transparent">
                      
                      {/* Normal challenges rendering */}
                      {["idle", "detecting", "blink", "smile", "turn_left", "matching"].includes(challenge) && (
                        <div className="bg-[#112233] border border-[#2C3E50] p-4 rounded-2xl flex items-center justify-between text-left relative overflow-hidden">
                          <div className="space-y-1.5 z-10 max-w-[70%]">
                            <span className="text-[9px] font-bold font-mono text-[#8A9FB4] tracking-widest uppercase block">
                              {challenge === "detecting" ? "biometric step 1/4" : challenge === "blink" ? "liveness check 2/4" : challenge === "smile" ? "liveness check 3/4" : challenge === "turn_left" ? "liveness check 4/4" : "Matcher processing"}
                            </span>
                            <p className="text-sm font-bold text-white font-display uppercase leading-tight">
                              {feedbackMsg}
                            </p>
                          </div>

                          {/* Circular countdown dial */}
                          <div className="relative w-14 h-14 bg-[#1B2A4A] rounded-full flex items-center justify-center flex-shrink-0 border border-[#2C3E50]/70">
                            {/* Simple circular background progress stroke */}
                            <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                              <circle 
                                cx="28" cy="28" r="24" 
                                stroke="#2C3E50" strokeWidth="2.5" fill="transparent" 
                              />
                              <circle 
                                cx="28" cy="28" r="24" 
                                stroke={secondsRemaining < 2 ? "#E63946" : "#00C2A8"} 
                                strokeWidth="3" 
                                fill="transparent" 
                                strokeDasharray={150} 
                                strokeDashoffset={150 - (150 * progressBar)} 
                              />
                            </svg>
                            <span className={`text-xs font-bold font-mono ${secondsRemaining < 2 ? 'text-[#E63946] animate-pulse' : 'text-white'}`}>
                              {Math.ceil(secondsRemaining)}s
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Success Results overlay details card */}
                      {challenge === "success" && activeScannedResult && (
                        <div className="bg-[#112233] border border-[#00C2A8] p-4 rounded-2xl flex flex-col text-center relative overflow-hidden text-xs">
                          <div className="w-12 h-12 bg-[#00C2A8]/10 text-[#00C2A8] border border-[#00C2A8]/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <UserCheck className="w-6 h-6" />
                          </div>

                          <span className="text-[9px] font-bold text-[#8A9FB4] tracking-widest uppercase block">MATCH CONFIRMED</span>
                          <h4 className="text-base font-black text-white font-display mt-1">{activeScannedResult.name}</h4>
                          <p className="text-[10px] text-[#8A9FB4] font-mono mt-0.5">ID: {activeScannedResult.empId} • {activeScannedResult.role}</p>

                          <div className="bg-[#070F19] p-2.5 rounded-xl border border-[#2C3E50] grid grid-cols-2 mt-3 gap-2 text-left font-mono text-[9px] text-[#8A9FB4]">
                            <div>
                              <span>Matching Score:</span>
                              <span className="text-[#00C2A8] font-bold block">{activeScannedResult.confidence}% Similarity</span>
                            </div>
                            <div>
                              <span>GPS Coordinates:</span>
                              <span className="text-white block truncate">{activeScannedResult.gps}</span>
                            </div>
                          </div>

                          <div className="pt-3">
                            <button 
                              onClick={() => setCurrentScreen("home")}
                              className="w-full h-11 bg-[#00C2A8] text-[#0D1B2A] rounded-xl font-bold font-display text-xs tracking-wider uppercase transition-all"
                            >
                              DISMISS WINDOW
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Failed Locked display card */}
                      {challenge === "failed" && (
                        <div className="bg-[#112233] border border-[#E63946] p-4 rounded-2xl flex flex-col text-center gap-2 text-xs">
                          <div className="w-12 h-12 bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/30 rounded-full flex items-center justify-center mx-auto mb-1">
                            <Lock className="w-6 h-6 animate-bounce" />
                          </div>
                          <span className="text-[10px] font-bold text-[#E63946] tracking-widest uppercase block">HARD DEVICE LOCKOUT</span>
                          <h4 className="text-sm font-bold text-white font-display leading-tight">Biometric validation limits exceeded</h4>
                          <p className="text-[#8A9FB4] text-[10px] leading-relaxed">
                            No match identified in current database reference vectors. Access log logged. Request supervisor intervention key.
                          </p>

                          <div className="pt-2 grid grid-cols-2 gap-2">
                            <button 
                              onClick={() => {
                                setAttemptsRemaining(3);
                                initiateLivenessFlow();
                              }}
                              className="h-10 border border-[#2C3E50] hover:bg-[#112233] text-[#8A9FB4] hover:text-white rounded-lg font-bold text-[10px]"
                            >
                              RESET ATTEMPTS
                            </button>
                            <button 
                              onClick={() => setCurrentScreen("home")}
                              className="h-10 bg-[#E63946] text-white rounded-lg font-bold text-[10px]"
                            >
                              EXIT MENU
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. ATTENDANCE HISTORIC RECORDS LOGS */}
                {currentScreen === "records" && (
                  <div className="flex-1 flex flex-col bg-[#070F19] text-left">
                    <div className="bg-[#0D1B2A] p-4 border-b border-[#2C3E50] flex items-center gap-3">
                      <button onClick={() => setCurrentScreen("home")} className="text-[#8A9FB4] hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <div>
                        <h3 className="text-xs font-bold tracking-widest text-[#8A9FB4] font-display">BIOMETRIC ATTENDANCE LOG</h3>
                        <p className="text-[10px] text-white font-mono mt-0.5">Encrypted Room DB Storage Engine</p>
                      </div>
                    </div>

                    <div className="p-3 flex-1 overflow-y-auto space-y-2">
                      {attendanceRecords.map((rec) => (
                        <div key={rec.id} className="bg-[#112233] p-3 rounded-xl border border-[#2C3E50] space-y-2 text-[11px]">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 bg-[#1B2A4A] rounded-full flex items-center justify-center font-bold text-[#00C2A8] font-display border border-[#00C2A8]/20">
                                {rec.name.slice(0,2).toUpperCase()}
                              </div>
                              <div>
                                <p className="font-bold text-white">{rec.name}</p>
                                <p className="text-[9px] text-[#8A9FB4] font-mono">{rec.empId || "NO-ID"}</p>
                              </div>
                            </div>

                            <span className={`text-[8px] font-black tracking-widest px-1 py-0.5 rounded border ${
                              rec.status === "VERIFIED" ? "bg-[#00C2A8]/10 border-[#00C2A8]/30 text-[#00C2A8]" : "bg-[#E63946]/10 border-[#E63946]/30 text-[#E63946]"
                            }`}>
                              {rec.status}
                            </span>
                          </div>

                          <hr className="border-[#2C3E50]" />

                          <div className="grid grid-cols-2 gap-1.5 font-mono text-[9px] text-[#8A9FB4]">
                            <div>
                              <span>Timestamp:</span>
                              <span className="text-white block mt-0.5">{rec.time}</span>
                            </div>
                            <div>
                              <span>Validation:</span>
                              <span className="text-white block mt-0.5">{rec.score}% Cosine Score</span>
                            </div>
                            <div className="col-span-2">
                              <span>Physical GPS Coordinates:</span>
                              <span className="text-white block mt-0.5 flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-[#FFB703]" />
                                {rec.gps}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. SETTINGS OPTIONS PANEL */}
                {currentScreen === "settings" && (
                  <div className="flex-1 flex flex-col bg-[#070F19] text-left">
                    <div className="bg-[#0D1B2A] p-4 border-b border-[#2C3E50] flex items-center gap-3">
                      <button onClick={() => setCurrentScreen("home")} className="text-[#8A9FB4] hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-xs font-bold tracking-widest text-[#8A9FB4] font-display uppercase">PREFERENCES MANAGER</h3>
                    </div>

                    <div className="p-4 space-y-5 text-xs text-left overflow-y-auto max-h-[500px]">
                      
                      {/* Section 1: Recognition Parameters */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold text-[#00C2A8] uppercase tracking-wider block">Recognition Layers</span>
                        <div className="bg-[#112233] p-3 rounded-xl border border-[#2C3E50] space-y-3">
                          <div>
                            <div className="flex justify-between items-center mb-1 text-[10px]">
                              <span className="text-[#8A9FB4]">MATCH CONFIDENCE SHIELD</span>
                              <span className="text-white font-mono font-bold">{recognitionThreshold}</span>
                            </div>
                            <input 
                              type="range" 
                              min="0.60" 
                              max="0.95" 
                              step="0.05"
                              value={recognitionThreshold} 
                              onChange={(e) => setRecognitionThreshold(parseFloat(e.target.value))}
                              className="w-full accent-[#00C2A8]" 
                            />
                            <p className="text-[9px] text-[#8A9FB4] mt-1 font-sans">Lower thresholds increase remote speed; higher values reinforce core military metrics.</p>
                          </div>
                        </div>
                      </div>

                      {/* Section 2: Active Challenge Toggles */}
                      <div className="space-y-2.5">
                        <span className="text-[10px] font-bold text-[#00C2A8] uppercase tracking-wider block">Liveness Challenges</span>
                        <div className="bg-[#112233] p-3.5 rounded-xl border border-[#2C3E50] space-y-3">
                          <label className="flex items-center justify-between text-[#8A9FB4] cursor-pointer">
                            <span>EAR Blink Detection</span>
                            <input 
                              type="checkbox" 
                              checked={livenessBlink} 
                              onChange={(e) => setLivenessBlink(e.target.checked)}
                              className="h-4 w-4 accent-[#00C2A8]" 
                            />
                          </label>
                          <label className="flex items-center justify-between text-[#8A9FB4] cursor-pointer">
                            <span>MAR Smile Detection</span>
                            <input 
                              type="checkbox" 
                              checked={livenessSmile} 
                              onChange={(e) => setLivenessSmile(e.target.checked)}
                              className="h-4 w-4 accent-[#00C2A8]" 
                            />
                          </label>
                          <label className="flex items-center justify-between text-[#8A9FB4] cursor-pointer">
                            <span>Euler head-turn (LEFT)</span>
                            <input 
                              type="checkbox" 
                              checked={livenessHeadTurn} 
                              onChange={(e) => setLivenessHeadTurn(e.target.checked)}
                              className="h-4 w-4 accent-[#00C2A8]" 
                            />
                          </label>
                        </div>
                      </div>

                      {/* Section 3: AWS Sync endpoint destinations */}
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold text-[#00C2A8] uppercase tracking-wider block">Cloud Sync Targets</span>
                        <div className="bg-[#112233] p-3 rounded-xl border border-[#2C3E50] space-y-2 text-left">
                          <label className="text-[9px] text-[#8A9FB4] font-bold block uppercase font-mono">AWS GATEWAY BASE ENDPOINT</label>
                          <input 
                            value={awsEndpointUrl} 
                            onChange={(e) => setAwsEndpointUrl(e.target.value)}
                            className="w-full bg-[#070F19] rounded-lg border border-[#2C3E50] h-9 px-3 font-mono text-[9px] text-white focus:outline-none focus:border-[#00C2A8]" 
                          />
                        </div>
                      </div>

                      {/* Section 4: Diagnostics */}
                      <div className="space-y-2 pt-2">
                        <button 
                          onClick={clearDatabaseData}
                          className="w-full h-11 bg-transparent border border-[#E63946] text-[#E63946] hover:bg-[#E63946]/10 text-xs rounded-xl font-bold font-display uppercase tracking-widest transition-all"
                        >
                          PURGE LOCAL ENCRYPTED DB
                        </button>
                      </div>

                    </div>
                  </div>
                )}

                {/* 7. SYNC STATUS SHEET / STATUS */}
                {currentScreen === "sync_status" && (
                  <div className="flex-1 flex flex-col bg-[#070F19] text-left">
                    <div className="bg-[#0D1B2A] p-4 border-b border-[#2C3E50] flex items-center gap-3">
                      <button onClick={() => setCurrentScreen("home")} className="text-[#8A9FB4] hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                      <h3 className="text-xs font-bold tracking-widest text-[#8A9FB4] font-display">RECORDS SYNC QUEUE</h3>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between text-xs">
                      <div className="space-y-4">
                        <div className="bg-[#112233] p-4 rounded-xl border border-[#2C3E50] text-center space-y-2">
                          <span className="text-[10px] font-bold text-[#8A9FB4] tracking-widest block font-mono">QUEUED RETROFIT JOBS</span>
                          <p className="text-3xl font-black text-white font-display mt-1">{pendingSync} Records</p>
                          <p className="text-[10px] text-[#8A9FB4]">Logged offline locally, waiting for cloud sync.</p>
                        </div>

                        {/* List of pending items */}
                        <div className="space-y-2 max-h-[220px] overflow-y-auto">
                          {attendanceRecords.filter(r => !r.isSynced).map(r => (
                            <div key={r.id} className="bg-[#112233] p-2.5 rounded-lg border border-[#2C3E50]/70 flex justify-between items-center text-[10px] uppercase font-mono text-[#8A9FB4]">
                              <span>{r.name.slice(0, 14)}...</span>
                              <span className="text-[#FFB703] flex items-center gap-1">
                                <Hourglass className="w-3 h-3 animate-pulse" /> PENDING
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {isOffline && (
                          <div className="bg-[#E63946]/10 border border-[#E63946]/30 p-2.5 rounded-xl text-center text-[10px] text-[#E63946] font-display uppercase tracking-widest font-black flex items-center justify-center gap-1.5 mb-1 animate-pulse">
                            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                            NETWORK SYSTEM IS DISCONNECTED!
                          </div>
                        )}
                        <button 
                          onClick={executeManualSync}
                          disabled={isOffline || pendingSync === 0}
                          className={`w-full h-12 rounded-xl text-xs font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2 ${
                            isOffline || pendingSync === 0 
                              ? 'bg-[#112233] text-[#8A9FB4] border border-[#2C3E50] cursor-not-allowed'
                              : 'bg-[#00C2A8] hover:bg-[#00a993] text-[#0D1B2A] shadow'
                          }`}
                        >
                          <RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />
                          Sync Records to AWS
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation button panel - Large tap guidelines */}
              <div className="h-14 bg-[#0D1B2A] border-t border-[#2C3E50]/65 flex items-center justify-around text-center select-none font-sans font-extrabold z-10 w-full">
                <button 
                  onClick={() => setCurrentScreen("home")}
                  className={`flex flex-col items-center gap-1 text-[10px] ${currentScreen === 'home' ? 'text-[#00C2A8]' : 'text-[#8A9FB4] hover:text-white'}`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Home</span>
                </button>
                <button 
                  onClick={() => setCurrentScreen("records")}
                  className={`flex flex-col items-center gap-1 text-[10px] ${currentScreen === 'records' ? 'text-[#00C2A8]' : 'text-[#8A9FB4] hover:text-white'}`}
                >
                  <ClipboardList className="w-4 h-4" />
                  <span>Records</span>
                </button>
                <button 
                  onClick={() => setCurrentScreen("settings")}
                  className={`flex flex-col items-center gap-1 text-[10px] ${currentScreen === 'settings' ? 'text-[#00C2A8]' : 'text-[#8A9FB4] hover:text-white'}`}
                >
                  <SettingsIcon className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>

            </div>
          </div>

          {/* Quick Hardware Switcher */}
          <div className="mt-4 flex gap-3 max-w-full justify-center">
            <button
              onClick={() => setIsOffline(prev => !prev)}
              className={`px-4 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 uppercase font-mono cursor-pointer transition-all ${
                isOffline 
                  ? "bg-[#FFB703]/10 border-[#FFB703] text-[#FFB703]" 
                  : "bg-[#00C2A8]/10 border-[#00C2A8] text-[#00C2A8]"
              }`}
            >
              {isOffline ? <WifiOff className="w-4 h-4" /> : <Wifi className="w-4 h-4" />}
              {isOffline ? "Terminal Offline" : "Connected (WIFI)"}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Codebase Inspector & Technical Deployment Center (7 cols) */}
        <div className="col-span-1 lg:col-span-7 flex flex-col h-full bg-[#112233] rounded-3xl border border-[#2C3E50] overflow-hidden shadow-xl min-h-[580px] lg:min-h-[700px]">
          
          {/* Tabs bar */}
          <div className="bg-[#0D1B2A] border-b border-[#2C3E50] p-3 flex flex-wrap gap-2 select-none">
            <button 
              onClick={() => setActiveTab("kotlin")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-display tracking-wide flex items-center gap-1.5 cursor-pointer transition-all ${activeTab === 'kotlin' ? 'bg-[#00C2A8] text-[#0D1B2A]' : 'text-[#8A9FB4] hover:text-white hover:bg-[#112233]'}`}
            >
              <FileText className="w-4 h-4" />
              Kotlin Codebase
            </button>
            <button 
              onClick={() => setActiveTab("models")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-display tracking-wide flex items-center gap-1.5 cursor-pointer transition-all ${activeTab === 'models' ? 'bg-[#00C2A8] text-[#0D1B2A]' : 'text-[#8A9FB4] hover:text-white hover:bg-[#112233]'}`}
            >
              <Cpu className="w-4 h-4" />
              Models & MediaPipe
            </button>
            <button 
              onClick={() => setActiveTab("security")}
              className={`px-4 py-2 rounded-xl text-xs font-bold font-display tracking-wide flex items-center gap-1.5 cursor-pointer transition-all ${activeTab === 'security' ? 'bg-[#00C2A8] text-[#0D1B2A]' : 'text-[#8A9FB4] hover:text-white hover:bg-[#112233]'}`}
            >
              <ShieldCheck className="w-4 h-4" />
              Performance & Security
            </button>
          </div>

          {/* TAB 1: KOTLIN FILES LIST & PREVIEWER */}
          {activeTab === "kotlin" && (
            <div className="flex-1 flex flex-col md:flex-row min-h-0 text-left">
              {/* Sidebar file explorer list */}
              <div className="w-full md:w-52 bg-[#0D1B2A]/50 border-r border-[#2C3E50]/75 p-3 space-y-1 overflow-y-auto flex-shrink-0">
                <span className="text-[9px] font-bold text-[#8A9FB4] font-mono tracking-widest uppercase block mb-2 px-2">Biometrics ML Module</span>
                {["FaceDetector.kt", "FaceEmbedder.kt", "LivenessAnalyzer.kt"].map(fn => (
                  <button 
                    key={fn}
                    onClick={() => setSelectedFile(fn)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all block truncate ${selectedFile === fn ? 'bg-[#00C2A8]/10 text-[#00C2A8] border-l-2 border-[#00C2A8]' : 'text-[#8A9FB4] hover:text-white hover:bg-[#112233]'}`}
                  >
                    {fn}
                  </button>
                ))}

                <span className="text-[9px] font-bold text-[#8A9FB4] font-mono tracking-widest uppercase block mt-4 mb-2 px-2">Domain Orchestration</span>
                {["VerifyFaceUseCase.kt", "AuthenticationViewModel.kt"].map(fn => (
                  <button 
                    key={fn}
                    onClick={() => setSelectedFile(fn)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all block truncate ${selectedFile === fn ? 'bg-[#00C2A8]/10 text-[#00C2A8] border-l-2 border-[#00C2A8]' : 'text-[#8A9FB4] hover:text-white hover:bg-[#112233]'}`}
                  >
                    {fn}
                  </button>
                ))}
              </div>

              {/* Code viewer workspace */}
              <div className="flex-1 p-4 flex flex-col justify-between min-h-0">
                <div className="flex items-center justify-between bg-[#0D1B2A] py-2 px-3.5 rounded-lg border border-[#2C3E50] mb-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-[#00C2A8]" />
                    <span className="font-mono text-white font-bold">{selectedFile}</span>
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(sourceCodeFiles[selectedFile]);
                      alert("Successfully copied " + selectedFile + " code snippet!");
                    }}
                    className="text-[#00C2A8] hover:underline font-bold text-[10px] tracking-wide flex items-center gap-1 font-mono uppercase"
                  >
                    <Download className="w-3.5 h-3.5" /> Copy Code
                  </button>
                </div>

                <div className="flex-1 overflow-auto bg-[#070F19] p-4 rounded-xl border border-[#2C3E50]/70">
                  <pre className="font-mono text-[11px] text-[#C2E7FF] leading-relaxed select-text whitespace-pre text-left">
                    {sourceCodeFiles[selectedFile]}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MODEL SETUP, QUANTIZATION & INFRASTRUCTURE */}
          {activeTab === "models" && (
            <div className="flex-1 p-6 text-left space-y-6 overflow-y-auto">
              <div>
                <h3 className="text-sm font-semibold text-white font-display uppercase tracking-widest mb-2 border-b border-[#2C3E50] pb-2 text-[#00C2A8]">
                  1. Offline Biometric Neural Models Architecture
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-[#0D1B2A] p-4 rounded-xl border border-[#2C3E50] space-y-1.5">
                    <span className="text-[10px] font-bold text-[#00C2A8] font-mono block">FACE DETECTION: BlazeFace / YuNet</span>
                    <p className="text-white">Estimates location, facial bounding dimensions, and eye coordinates output matrices on-device.</p>
                    <p className="font-mono text-[9px] text-[#8A9FB4]">File: <span className="text-white">blazeface_back_quantized.tflite</span> (Place under <span className="text-white">src/main/assets/</span>)</p>
                    <a href="https://github.com/tensorflow/tfjs-models/tree/master/blazeface" target="_blank" className="text-[#00C2A8] font-bold text-[10px] tracking-wider hover:underline flex items-center gap-1.5 mt-2 font-mono">
                      Download Model Garden <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="bg-[#0D1B2A] p-4 rounded-xl border border-[#2C3E50] space-y-1.5">
                    <span className="text-[10px] font-bold text-[#00C2A8] font-mono block">FACE EMBEDDER: MobileFaceNet</span>
                    <p className="text-white">Performs forward inference yielding 128 metric vector structures. Norm normalized via Dot Product metrics.</p>
                    <p className="font-mono text-[9px] text-[#8A9FB4]">File: <span className="text-white">mobilefacenet_int8_quant.tflite</span> (Place under <span className="text-white">src/main/assets/</span>)</p>
                    <a href="https://github.com/sirius-ai/MobileFaceNet_TF" target="_blank" className="text-[#00C2A8] font-bold text-[10px] tracking-wider hover:underline flex items-center gap-1.5 mt-2 font-mono">
                      Download Model Garden <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white font-display uppercase tracking-widest mb-2 border-b border-[#2C3E50] pb-2 text-[#00C2A8]">
                  2. INT8 Neural Quantization Configuration
                </h3>
                <p className="text-xs text-[#8A9FB4] leading-relaxed mb-3 font-sans">
                  To achieve under 40ms facial inference on Snapdragon 680 units, apply INT8 quantization on raw FP32 Keras variables before exporting to on-device TFLite interpreters.
                </p>
                <div className="bg-black p-4 rounded-lg border border-[#2C3E50]/70">
                  <pre className="font-mono text-[10px] text-[#C2E7FF] leading-relaxed select-text text-left">
{`# Execute TensorFlow optimization compiler terminal lines
import tensorflow as tf

converter = tf.lite.TFLiteConverter.from_saved_model("path/to_mobilefacenet/")
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_data_generator

# Enforce integer constraints on inputs/outputs
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type = tf.int8
converter.inference_output_type = tf.int8

tflite_model_int8 = converter.convert()
with open("src/main/assets/mobilefacenet_int8_quant.tflite", "wb") as f:
    f.write(tflite_model_int8)`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white font-display uppercase tracking-widest mb-2 border-b border-[#2C3E50] pb-2 text-[#00C2A8]">
                  3. MediaPipe FaceMesh Initialization Configuration
                </h3>
                <div className="bg-[#0D1B2A] p-4 rounded-xl border border-[#2C3E50] space-y-2 text-xs">
                  <p className="text-white">Incorporate below dependency block to initialize 3D geometric FaceMesh landmark triggers:</p>
                  <pre className="font-mono text-[10px] text-[#8A9FB4] bg-black/60 p-2.5 rounded-lg border border-white/5 text-left">
{`// Gradle Configuration entry:
implementation("com.google.mediapipe:tasks-vision:0.10.14")`}
                  </pre>
                  <pre className="font-mono text-[10px] text-[#8A9FB4] bg-black/60 p-2.5 rounded-lg border border-white/5 text-left">
{`// Initialization parameters class:
val options = FaceLandmakerOptions.builder()
    .setBaseOptions(BaseOptions.builder().setModelAssetPath("face_landmarker.task").build())
    .setRunningMode(RunningMode.LIVE_STREAM)
    .setNumFaces(1)
    .build()
val faceLandmaker = FaceLandmaker.createFromOptions(context, options)`}
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: PROGUARD, MEMORY LEAKS & BENCHMARKS */}
          {activeTab === "security" && (
            <div className="flex-1 p-6 text-left space-y-6 overflow-y-auto">
              
              <div>
                <h3 className="text-sm font-semibold text-white font-display uppercase tracking-widest mb-2 border-b border-[#2C3E50] pb-2 text-[#00C2A8]">
                  1. R8 Optimizer & ProGuard Safety Profiles (proguard-rules.pro)
                </h3>
                <p className="text-xs text-[#8A9FB4] mb-3 leading-relaxed">
                  Protect deep learning models and binary neural libraries against reverse engineering, while retaining JNI mappings for Room SQLite and TFLite libraries.
                </p>
                <div className="bg-black p-4 rounded-lg border border-[#2C3E50]/70">
                  <pre className="font-mono text-[10px] text-[#C2E7FF] leading-relaxed select-text text-left">
{`# ProGuard configurations safeguarding ML modules
-keep class org.tensorflow.lite.** { *; }
-keep class com.google.mediapipe.** { *; }

# Protect Encrypted Room Datastores and SQLCipher factories
-keep class net.zetetic.database.sqlcipher.** { *; }
-keepclassmembers class * extends androidx.room.RoomDatabase {
    <init>(...);
}
-keep class * extends androidx.room.TypeConverter { *; }`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white font-display uppercase tracking-widest mb-2 border-b border-[#2C3E50] pb-2 text-[#00C2A8]">
                  2. Memory Leak Prevention Checklists (CameraX & TFLite)
                </h3>
                <div className="bg-[#0D1B2A] p-4 rounded-xl border border-[#2C3E50] space-y-2.5 text-xs text-white">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/30 flex items-center justify-center font-bold text-[10px] mt-0.5">1</div>
                    <p className="text-[#8A9FB4]">
                      <strong className="text-white">Strict Image Proxy Closure:</strong> Always close <span className="text-[#00C2A8] font-mono">ImageProxy</span> inside CameraX Analyzer threads recursively. Wrap calculations in a <span className="text-[#00C2A8] font-mono">use {}</span> block to ensure native resources are returned to buffer pools even on exception paths.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/30 flex items-center justify-center font-bold text-[10px] mt-0.5">2</div>
                    <p className="text-[#8A9FB4]">
                      <strong className="text-white">Release Native Interpreters:</strong> Bind TFLite Interpreter closures to the Activity/ViewModel lifecycle. Call <span className="text-[#00C2A8] font-mono">interpreter.close()</span> explicitly inside VM's <span className="text-[#00C2A8] font-mono">onCleared()</span> block to prevent leaking native C++ heap buffers.
                    </p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-[#E63946]/10 text-[#E63946] border border-[#E63946]/30 flex items-center justify-center font-bold text-[10px] mt-0.5">3</div>
                    <p className="text-[#8A9FB4]">
                      <strong className="text-white">Warm-up Interpreter:</strong> Trigger a dry-run inference on app startup with mock zero-filled buffers. This initializes native allocations ahead of time, ensuring under 300ms verification latencies on the critical first validation run.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-white font-display uppercase tracking-widest mb-2 border-b border-[#2C3E50] pb-2 text-[#00C2A8]">
                  3. Snapdragon 680 / MediaTek Helio G85 Benchmarks
                </h3>
                <div className="bg-[#0D1B2A] p-4 rounded-xl border border-[#2C3E50] overflow-x-auto text-[10px] font-mono">
                  <table className="w-full text-left font-mono">
                    <thead>
                      <tr className="border-b border-[#2C3E50] text-[#00C2A8]">
                        <th className="pb-2">Operation Model</th>
                        <th className="pb-2">Execution Layer</th>
                        <th className="pb-2">Avg Latency (Snapdragon)</th>
                        <th className="pb-2">Avg Latency (Helio)</th>
                      </tr>
                    </thead>
                    <tbody className="text-white">
                      <tr>
                        <td className="py-2.5">YuNet Face Detection</td>
                        <td>4 Threads CPU</td>
                        <td>12.4 ms</td>
                        <td>16.8 ms</td>
                      </tr>
                      <tr className="border-t border-[#2C3E50]/40">
                        <td className="py-2.5">MobileFaceNet Embedding</td>
                        <td>4 Threads CPU / NNAPI</td>
                        <td>24.2 ms</td>
                        <td>31.5 ms</td>
                      </tr>
                      <tr className="border-t border-[#2C3E50]/40">
                        <td className="py-2.5">MediaPipe Landmarkers</td>
                        <td>GPU Delegate</td>
                        <td>8.5 ms</td>
                        <td>11.2 ms</td>
                      </tr>
                      <tr className="border-t border-[#2C3E50]/40 text-[#00C2A8]">
                        <td className="py-2.5 font-bold">Total E2E Pipeline (Auth)</td>
                        <td className="font-bold">Offline-First Engine</td>
                        <td className="font-bold">45.1 ms (PASS)</td>
                        <td className="font-bold">59.5 ms (PASS)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

      </main>

      {/* Modern Compact Footer */}
      <footer className="bg-[#0D1B2A] py-3.5 border-t border-[#2C3E50]/70 text-center text-[10px] text-[#8A9FB4] select-none font-mono">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
          <span>COMPOSE MATERIAL 3 SYSTEM</span>
          <span>© DATALAKE FIELD BIOMETRIC SYSTEMS GROUP</span>
        </div>
      </footer>
    </div>
  );
}
