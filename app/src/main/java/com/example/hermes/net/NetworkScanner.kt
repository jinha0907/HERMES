package com.example.hermes.net

import android.content.Context
import android.net.wifi.WifiManager
import android.util.Log
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.withContext
import java.io.IOException
import java.net.InetAddress
import java.net.InetSocketAddress
import java.net.Socket
import kotlin.math.min


object NetworkScanner {
    private const val TAG = "Hermes-NetScan"

    /** 기본 MQTT 포트 */
    private const val DEFAULT_MQTT_PORT = 1883

    /** Wi-Fi IP -> prefix (ex "192.168.0.") 반환, 실패시 null */
    private fun getLocalPrefix(ctx: Context): String? {
        try {
            val wifiManager = ctx.applicationContext.getSystemService(Context.WIFI_SERVICE) as WifiManager
            val ipInt = wifiManager.connectionInfo.ipAddress
            if (ipInt == 0) return null
            // ipInt is little-endian
            val ip = listOf(
                (ipInt and 0xFF),
                ((ipInt shr 8) and 0xFF),
                ((ipInt shr 16) and 0xFF),
                ((ipInt shr 24) and 0xFF)
            ).joinToString(".") { it.toString() }
            return ip.substringBeforeLast(".") + "."
        } catch (t: Throwable) {
            Log.w(TAG, "getLocalPrefix failed", t)
            return null
        }
    }

    /** 단일 호스트에 대해 reachability 검사 (timeoutMs). 일부 환경에서는 ICMP 차단될 수 있음 */
    private suspend fun hostReachable(host: String, timeoutMs: Int = 200): Boolean =
        withContext(Dispatchers.IO) {
            return@withContext try {
                val addr = InetAddress.getByName(host)
                addr.isReachable(timeoutMs)
            } catch (t: Throwable) {
                false
            }
        }

    /** 단일 호스트에 대해 TCP 포트가 열려있는지 검사 */
    private suspend fun isTcpPortOpen(host: String, port: Int = DEFAULT_MQTT_PORT, timeoutMs: Int = 300): Boolean =
        withContext(Dispatchers.IO) {
            try {
                Socket().use { socket ->
                    socket.connect(InetSocketAddress(host, port), timeoutMs)
                    true
                }
            } catch (e: IOException) {
                false
            } catch (t: Throwable) {
                false
            }
        }

    /**
     * 서브넷 스캔 (병렬)
     * - timeoutReachable: isReachable 타임아웃(ms)
     * - timeoutPort: TCP connect 타임아웃(ms)
     * - maxConcurrency: 검사 동시수 상한 (기기 안정성을 위해)
     *
     * 반환: 포트(1883)가 열려 있는 IP 주소 목록 (정렬: 빠르게 발견된 순)
     */
    suspend fun scanSubnet(
        ctx: Context,
        timeoutReachable: Int = 200,
        timeoutPort: Int = 300,
        maxConcurrency: Int = 64
    ): List<String> = withContext(Dispatchers.IO) {
        val prefix = getLocalPrefix(ctx) ?: return@withContext emptyList()
        Log.i(TAG, "Local prefix detected: $prefix")

        // Generate targets 1..254
        val hosts = (1..254).map { prefix + it }

        // To avoid creating too many coroutines/FDs at once, chunk by maxConcurrency
        val results = mutableListOf<String>()
        val chunkSize = min(maxConcurrency, hosts.size)

        hosts.chunked(chunkSize).forEach { chunk ->
            // Launch all checks for this chunk in parallel
            val deferred = chunk.map { host ->
                async {
                    // First try reachable (fast), if false we still may try port (some networks block ICMP)
                    val r = try { hostReachable(host, timeoutReachable) } catch (t: Throwable) { false }
                    if (r) {
                        val portOpen = try { isTcpPortOpen(host, DEFAULT_MQTT_PORT, timeoutPort) } catch (t: Throwable) { false }
                        if (portOpen) {
                            Log.i(TAG, "Candidate (reachable+port): $host")
                            host
                        } else null
                    } else {
                        // Fallback: sometimes isReachable false but port may be open (ICMP blocked) -> try direct port check
                        val portOpenFallback = try { isTcpPortOpen(host, DEFAULT_MQTT_PORT, timeoutPort) } catch (t: Throwable) { false }
                        if (portOpenFallback) {
                            Log.i(TAG, "Candidate (port-only): $host")
                            host
                        } else null
                    }
                }
            }
            // wait chunk
            val chunkRes = deferred.awaitAll().filterNotNull()
            results.addAll(chunkRes)
            // If you want early exit on first found, uncomment:
            // if (results.isNotEmpty()) return@withContext results
        }

        // Return unique list
        results.distinct()
    }
}
