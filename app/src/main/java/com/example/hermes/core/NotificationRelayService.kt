package com.example.hermes.core

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.example.hermes.net.MqttClient
import com.example.hermes.util.Masking
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant

class NotificationRelayService : NotificationListenerService() {

    override fun onListenerConnected() {
        super.onListenerConnected()
        Log.i("Hermes", "Notification listener connected")
        // 연결은 MainActivity에서 트리거하지만,
        // 서비스만 켜진 상태에서도 publish 큐가 동작하도록 설계됨(MqttClient 내부 큐)
    }

    override fun onNotificationPosted(sbn: StatusBarNotification) {
        val n: Notification = sbn.notification ?: return
        val extras = n.extras

        val pkg = sbn.packageName ?: "unknown"
        val title = (extras.getCharSequence(Notification.EXTRA_TITLE) ?: "").toString()
        val text = (
                extras.getCharSequence(Notification.EXTRA_TEXT)
                    ?: extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT)
                    ?: ""
                ).toString()

        val lines = mutableListOf<String>()
        extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.forEach {
            lines += it?.toString().orEmpty()
        }
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString().orEmpty()
        if (bigText.isNotBlank()) lines += bigText

        val payload = JSONObject().apply {
            put("app_package", pkg)
            put("title", Masking.mask(title))
            put("text", Masking.mask(text))
            put("lines", JSONArray(lines.map { Masking.mask(it) }))
            put("posted_at_utc", Instant.ofEpochMilli(sbn.postTime).toString())
        }

        Log.i("Hermes", "NOTI -> MQTT topic=hermes/notifications json=${payload}")
        // MQTT 큐에 적재(연결 전이면 대기 후 전송)
        MqttClient.publishJson("hermes/notifications", payload)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // 필요 시 삭제 이벤트 처리 가능
    }
}
