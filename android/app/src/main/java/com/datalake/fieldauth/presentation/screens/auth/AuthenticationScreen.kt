package com.datalake.fieldauth.presentation.screens.auth

import android.Manifest
import android.content.Context
import androidx.camera.view.LifecycleCameraController
import androidx.camera.view.PreviewView
import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalLifecycleOwner
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import com.google.accompanist.permissions.ExperimentalPermissionsApi
import com.google.accompanist.permissions.isGranted
import com.google.accompanist.permissions.rememberPermissionState
import com.datalake.fieldauth.ml.LivenessChallengeType
import com.datalake.fieldauth.presentation.components.ChallengeCard
import com.datalake.fieldauth.presentation.components.FaceOvalOverlay
import com.datalake.fieldauth.presentation.theme.*

@OptIn(ExperimentalPermissionsApi::class)
@Composable
fun AuthenticationScreen(
    viewModel: AuthenticationViewModel,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val lifecycleOwner = LocalLifecycleOwner.current
    val uiState by viewModel.uiState.collectAsState()

    // Enforce high-level system permissions checks for camera usage
    val cameraPermissionState = rememberPermissionState(Manifest.permission.CAMERA)

    LaunchedEffect(key1 = true) {
        cameraPermissionState.launchPermissionRequest()
    }

    if (cameraPermissionState.status.isGranted) {
        val cameraController = remember {
            LifecycleCameraController(context).apply {
                bindToLifecycle(lifecycleOwner)
            }
        }

        Box(modifier = modifier.fillMaxSize().background(Color.Black)) {
            // 1. Full screen Camera Hardware feed
            AndroidView(
                factory = { ctx ->
                    PreviewView(ctx).apply {
                        controller = cameraController
                    }
                },
                modifier = Modifier.fillMaxSize()
            )

            // 2. High Contrast Oval overlay cutout
            FaceOvalOverlay(
                modifier = Modifier.fillMaxSize(),
                feedbackText = uiState.feedbackText,
                isPulsing = uiState.isPulsing
            )

            // 3. Top-Level status indicators: Network & Attempts metrics
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .statusBarsPadding()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Offline banner badge (authoritative field utility guideline)
                Surface(
                    color = MutedNavy,
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, BorderGray)
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .clip(CircleShape)
                                .background(StatusAmber)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "OFFLINE VALIDATION",
                            fontSize = 11.sp,
                            fontFamily = SpaceGroteskFont,
                            fontWeight = FontWeight.Bold,
                            color = OnSurfaceWhite
                        )
                    }
                }

                // Remaining evaluation attempts badge
                Surface(
                    color = if (uiState.attemptsRemaining < 2) StatusCrimson else SurfaceCard,
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, if (uiState.attemptsRemaining < 2) StatusCrimson else BorderGray)
                ) {
                    Text(
                        text = "ATTEMPTS: ${uiState.attemptsRemaining}/3",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        fontSize = 11.sp,
                        fontFamily = SpaceGroteskFont,
                        fontWeight = FontWeight.Bold,
                        color = OnSurfaceWhite
                    )
                }
            }

            // Go back navigation
            IconButton(
                onClick = onNavigateBack,
                modifier = Modifier
                    .align(Alignment.TopStart)
                    .padding(top = 80.dp, start = 16.dp)
                    .background(Color.Black.copy(alpha = 0.5f), CircleShape)
            ) {
                Icon(
                    imageVector = Icons.Rounded.ArrowBack,
                    contentDescription = "Back home",
                    tint = OnSurfaceWhite
                )
            }

            // 4. Primary challenge instructions sheet (slides from bottom)
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter)
                    .navigationBarsPadding()
                    .padding(bottom = 24.dp)
            ) {
                if (uiState.challengeType != LivenessChallengeType.SUCCESS &&
                    uiState.challengeType != LivenessChallengeType.FAILED) {
                    ChallengeCard(
                        challengeType = uiState.challengeType,
                        timerProgress = uiState.timerProgress,
                        secondsRemaining = uiState.secondsRemaining,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            // 5. Success state Overlay Card
            AnimatedVisibility(
                visible = uiState.challengeType == LivenessChallengeType.SUCCESS,
                enter = slideInVertically(initialOffsetY = { it / 2 }) + fadeIn(),
                exit = fadeOut(),
                modifier = Modifier.align(Alignment.Center)
            ) {
                uiState.verificationResult?.let { res ->
                    Card(
                        modifier = Modifier
                            .width(320.dp)
                            .padding(24.dp)
                            .border(1.dp, ElectricTeal, RoundedCornerShape(12.dp)),
                        colors = CardDefaults.cardColors(containerColor = SurfaceCard)
                    ) {
                        Column(
                            modifier = Modifier.padding(24.dp),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Rounded.Verified,
                                contentDescription = "Verification Success",
                                tint = ElectricTeal,
                                modifier = Modifier.size(64.dp)
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "IDENTITY RETRIEVED",
                                fontFamily = SpaceGroteskFont,
                                fontWeight = FontWeight.Bold,
                                color = LightMutedText,
                                fontSize = 11.sp,
                                letterSpacing = 2.sp
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = res.employeeName,
                                fontFamily = SpaceGroteskFont,
                                fontWeight = FontWeight.Bold,
                                color = OnSurfaceWhite,
                                fontSize = 22.sp,
                                textAlign = TextAlign.Center
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = "ID: ${res.employeeId}",
                                fontFamily = DMSansFont,
                                color = LightMutedText,
                                fontSize = 14.sp
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            HorizontalDivider(color = BorderGray, thickness = 1.dp)
                            Spacer(modifier = Modifier.height(12.dp))
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "System Role:",
                                    fontFamily = DMSansFont,
                                    color = LightMutedText,
                                    fontSize = 12.sp
                                )
                                Text(
                                    text = res.role.uppercase(),
                                    fontFamily = SpaceGroteskFont,
                                    fontWeight = FontWeight.Bold,
                                    color = ElectricTeal,
                                    fontSize = 12.sp
                                )
                            }
                            Spacer(modifier = Modifier.height(6.dp))
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = "Confidence:",
                                    fontFamily = DMSansFont,
                                    color = LightMutedText,
                                    fontSize = 12.sp
                                )
                                Text(
                                    text = "${res.confidenceScore.toInt()}% Match",
                                    fontFamily = SpaceGroteskFont,
                                    fontWeight = FontWeight.Bold,
                                    color = ElectricTeal,
                                    fontSize = 12.sp
                                )
                            }

                            Spacer(modifier = Modifier.height(24.dp))
                            Button(
                                onClick = onNavigateBack,
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = ElectricTeal),
                                shape = RoundedCornerShape(28.dp)
                            ) {
                                Text(
                                    text = "CONTINUE WORKSHOP",
                                    color = PrimaryNavy,
                                    fontFamily = SpaceGroteskFont,
                                    fontWeight = FontWeight.Bold
                                )
                            }
                        }
                    }
                }
            }

            // 6. Failure (Locked) condition
            AnimatedVisibility(
                visible = uiState.challengeType == LivenessChallengeType.FAILED,
                enter = fadeIn() + scaleIn(),
                exit = fadeOut(),
                modifier = Modifier.align(Alignment.Center)
            ) {
                Card(
                    modifier = Modifier
                        .width(320.dp)
                        .padding(24.dp)
                        .border(1.dp, StatusCrimson, RoundedCornerShape(12.dp)),
                    colors = CardDefaults.cardColors(containerColor = SurfaceCard)
                ) {
                    Column(
                        modifier = Modifier.padding(24.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Rounded.Lock,
                            contentDescription = "Device Lockout",
                            tint = StatusCrimson,
                            modifier = Modifier.size(64.dp)
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "SECURITY LOCKOUT",
                            fontFamily = SpaceGroteskFont,
                            fontWeight = FontWeight.Bold,
                            color = StatusCrimson,
                            fontSize = 14.sp,
                            letterSpacing = 1.sp
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Face Verification Repeatedly Failed.",
                            fontFamily = DMSansFont,
                            color = OnSurfaceWhite,
                            fontSize = 15.sp,
                            textAlign = TextAlign.Center
                        )
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = "Please present physical company identification to an on-site supervisor for authentication override.",
                            fontFamily = DMSansFont,
                            color = LightMutedText,
                            fontSize = 12.sp,
                            textAlign = TextAlign.Center,
                            lineHeight = 18.sp
                        )
                        Spacer(modifier = Modifier.height(24.dp))
                        Button(
                            onClick = {
                                viewModel.resetState()
                            },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = StatusCrimson),
                            shape = RoundedCornerShape(28.dp)
                        ) {
                            Text(
                                text = "RETRY CHALLENGE",
                                color = OnSurfaceWhite,
                                fontFamily = SpaceGroteskFont,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                }
            }
        }
    } else {
        // Request Permission View representation
        Box(
            modifier = modifier
                .fillMaxSize()
                .background(BackgroundDark)
                .padding(24.dp),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(
                    imageVector = Icons.Rounded.Camera,
                    contentDescription = "Camera Permission Needed",
                    tint = LightMutedText,
                    modifier = Modifier.size(80.dp)
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "CAMERA PERMISSIONS MANDATORY",
                    fontFamily = SpaceGroteskFont,
                    fontWeight = FontWeight.Bold,
                    color = OnSurfaceWhite,
                    fontSize = 16.sp
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "To execute offline biometric and liveness challenge tests, this applet requires secure Android camera API permission.",
                    fontFamily = DMSansFont,
                    color = LightMutedText,
                    fontSize = 13.sp,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
}
