package com.example.hermes.net

import android.content.Context
import android.util.Log
//import org.eclipse.paho:org.eclipse.paho.client.MqttAndroidClient
import info.mqtt.android.service.MqttAndroidClient
import org.eclipse.paho.client.mqttv3.*
import org.json.JSONObject
import java.util.concurrent.ConcurrentLinkedQueue
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

object MqttClient {

    enum class ConnState {IDLE, CONNECTING, CONNECTED, LOST, FAILED }

    private val _state = MutableStateFlow(ConnState.IDLE)
    private const val TAG = "Hermes"

    private var serverUri: String = "tcp://192.168.1.132:1883"
    private var username: String? = null
    private var mqttPassword: String? = null

    private const val CLIENT_ID = "hermes-android"
    private lateinit var client: MqttAndroidClient
    private val queue = ConcurrentLinkedQueue<Pair<String, String>>()
    val state: StateFlow<ConnState> = _state
    fun configure(uri: String, user: String?, pass: String?) {
        serverUri = uri
        username = user
        mqttPassword = pass
    }

    fun ensureConnected(ctx: Context) {
        try {
            if (::client.isInitialized && client.isConnected) {
                _state.value = ConnState.CONNECTED
                return
            }
            _state.value = ConnState.CONNECTING

            Log.i(TAG, "ensureConnected(): uri=$serverUri, user=${username != null}")

            client = MqttAndroidClient(ctx.applicationContext, serverUri, CLIENT_ID)

            val opts = MqttConnectOptions().apply {
                isAutomaticReconnect = true
                isCleanSession = false
                username?.let { userName = it }
                mqttPassword?.let { pwd -> setPassword(pwd.toCharArray()) }
            }

            client.setCallback(object : MqttCallbackExtended {
                override fun connectComplete(reconnect: Boolean, serverURI: String?) {
                    _state.value = ConnState.CONNECTED
                    Log.i(TAG, "MQTT connected: $serverURI (reconnect=$reconnect)")
                    flush()
                }
                override fun connectionLost(cause: Throwable?) {
                    _state.value = ConnState.LOST
                    Log.w(TAG, "MQTT connection lost", cause)
                }
                override fun messageArrived(topic: String?, message: MqttMessage?) { /* no-op */ }
                override fun deliveryComplete(token: IMqttDeliveryToken?) { /* no-op */ }
            })

            client.connect(opts, null, object : IMqttActionListener {
                override fun onSuccess(asyncActionToken: IMqttToken?) {
                    _state.value = ConnState.CONNECTED
                    Log.i(TAG, "connect() success")
                    flush()
                }
                override fun onFailure(asyncActionToken: IMqttToken?, exception: Throwable?) {
                    _state.value = ConnState.FAILED
                    Log.e(TAG, "connect() failed", exception)
                }
            })
        } catch (t: Throwable) {
            _state.value = ConnState.FAILED
            Log.e(TAG, "ensureConnected() fatal", t)  // ← 크래시 방지
        }
    }

    fun publishJson(topic: String, json: JSONObject) {
        val payload = json.toString()
        val connected = (::client.isInitialized && client.isConnected)
        Log.i(TAG, "PUBLISH request topic=$topic connected=$connected json=$$payload")



        if (!::client.isInitialized || !client.isConnected) {
            queue.offer(topic to payload)
            return
        }
        val msg = MqttMessage(payload.toByteArray()).apply { qos = 1; isRetained = false }
        try {
            client.publish(topic, msg)
            Log.i(TAG, "publish() called topic=$topic bytes=${msg.payload?.size ?: 0}")
        } catch (e: Exception) {
            Log.e(TAG, "publish error", e)
            queue.offer(topic to payload)
        }
    }

    private fun flush() {
        while (::client.isInitialized && client.isConnected) {
            val pair = queue.poll() ?: break
            val msg = MqttMessage(pair.second.toByteArray()).apply { qos = 1; isRetained = false }
            try {
                client.publish(pair.first, msg)
                Log.i(TAG, "flush publish topic=${pair.first} bytes=${msg.payload?.size ?: 0}")
            } catch (e: Exception) {
                Log.e(TAG, "flush publish error", e)
                queue.offer(pair)
                break
            }
        }
    }
}
