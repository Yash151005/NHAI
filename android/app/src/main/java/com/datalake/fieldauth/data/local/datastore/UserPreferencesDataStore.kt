package com.datalake.fieldauth.data.local.datastore

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.*
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map
import java.io.IOException

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "field_auth_preferences")

class UserPreferencesDataStore(private val context: Context) {

    companion object {
        // Preference Keys
        val RECOGNITION_THRESHOLD = floatPreferencesKey("recognition_threshold")
        val LIVENESS_BLINK_ENABLED = booleanPreferencesKey("liveness_blink_enabled")
        val LIVENESS_SMILE_ENABLED = booleanPreferencesKey("liveness_smile_enabled")
        val LIVENESS_HEAD_TURN_ENABLED = booleanPreferencesKey("liveness_head_turn_enabled")
        val AWS_SYNC_ENDPOINT = stringPreferencesKey("aws_sync_endpoint")
        val SYSTEM_PASSPHRASE = stringPreferencesKey("system_passphrase")
    }

    // Default configuration mappings
    val recognitionThreshold: Flow<Float> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }.map { preferences -> preferences[RECOGNITION_THRESHOLD] ?: 0.80f }

    val isBlinkEnabled: Flow<Boolean> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }.map { preferences -> preferences[LIVENESS_BLINK_ENABLED] ?: true }

    val isSmileEnabled: Flow<Boolean> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }.map { preferences -> preferences[LIVENESS_SMILE_ENABLED] ?: true }

    val isHeadTurnEnabled: Flow<Boolean> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }.map { preferences -> preferences[LIVENESS_HEAD_TURN_ENABLED] ?: true }

    val awsSyncEndpoint: Flow<String> = context.dataStore.data
        .catch { exception ->
            if (exception is IOException) emit(emptyPreferences()) else throw exception
        }.map { preferences -> preferences[AWS_SYNC_ENDPOINT] ?: "https://api.datalake3.aws/sync" }

    suspend fun setRecognitionThreshold(threshold: Float) {
        context.dataStore.edit { preferences ->
            preferences[RECOGNITION_THRESHOLD] = threshold
        }
    }

    suspend fun setBlinkEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[LIVENESS_BLINK_ENABLED] = enabled
        }
    }

    suspend fun setSmileEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[LIVENESS_SMILE_ENABLED] = enabled
        }
    }

    suspend fun setHeadTurnEnabled(enabled: Boolean) {
        context.dataStore.edit { preferences ->
            preferences[LIVENESS_HEAD_TURN_ENABLED] = enabled
        }
    }

    suspend fun setAwsSyncEndpoint(endpoint: String) {
        context.dataStore.edit { preferences ->
            preferences[AWS_SYNC_ENDPOINT] = endpoint
        }
    }

    suspend fun clearPreferences() {
        context.dataStore.edit { preferences ->
            preferences.clear()
        }
    }
}
