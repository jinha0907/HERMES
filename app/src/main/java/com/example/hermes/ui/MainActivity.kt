package com.example.hermes.ui

import android.annotation.SuppressLint
import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.util.Log
import android.view.View
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.hermes.R
import com.example.hermes.net.MqttClient
import com.example.hermes.net.NetworkScanner
import kotlinx.coroutines.launch

enum class ConnectionState {
    DISCONNECTED, SCANNING, CONNECTED
}

class MainActivity : AppCompatActivity() {

    private lateinit var imgState: ImageView
    private lateinit var btnManual: Button
    private lateinit var btnConnect: Button
    private lateinit var btnOpenPermission: Button
    private lateinit var etHost: EditText
    private lateinit var etUser: EditText
    private lateinit var etPass: EditText
    private lateinit var tvStatus: TextView
    private lateinit var manualLayout: LinearLayout

    private var connState = ConnectionState.DISCONNECTED

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        // UI 요소 연결
        imgState = findViewById(R.id.imgState)
        btnManual = findViewById(R.id.btnManual)
        btnConnect = findViewById(R.id.btnConnect)
        btnOpenPermission = findViewById(R.id.btnOpenPermission)
        etHost = findViewById(R.id.etHost)
        etUser = findViewById(R.id.etUser)
        etPass = findViewById(R.id.etPass)
        tvStatus = findViewById(R.id.tvStatus)
        manualLayout = findViewById(R.id.manualLayout)

        updateConnectionUi(ConnectionState.DISCONNECTED)

        // 중앙 큰 버튼 클릭 → 자동 연결 / 연결 해제
        imgState.setOnClickListener {
            when (connState) {
                ConnectionState.DISCONNECTED -> startAutoConnect()
                ConnectionState.CONNECTED -> disconnect()
                ConnectionState.SCANNING -> {} // 탐색 중엔 클릭 무시
            }
        }

        // 수동 연결 열기
        btnManual.setOnClickListener {
            manualLayout.visibility =
                if (manualLayout.visibility == View.GONE) View.VISIBLE else View.GONE
        }

        // 수동 연결 실행
        btnConnect.setOnClickListener {
            val host = etHost.text.toString().trim()
            val user = etUser.text.toString().ifBlank { null }
            val pass = etPass.text.toString().ifBlank { null }

            if (host.isBlank()) {
                Toast.makeText(this, "MQTT 주소를 입력하세요.", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            MqttClient.configure(host, user, pass)
            MqttClient.ensureConnected(this)
            updateConnectionUi(ConnectionState.CONNECTED)
        }

        // 알림 접근 권한 열기
        btnOpenPermission.setOnClickListener {
            openNotificationAccessSettings(this)
        }
    }

    /** 알림 접근 권한 설정 화면 열기 */
    private fun openNotificationAccessSettings(activity: Activity) {
        try {
            val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK
            startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(activity, "설정 화면을 열 수 없습니다.", Toast.LENGTH_SHORT).show()
        }
    }

    /** 자동 연결 시작 */
    private fun startAutoConnect() {
        lifecycleScope.launch {
            updateConnectionUi(ConnectionState.SCANNING)
            try {
                val candidates = NetworkScanner.scanSubnet(this@MainActivity)
                if (candidates.isNotEmpty()) {
                    // ✅ 후보 리스트 표시
                    showDeviceSelectionDialog(candidates)
                } else {
                    updateConnectionUi(ConnectionState.DISCONNECTED)
                    manualLayout.visibility = View.VISIBLE
                    Toast.makeText(
                        this@MainActivity,
                        "탐색 실패 — 수동 연결을 시도하세요.",
                        Toast.LENGTH_SHORT
                    ).show()
                }
            } catch (t: Throwable) {
                Log.e("Hermes", "AutoConnect Error", t)
                updateConnectionUi(ConnectionState.DISCONNECTED)
                manualLayout.visibility = View.VISIBLE
                Toast.makeText(
                    this@MainActivity,
                    "오류 발생: ${t.localizedMessage}",
                    Toast.LENGTH_LONG
                ).show()
            }
        }
    }

    /** 후보 장치 선택 다이얼로그 */
    private fun showDeviceSelectionDialog(candidates: List<String>) {
        val context = this@MainActivity

        // AlertDialog 리스트 구성
        val builder = android.app.AlertDialog.Builder(context)
        builder.setTitle("연결 가능한 장치 선택")
        builder.setItems(candidates.toTypedArray()) { dialog, which ->
            val selectedHost = candidates[which]
            val uri = "tcp://$selectedHost:1883"

            Log.i("Hermes", "사용자 선택: $uri")

            lifecycleScope.launch {
                try {
                    MqttClient.configure(uri, null, null)
                    MqttClient.ensureConnected(context)
                    updateConnectionUi(ConnectionState.CONNECTED)
                    Toast.makeText(context, "월패드 연결 성공: $selectedHost", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    Log.e("Hermes", "연결 실패: $selectedHost", e)
                    updateConnectionUi(ConnectionState.DISCONNECTED)
                    Toast.makeText(context, "연결 실패: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                }
            }

            dialog.dismiss()
        }

        builder.setNegativeButton("취소") { dialog, _ ->
            dialog.dismiss()
            updateConnectionUi(ConnectionState.DISCONNECTED)
        }

        updateConnectionUi(ConnectionState.DISCONNECTED)
        builder.show()
    }

    /** MQTT 연결 해제 */
    private fun disconnect() {
        try {
            MqttClient.disconnect()
            Toast.makeText(this, "연결이 해제되었습니다.", Toast.LENGTH_SHORT).show()
        } catch (t: Throwable) {
            Log.w("Hermes", "Disconnect failed", t)
        } finally {
            updateConnectionUi(ConnectionState.DISCONNECTED)
        }
    }

    /** 상태에 따른 UI 업데이트 */
    @SuppressLint("SetTextI18n")
    private fun updateConnectionUi(state: ConnectionState) {
        connState = state
        when (state) {
            ConnectionState.DISCONNECTED -> {
                imgState.setImageResource(R.drawable.ic_cross_circle)
                tvStatus.text = "연결되지 않음"
                manualLayout.visibility = View.GONE
            }

            ConnectionState.SCANNING -> {
                imgState.setImageResource(R.drawable.ic_cross_circle)
                tvStatus.text = "연결 장치 탐색 중..."
                manualLayout.visibility = View.GONE
            }

            ConnectionState.CONNECTED -> {
                imgState.setImageResource(R.drawable.ic_check_circle)
                tvStatus.text = "연결 완료!"
                manualLayout.visibility = View.GONE
            }
        }
    }
}
