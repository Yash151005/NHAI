package com.datalake.fieldauth.data.remote

import android.content.Context
import android.net.ConnectivityManager
import android.net.Network
import android.net.NetworkCapabilities
import android.net.NetworkRequest
import com.datalake.fieldauth.data.local.db.AttendanceDao
import com.datalake.fieldauth.data.local.db.AttendanceRecordEntity
import com.datalake.fieldauth.data.local.datastore.UserPreferencesDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.moshi.MoshiConverterFactory
import retrofit2.http.Body
import retrofit2.http.POST
import java.util.Date

// Retrofit API Definition
interface SyncApiService {
    @POST("sync/attendance")
    suspend fun uploadRecords(@Body records: List<AttendancePayload>): SyncResponse
}

data class AttendancePayload(
    val id: Int,
    val employeeId: String,
    val employeeName: String,
    val timestamp: Long,
    val latitude: Double,
    val longitude: Double,
    val confidence: Float
)

data class SyncResponse(
    val status: String,
    val successfullyUploadedIds: List<Int>,
    val error: String? = null
)

class SyncManager(
    private val context: Context,
    private val attendanceDao: AttendanceDao,
    private val preferencesDataStore: UserPreferencesDataStore
) {
    private val connectivityManager =
        context.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager

    private val _isOnline = MutableStateFlow(false)
    val isOnline: StateFlow<Boolean> = _isOnline.asStateFlow()

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    private val coroutineScope = CoroutineScope(Dispatchers.IO)

    init {
        monitorNetwork()
    }

    private fun monitorNetwork() {
        val networkRequest = NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build()

        _isOnline.value = isCurrentlyConnected()

        connectivityManager.registerNetworkCallback(
            networkRequest,
            object : ConnectivityManager.NetworkCallback() {
                override fun onAvailable(network: Network) {
                    _isOnline.value = true
                    // Automatically trigger background synchronization upon reconnect!
                    coroutineScope.launch {
                        triggerSync()
                    }
                }

                override fun onLost(network: Network) {
                    _isOnline.value = false
                }
            }
        )
    }

    private fun isCurrentlyConnected(): Boolean {
        val network = connectivityManager.activeNetwork ?: return false
        val capabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    }

    /**
     * Executes cloud synchronization of offline logged records.
     */
    suspend fun triggerSync(): Boolean {
        if (!isCurrentlyConnected() || _isSyncing.value) return false
        _isSyncing.value = true

        try {
            // Retrieve unsynced records from secure Room DB SQLite tuples
            val unsyncedEntities = attendanceDao.getUnsyncedRecords()
            if (unsyncedEntities.isEmpty()) {
                _isSyncing.value = false
                return true
            }

            // Create payload items
            val payload = unsyncedEntities.map {
                AttendancePayload(
                    id = it.id,
                    employeeId = it.employeeId,
                    employeeName = it.employeeName,
                    timestamp = it.timestamp,
                    latitude = it.latitude,
                    longitude = it.longitude,
                    confidence = it.confidence
                )
            }

            // Build dynamic Retrofit mapping endpoints saved in DataStore
            val awsEndpoint = preferencesDataStore.awsSyncEndpoint.first()
            val cleanBaseUrl = ensureBaseUrlFormat(awsEndpoint)

            val retrofit = Retrofit.Builder()
                .baseUrl(cleanBaseUrl)
                .addConverterFactory(MoshiConverterFactory.create())
                .build()

            val syncService = retrofit.create(SyncApiService::class.java)

            // Submit network transaction
            val response = syncService.uploadRecords(payload)
            if (response.status == "SUCCESS") {
                val successfulIds = response.successfullyUploadedIds
                val currentTime = Date().time

                // Update database status flag, flagging synced records
                for (id in successfulIds) {
                    attendanceDao.markAsSynced(id, currentTime)
                }

                // Auto-purge items that are synced and older than 7 days (enterprise storage retention)
                val sevenDaysInMs = 7L * 24 * 60 * 60 * 1000
                val limit = currentTime - sevenDaysInMs
                attendanceDao.purgeSyncedRecords(limit)
                
                _isSyncing.value = false
                return true
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }

        _isSyncing.value = false
        return false
    }

    private fun ensureBaseUrlFormat(url: String): String {
        var base = url
        if (!base.startsWith("http://") && !base.startsWith("https://")) {
            base = "https://$base"
        }
        if (!base.endsWith("/")) {
            base = "$base/"
        }
        return base
    }
}
