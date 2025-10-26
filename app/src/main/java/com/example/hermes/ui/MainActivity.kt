package com.example.hermes.ui

import android.annotation.SuppressLint
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.util.Log
import android.widget.Button
import android.widget.EditText
import android.widget.TextView
import android.widget.Toast
import androidx.activity.ComponentActivity
import com.example.hermes.R
import com.example.hermes.net.MqttClient
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import com.example.hermes.net.MqttClient.ConnState
//import java.time.temporal.TemporalQuery


class MainActivity : ComponentActivity() {

    private lateinit var hostEt: EditText
    private lateinit var userEt: EditText
    private lateinit var passEt: EditText
    private lateinit var openPermBtn: Button
    private lateinit var connectBtn: Button

    private lateinit var tvStatus: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        hostEt = findViewById(R.id.etHost)
        userEt = findViewById(R.id.etUser)
        passEt = findViewById(R.id.etPass)
        openPermBtn = findViewById(R.id.btnOpenPermission)
        connectBtn = findViewById(R.id.btnConnect)
        tvStatus  = findViewById(R.id.tvStatus)


        lifecycleScope.launch {
            MqttClient.state.collectLatest { st ->
                when (st) {
                    ConnState.IDLE -> {
                        connectBtn.isEnabled = true
                        connectBtn.text = "연결"
                        tvStatus.text = "대기"
                    }
                    ConnState.CONNECTING -> {
                        connectBtn.isEnabled = false
                        connectBtn.text = "연결 중…"
                        tvStatus.text = "브로커에 연결 시도 중"
                    }
                    ConnState.CONNECTED -> {
                        connectBtn.isEnabled = true
                        connectBtn.text = "연결됨"
                        tvStatus.text = "연결 완료"
                    }
                    ConnState.LOST -> {
                        connectBtn.isEnabled = true
                        connectBtn.text = "재연결"
                        tvStatus.text = "연결 끊김 — 자동 재연결 대기"
                    }
                    ConnState.FAILED -> {
                        connectBtn.isEnabled = true
                        connectBtn.text = "재시도"
                        tvStatus.text = "연결 실패"
                    }
                }
            }
        }

        // 알림 접근 설정 화면 열기
        openPermBtn.setOnClickListener {
            startActivity(Intent("android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS"))
        }

        connectBtn.setOnClickListener {
            val raw = hostEt.text.toString().trim()
            val user = userEt.text.toString().trim().ifEmpty { null }
            val pass = passEt.text.toString().trim().ifEmpty { null }

            if (raw.isEmpty()) {
                Toast.makeText(this, "MQTT 주소 입력 (예: tcp://<PC IP>:1883)", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // URI 형식 검증: scheme(tcp|ssl), host, port 필수
            val uri = runCatching { Uri.parse(raw) }.getOrNull()
            val schemeOk = uri?.scheme in setOf("tcp", "ssl")
            val hostOk = !uri?.host.isNullOrBlank()
            val portOk = (uri?.port ?: -1) > 0
            if (!schemeOk || !hostOk || !portOk) {
                Toast.makeText(
                    this,
                    "잘못된 브로커 주소 형식입니다.\n예: tcp://192.168.0.23:1883 또는 ssl://example.com:8883",
                    Toast.LENGTH_LONG
                ).show()
                return@setOnClickListener
            }

            // 예외 가드: 어떤 예외도 앱을 죽이지 않게
            try {
                MqttClient.configure(raw, user, pass)
                MqttClient.ensureConnected(this) // 내부도 예외 가드 적용 필요
                Toast.makeText(this, "MQTT 연결 시도중…", Toast.LENGTH_SHORT).show()
            } catch (t: Throwable) {
                Log.e("Hermes", "연결 시도 중 예외(UI)", t)
                Toast.makeText(this, "연결 실패: ${t.javaClass.simpleName}", Toast.LENGTH_LONG).show()
            }
        }
    }
}
