package com.datalake.fieldauth.presentation.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.*
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Rect
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.*
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.datalake.fieldauth.presentation.theme.ElectricTeal
import com.datalake.fieldauth.presentation.theme.SpaceGroteskFont

@Composable
fun FaceOvalOverlay(
    modifier: Modifier = Modifier,
    feedbackText: String = "Position face inside the oval",
    isPulsing: Boolean = true
) {
    // Pulse animation logic
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val pulseScale by if (isPulsing) {
        infiniteTransition.animateFloat(
            initialValue = 0.95f,
            targetValue = 1.05f,
            animationSpec = infiniteRepeatable(
                animation = tween(1200, easing = FastOutSlowInEasing),
                repeatMode = RepeatMode.Reverse
            ),
            label = "scale"
        )
    } else {
        remember { mutableStateOf(1.0f) }
    }

    Box(modifier = modifier.fillMaxSize()) {
        Canvas(modifier = Modifier.fillMaxSize()) {
            val canvasWidth = size.width
            val canvasHeight = size.height

            // Dimensions for the oval guide
            val ovalWidth = canvasWidth * 0.70f
            val ovalHeight = ovalWidth * 1.35f
            val centerX = canvasWidth / 2f
            val centerY = canvasHeight / 2f - (canvasHeight * 0.05f) // Slightly higher than center for screen balance

            // Create a path representing the full screen, and subtract the oval to darken outside area
            val ovalRect = Rect(
                centerX - (ovalWidth * pulseScale) / 2,
                centerY - (ovalHeight * pulseScale) / 2,
                centerX + (ovalWidth * pulseScale) / 2,
                centerY + (ovalHeight * pulseScale) / 2
            )

            val fullScreenPath = Path().apply {
                addRect(Rect(0f, 0f, canvasWidth, canvasHeight))
            }
            val ovalPath = Path().apply {
                addOval(ovalRect)
            }

            val cutoutPath = Path.combine(
                operation = PathOperation.Difference,
                path1 = fullScreenPath,
                path2 = ovalPath
            )

            // Draw darkened semi-transparent background
            drawPath(
                path = cutoutPath,
                color = Color.Black.copy(alpha = 0.65f)
            )

            // Draw highlighting teal border
            drawOval(
                color = ElectricTeal,
                topLeft = Offset(ovalRect.left, ovalRect.top),
                size = Size(ovalRect.width, ovalRect.height),
                style = Stroke(width = 3.dp.toPx(), cap = StrokeCap.Round)
            )

            // Draw guiding dotted accent circles or corners to denote precision scanning
            val cornerLength = 40f
            val strokeWidth = 5.dp.toPx()
            
            // Top Left bracket
            drawArc(
                color = ElectricTeal,
                startAngle = 180f,
                sweepAngle = 45f,
                useCenter = false,
                topLeft = Offset(ovalRect.left - 10f, ovalRect.top - 10f),
                size = Size(ovalRect.width + 20f, ovalRect.height + 20f),
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )
            // Top Right bracket
            drawArc(
                color = ElectricTeal,
                startAngle = 315f,
                sweepAngle = 45f,
                useCenter = false,
                topLeft = Offset(ovalRect.left - 10f, ovalRect.top - 10f),
                size = Size(ovalRect.width + 20f, ovalRect.height + 20f),
                style = Stroke(width = strokeWidth, cap = StrokeCap.Round)
            )
        }

        // Real-time instructional overlays
        Column(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = 200.dp)
                .fillMaxWidth()
                .padding(horizontal = 24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Box(
                modifier = Modifier
                    .background(Color.Black.copy(alpha = 0.8f), shape = RoundedCornerShape(12.dp))
                    .padding(horizontal = 20.dp, vertical = 12.dp)
            ) {
                Text(
                    text = feedbackText.uppercase(),
                    color = ElectricTeal,
                    fontSize = 14.sp,
                    fontFamily = SpaceGroteskFont,
                    fontWeight = FontWeight.Bold,
                    textAlign = TextAlign.Center,
                    letterSpacing = 1.sp
                )
            }
        }
    }
}
