package com.datalake.fieldauth.presentation.components

import androidx.compose.animation.*
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
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
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.datalake.fieldauth.presentation.theme.*

// Challenges State Machine Enum
enum class LivenessChallengeType {
    IDLE,
    DETECTING_FACE,
    BLINK,
    SMILE,
    TURN_LEFT,
    MATCHING,
    SUCCESS,
    FAILED
}

@Composable
fun ChallengeCard(
    challengeType: LivenessChallengeType,
    timerProgress: Float, // 0.0f (expired) to 1.0f (full time remaining)
    secondsRemaining: Int,
    modifier: Modifier = Modifier
) {
    val transitionState = remember { MutableTransitionState(false) }.apply {
        targetState = true
    }

    AnimatedVisibility(
        visibleState = transitionState,
        enter = slideInVertically(
            initialOffsetY = { it },
            animationSpec = tween(durationMillis = 400)
        ) + fadeIn(animationSpec = tween(durationMillis = 400)),
        modifier = modifier
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
                .border(1.dp, BorderGray, RoundedCornerShape(12.dp)),
            colors = CardDefaults.cardColors(containerColor = SurfaceCard),
            shape = RoundedCornerShape(12.dp)
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(20.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Challenge State Description
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.Center
                ) {
                    val label = getChallengeLabel(challengeType)
                    val actionText = getChallengeInstruction(challengeType)
                    
                    Text(
                        text = label.uppercase(),
                        color = LightMutedText,
                        fontSize = 11.sp,
                        fontFamily = SpaceGroteskFont,
                        fontWeight = FontWeight.Bold,
                        letterSpacing = 1.5.sp
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Text(
                        text = actionText,
                        color = OnSurfaceWhite,
                        fontSize = 18.sp,
                        fontFamily = SpaceGroteskFont,
                        fontWeight = FontWeight.Bold,
                        lineHeight = 22.sp
                    )
                }

                Spacer(modifier = Modifier.width(16.dp))

                // Timer Ring with Countdown and Iconic Feedback
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(68.dp)
                        .clip(CircleShape)
                        .background(MutedNavy)
                ) {
                    val progressSweep by animateFloatAsState(
                        targetValue = timerProgress * 360f,
                        animationSpec = tween(100),
                        label = "timerProgress"
                    )

                    val indicatorColor = if (secondsRemaining < 2) StatusCrimson else ElectricTeal

                    // Circular Progress Track manually drawn or via standard indicator
                    CircularProgressIndicator(
                        progress = { timerProgress },
                        modifier = Modifier.fillMaxSize(),
                        color = indicatorColor,
                        strokeWidth = 3.dp,
                        trackColor = Color.White.copy(alpha = 0.1f)
                    )

                    // Large status icon centered
                    Icon(
                        imageVector = getChallengeIcon(challengeType),
                        contentDescription = "Challenge Icon",
                        tint = indicatorColor,
                        modifier = Modifier.size(28.dp)
                    )
                }
            }
        }
    }
}

private fun getChallengeLabel(type: LivenessChallengeType): String {
    return when (type) {
        LivenessChallengeType.IDLE -> "System Idle"
        LivenessChallengeType.DETECTING_FACE -> "Initializing Sensor"
        LivenessChallengeType.BLINK -> "Security Check 1/3"
        LivenessChallengeType.SMILE -> "Security Check 2/3"
        LivenessChallengeType.TURN_LEFT -> "Security Check 3/3"
        LivenessChallengeType.MATCHING -> "Biometric Matcher"
        LivenessChallengeType.SUCCESS -> "Passed Authentication"
        LivenessChallengeType.FAILED -> "Security Alarm"
    }
}

private fun getChallengeInstruction(type: LivenessChallengeType): String {
    return when (type) {
        LivenessChallengeType.IDLE -> "Wait for operation start..."
        LivenessChallengeType.DETECTING_FACE -> "Please align your face to initiate scan"
        LivenessChallengeType.BLINK -> "Blink your eyes multiple times..."
        LivenessChallengeType.SMILE -> "Smile genuinely at the screen..."
        LivenessChallengeType.TURN_LEFT -> "Slowly turn your face to the Left..."
        LivenessChallengeType.MATCHING -> "Analyzing database matching layers..."
        LivenessChallengeType.SUCCESS -> "Identity Verified Securely!"
        LivenessChallengeType.FAILED -> "Liveness detection failed"
    }
}

private fun getChallengeIcon(type: LivenessChallengeType): ImageVector {
    return when (type) {
        LivenessChallengeType.IDLE -> Icons.Rounded.HourglassEmpty
        LivenessChallengeType.DETECTING_FACE -> Icons.Rounded.Face
        LivenessChallengeType.BLINK -> Icons.Rounded.Visibility
        LivenessChallengeType.SMILE -> Icons.Rounded.SentimentSatisfiedAlt
        LivenessChallengeType.TURN_LEFT -> Icons.Rounded.CompareArrows
        LivenessChallengeType.MATCHING -> Icons.Rounded.Fingerprint
        LivenessChallengeType.SUCCESS -> Icons.Rounded.CheckCircle
        LivenessChallengeType.FAILED -> Icons.Rounded.GppBad
    }
}
