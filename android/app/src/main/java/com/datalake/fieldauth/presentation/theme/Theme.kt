package com.datalake.fieldauth.presentation.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import com.google.accompanist.systemuicontroller.rememberSystemUiController

private val DarkColorScheme = darkColorScheme(
    primary = PrimaryNavy,
    onPrimary = OnSurfaceWhite,
    secondary = ElectricTeal,
    onSecondary = PrimaryNavy,
    background = BackgroundDark,
    onBackground = OnSurfaceWhite,
    surface = SurfaceCard,
    onSurface = OnSurfaceWhite,
    error = StatusCrimson,
    onError = OnSurfaceWhite,
    outline = BorderGray
)

private val LightColorScheme = lightColorScheme(
    primary = PrimaryNavy,
    onPrimary = OnSurfaceWhite,
    secondary = ElectricTeal,
    onSecondary = PrimaryNavy,
    background = Color.White,
    onBackground = PrimaryNavy,
    surface = Color(0xFFF4F6F9),
    onSurface = PrimaryNavy,
    error = StatusCrimson,
    onError = OnSurfaceWhite,
    outline = Color(0xFFD2D7DF)
)

@Composable
fun FieldAuthTheme(
    darkTheme: Boolean = isSystemInDarkTheme(), // Always default to system theme or can force dark theme for outdoor high-contrast
    content: @Composable () -> Unit
) {
    // We enforce DarkColorScheme mostly because of high-contrast requirements for outdoor harsh sunlight
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val systemUiController = rememberSystemUiController()

    SideEffect {
        systemUiController.setSystemBarsColor(
            color = colorScheme.background,
            darkIcons = !darkTheme
        )
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = AppTypography,
        shapes = AppShapes,
        content = content
    )
}
