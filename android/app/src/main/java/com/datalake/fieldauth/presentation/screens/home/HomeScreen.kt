package com.datalake.fieldauth.presentation.screens.home

import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.rounded.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.datalake.fieldauth.presentation.theme.*

data class ActivityItem(
    val id: String,
    val initials: String,
    val name: String,
    val timestamp: String,
    val isVerified: Boolean
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    enrolledCount: Int = 14,
    verifiedCount: Int = 42,
    pendingSyncCount: Int = 3,
    isSyncing: Boolean = false,
    isOffline: Boolean = true,
    recentActivities: List<ActivityItem> = listOf(
        ActivityItem("1", "JD", "John Doe", "10 mins ago", true),
        ActivityItem("2", "AM", "Abishek Miller", "1 hr ago", true),
        ActivityItem("3", "SK", "Sam Kamau", "2 hrs ago", false),
        ActivityItem("4", "EC", "Elena Cruz", "4 hrs ago", true)
    ),
    onNavigateToLiveness: () -> Unit,
    onNavigateToEnrollment: () -> Unit,
    modifier: Modifier = Modifier
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = "FIELD AUTH",
                        fontFamily = SpaceGroteskFont,
                        fontWeight = FontWeight.Bold,
                        color = OnSurfaceWhite
                    )
                },
                actions = {
                    // Sync Status Rotating Icon logic
                    val infiniteTransition = rememberInfiniteTransition(label = "syncRotation")
                    val rotationAngle by if (isSyncing) {
                        infiniteTransition.animateFloat(
                            initialValue = 0f,
                            targetValue = 360f,
                            animationSpec = infiniteRepeatable(
                                animation = tween(1500, easing = LinearEasing),
                                repeatMode = RepeatMode.Restart
                            ),
                            label = "rotate"
                        )
                    } else {
                        remember { mutableStateOf(0f) }
                    }

                    IconButton(onClick = {}) {
                        Icon(
                            imageVector = if (isOffline) Icons.Rounded.CloudOff else Icons.Rounded.Sync,
                            contentDescription = "Sync state",
                            tint = if (isOffline) StatusAmber else ElectricTeal,
                            modifier = Modifier.rotate(rotationAngle)
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = PrimaryNavy)
            )
        },
        bottomBar = {
            // Enterprise Offline Status footer banner
            Surface(
                modifier = Modifier.fillMaxWidth(),
                color = if (isOffline) StatusAmber.copy(alpha = 0.15f) else ElectricTeal.copy(alpha = 0.15f),
                border = BorderStroke(1.dp, if (isOffline) StatusAmber else ElectricTeal)
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 12.dp)
                        .navigationBarsPadding(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(10.dp)
                            .clip(CircleShape)
                            .background(if (isOffline) StatusAmber else ElectricTeal)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (isOffline) "FIELD TERMINAL OFFLINE - SECURED LOCAL DB" else "SYNCED & ONLINE - CLOUD INTEGRATED",
                        fontFamily = SpaceGroteskFont,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        color = if (isOffline) StatusAmber else ElectricTeal
                    )
                }
            }
        },
        containerColor = BackgroundDark,
        modifier = modifier
    ) { innerPadding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
                .padding(16.dp)
        ) {
            // Hero Analytics Indicators row
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                StatCard(
                    title = "Enrolled",
                    value = enrolledCount.toString(),
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Verified",
                    value = verifiedCount.toString(),
                    modifier = Modifier.weight(1f)
                )
                StatCard(
                    title = "Pending Sync",
                    value = pendingSyncCount.toString(),
                    valueColor = StatusAmber,
                    modifier = Modifier.weight(1f)
                )
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Action CTAs (One-handed oversized 56dp layout targets)
            Button(
                onClick = onNavigateToLiveness,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.buttonColors(containerColor = ElectricTeal),
                shape = RoundedCornerShape(28.dp),
                elevation = ButtonDefaults.buttonElevation(defaultElevation = 0.dp)
            ) {
                Icon(
                    imageVector = Icons.Rounded.QrCodeScanner,
                    contentDescription = "Scan icon",
                    tint = PrimaryNavy,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "AUTHENTICATE USER",
                    fontFamily = SpaceGroteskFont,
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = PrimaryNavy
                )
            }

            Spacer(modifier = Modifier.height(12.dp))

            OutlinedButton(
                onClick = onNavigateToEnrollment,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                colors = ButtonDefaults.outlinedButtonColors(contentColor = ElectricTeal),
                border = BorderStroke(1.dp, ElectricTeal),
                shape = RoundedCornerShape(28.dp)
            ) {
                Icon(
                    imageVector = Icons.Rounded.PersonAddAlt1,
                    contentDescription = "Enroll user",
                    tint = ElectricTeal,
                    modifier = Modifier.size(24.dp)
                )
                Spacer(modifier = Modifier.width(10.dp))
                Text(
                    text = "ENROLL NEW EMPLOYEE",
                    fontFamily = SpaceGroteskFont,
                    fontWeight = FontWeight.Bold,
                    fontSize = 15.sp,
                    color = ElectricTeal
                )
            }

            Spacer(modifier = Modifier.height(28.dp))

            // Recent Verification Activity feed
            Text(
                text = "RECENT BIO OPERATIONS",
                fontSize = 12.sp,
                fontFamily = SpaceGroteskFont,
                fontWeight = FontWeight.Bold,
                color = LightMutedText,
                letterSpacing = 1.sp
            )
            Spacer(modifier = Modifier.height(12.dp))

            LazyColumn(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(recentActivities, key = { it.id }) { item ->
                    ActivityRow(item = item)
                }
            }
        }
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    valueColor: Color = ElectricTeal
) {
    Card(
        modifier = modifier.border(1.dp, BorderGray, RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(
            modifier = Modifier.padding(14.dp),
            horizontalAlignment = Alignment.Start
        ) {
            Text(
                text = title.toUpperCase(),
                fontSize = 10.sp,
                fontFamily = SpaceGroteskFont,
                fontWeight = FontWeight.Bold,
                color = LightMutedText,
                letterSpacing = 0.5.sp
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = value,
                fontSize = 28.sp,
                fontFamily = SpaceGroteskFont,
                fontWeight = FontWeight.Bold,
                color = valueColor
            )
        }
    }
}

@Composable
fun ActivityRow(item: ActivityItem) {
    Card(
        modifier = Modifier.border(1.dp, BorderGray, RoundedCornerShape(12.dp)),
        colors = CardDefaults.cardColors(containerColor = SurfaceCard),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                // Circle initials avatar
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier
                        .size(40.dp)
                        .clip(CircleShape)
                        .background(MutedNavy)
                ) {
                    Text(
                        text = item.initials,
                        fontFamily = SpaceGroteskFont,
                        fontWeight = FontWeight.Bold,
                        color = ElectricTeal,
                        fontSize = 14.sp
                    )
                }
                Spacer(modifier = Modifier.width(14.dp))
                Column {
                    Text(
                        text = item.name,
                        fontFamily = SpaceGroteskFont,
                        fontWeight = FontWeight.Medium,
                        color = OnSurfaceWhite,
                        fontSize = 15.sp
                    )
                    Spacer(modifier = Modifier.height(2.dp))
                    Text(
                        text = item.timestamp,
                        fontFamily = DMSansFont,
                        color = LightMutedText,
                        fontSize = 12.sp
                    )
                }
            }

            // Results badge status chip
            Surface(
                color = if (item.isVerified) ElectricTeal.copy(alpha = 0.15f) else StatusCrimson.copy(alpha = 0.15f),
                shape = RoundedCornerShape(8.dp),
                border = BorderStroke(1.dp, if (item.isVerified) ElectricTeal else StatusCrimson)
            ) {
                Text(
                    text = if (item.isVerified) "VERIFIED" else "FAILED",
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    fontFamily = SpaceGroteskFont,
                    fontWeight = FontWeight.Bold,
                    fontSize = 10.sp,
                    color = if (item.isVerified) ElectricTeal else StatusCrimson
                )
            }
        }
    }
}
