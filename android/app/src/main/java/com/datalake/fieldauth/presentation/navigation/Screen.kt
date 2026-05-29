package com.datalake.fieldauth.presentation.navigation

sealed class Screen(val route: String) {
    object Splash : Screen("splash_screen")
    object Home : Screen("home_screen")
    object Authentication : Screen("auth_screen")
    object Enrollment : Screen("enrollment_screen")
    object AttendanceRecords : Screen("attendance_records_screen")
    object Settings : Screen("settings_screen")
    object SyncStatus : Screen("sync_status_screen")
}
