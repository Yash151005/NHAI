package com.datalake.fieldauth.presentation.navigation

import androidx.compose.animation.AnimatedContentTransitionScope
import androidx.compose.animation.core.tween
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import com.datalake.fieldauth.presentation.screens.auth.AuthenticationScreen
import com.datalake.fieldauth.presentation.screens.auth.AuthenticationViewModel
import com.datalake.fieldauth.presentation.screens.home.HomeScreen

@Composable
fun AppNavGraph(
    navController: NavHostController,
    authViewModel: AuthenticationViewModel, // Hilt injected generally
    modifier: Modifier = Modifier
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route, // Change to Splash if Splash screen timer runs first
        modifier = modifier
    ) {
        // Home Screen with slide animations
        composable(
            route = Screen.Home.route,
            enterTransition = {
                slideIntoContainer(
                    AnimatedContentTransitionScope.SlideDirection.Left,
                    animationSpec = tween(400)
                )
            },
            exitTransition = {
                slideOutOfContainer(
                    AnimatedContentTransitionScope.SlideDirection.Left,
                    animationSpec = tween(400)
                )
            }
        ) {
            HomeScreen(
                onNavigateToLiveness = {
                    navController.navigate(Screen.Authentication.route)
                },
                onNavigateToEnrollment = {
                    // Navigate to enrollment route when called
                }
            )
        }

        // Authentication Screen mapping critical biometric processing loop
        composable(
            route = Screen.Authentication.route,
            enterTransition = {
                slideIntoContainer(
                    AnimatedContentTransitionScope.SlideDirection.Up,
                    animationSpec = tween(400)
                )
            },
            exitTransition = {
                slideOutOfContainer(
                    AnimatedContentTransitionScope.SlideDirection.Down,
                    animationSpec = tween(400)
                )
            }
        ) {
            AuthenticationScreen(
                viewModel = authViewModel,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
