package com.datalake.fieldauth.presentation.screens.auth

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
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class AuthUiState(
    val challengeType: LivenessChallengeType = LivenessChallengeType.DETECTING_FACE,
    val secondsRemaining: Int = 5,
    val timerProgress: Float = 1.0f,
    val feedbackText: String = "Position face inside oval",
    val isPulsing: Boolean = true,
    val verificationResult: VerificationResult? = null,
    val errorMessage: String? = null,
    val attemptsRemaining: Int = 3
)

class AuthenticationViewModel(
    private val verifyFaceUseCase: VerifyFaceUseCase
) : ViewModel() {

    private val _uiState = MutableStateFlow(AuthUiState())
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    private var countdownJob: Job? = null
    private val challengeTimeoutSeconds = 5

    init {
        startChallengeTimer()
    }

    /**
     * Called when analyzer detects a state change (e.g., eye blink succeeded)
     */
    fun onChallengeStepPassed(nextStep: LivenessChallengeType) {
        countdownJob?.cancel()
        _uiState.update { currentState ->
            currentState.copy(
                challengeType = nextStep,
                secondsRemaining = challengeTimeoutSeconds,
                timerProgress = 1.0f,
                feedbackText = getInstructionTextForState(nextStep)
            )
        }
        if (nextStep != LivenessChallengeType.MATCHING && 
            nextStep != LivenessChallengeType.SUCCESS && 
            nextStep != LivenessChallengeType.FAILED) {
            startChallengeTimer()
        }
    }

    /**
     * Executes facial matching once liveness verification completes successfully
     */
    fun runBiometricMatching(finalFrame: Bitmap) {
        onChallengeStepPassed(LivenessChallengeType.MATCHING)
        viewModelScope.launch {
            try {
                // Run full detect -> embed -> comparison algorithms
                val result = verifyFaceUseCase.execute(
                    cameraFrame = finalFrame,
                    mockLatitude = -1.2921, // remote field coordination mapping
                    mockLongitude = 36.8219
                )

                if (result.isMatched) {
                    _uiState.update {
                        it.copy(
                            challengeType = LivenessChallengeType.SUCCESS,
                            verificationResult = result,
                            feedbackText = "Verification Complete"
                        )
                    }
                } else {
                    handleFailureAttempt("Identity mismatch")
                }
            } catch (e: Exception) {
                handleFailureAttempt("Computation error: ${e.localizedMessage}")
            }
        }
    }

    private fun handleFailureAttempt(reason: String) {
        val remaining = _uiState.value.attemptsRemaining - 1
        _uiState.update {
            it.copy(
                attemptsRemaining = remaining,
                feedbackText = "$reason! Try Again."
            )
        }

        if (remaining <= 0) {
            _uiState.update {
                it.copy(
                    challengeType = LivenessChallengeType.FAILED,
                    feedbackText = "Authentication Failed. Contact Supervisor."
                )
            }
        } else {
            // Restart challenges
            onChallengeStepPassed(LivenessChallengeType.DETECTING_FACE)
        }
    }

    private fun startChallengeTimer() {
        countdownJob?.cancel()
        countdownJob = viewModelScope.launch {
            val totalTicks = challengeTimeoutSeconds * 10
            for (tick in totalTicks downTo 0) {
                delay(100) // tick every 100ms for fluid progress updates
                val seconds = (tick + 9) / 10
                val progress = tick.toFloat() / totalTicks.toFloat()

                _uiState.update {
                    it.copy(
                        secondsRemaining = seconds,
                        timerProgress = progress
                    )
                }
            }
            // If timer expires before challenge action is completed
            handleChallengeTimeout()
        }
    }

    private fun handleChallengeTimeout() {
        handleFailureAttempt("Challenge Timed Out")
    }

    private fun getInstructionTextForState(state: LivenessChallengeType): String {
        return when (state) {
            LivenessChallengeType.IDLE -> "Press START scanning"
            LivenessChallengeType.DETECTING_FACE -> "Align your face in the oval guide"
            LivenessChallengeType.BLINK -> "BLINK multi-times naturally"
            LivenessChallengeType.SMILE -> "SMILE showing dental metrics"
            LivenessChallengeType.TURN_LEFT -> "Look slowly to the LEFT"
            LivenessChallengeType.MATCHING -> "Comparing signatures against device keys"
            LivenessChallengeType.SUCCESS -> "AUTHENTICATION GRANTED"
            LivenessChallengeType.FAILED -> "DENIED — CONTACT SUPERVISOR"
        }
    }

    fun resetState() {
        countdownJob?.cancel()
        _uiState.update {
            AuthUiState(
                challengeType = LivenessChallengeType.DETECTING_FACE,
                attemptsRemaining = 3
            )
        }
        startChallengeTimer()
    }

    override fun onCleared() {
        super.onCleared()
        countdownJob?.cancel()
    }
}
