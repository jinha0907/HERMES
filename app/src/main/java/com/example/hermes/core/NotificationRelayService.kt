package com.example.hermes.core

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.util.Log
import com.example.hermes.net.MqttClient
import com.example.hermes.util.Masking
import com.example.hermes.util.MessageFilter
import com.example.hermes.util.CategoryClassifier
import org.json.JSONArray
import org.json.JSONObject
import java.time.Instant
import android.os.Build


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
        var category = String()

        val pkg = sbn.packageName ?: "unknown"
        if (!Masking.mask_app(pkg)) {
            Log.i("Hermes", "Filtered out package: $pkg")
            return
        }
        val title = (extras.getCharSequence(Notification.EXTRA_TITLE) ?: "").toString()
        val text = (
                extras.getCharSequence(Notification.EXTRA_TEXT)
                    ?: extras.getCharSequence(Notification.EXTRA_SUMMARY_TEXT)
                    ?: ""
                ).toString()
        if(Masking.containsInvalid(text)){
            Log.i("Hermes", "Filtered out text: $text")
            return
        }

        if (CategoryClassifier.classify(pkg) == "전화") {
            val lowerText = (title + text).lowercase()
            val isMissed = listOf("부재중", "missed call", "전화 놓침").any { lowerText.contains(it) }
            if (!isMissed) {
                return
            }
        }

        val lines = mutableListOf<String>()
        extras.getCharSequenceArray(Notification.EXTRA_TEXT_LINES)?.forEach {
            lines += it?.toString().orEmpty()
        }
        val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString().orEmpty()
        category = CategoryClassifier.classify(pkg)
        if (bigText.isNotBlank()) lines += bigText

        // 공백이면 전송 X
        if (title.isBlank() && text.isBlank()) {
            Log.i("Hermes", "빈 알림 감지 → 전송 안 함 pkg=$pkg")
            return
        }
        if (MessageFilter.isMeaningless(text)) {
            Log.i("Hermes", "무의미한 메시지 무시: $text")
            return
        }
        if (!MessageFilter.shouldForward(text)) {
            Log.i("Hermes", "의미도 낮음 (전송 생략): $text")
            return
        }

        val message = JSONObject().apply {
            put("app_package", pkg)
            put("title", Masking.mask(title))
            put("text", Masking.mask(text))
            put("category", category)
            put("lines", JSONArray(lines.map { Masking.mask(it) }))
            put("posted_at_utc", Instant.ofEpochMilli(sbn.postTime).toString())
        }

        val payload = JSONObject().apply {
            put("device_id", Build.MODEL)
            put("device_type", "android")
            put("Message", message)
        }

        Log.i("Hermes", "NOTI -> MQTT topic=hermes/app json=${payload}")
        // MQTT 큐에 적재(연결 전이면 대기 후 전송)
        MqttClient.publishJson("hermes/app", payload)
    }

    override fun onNotificationRemoved(sbn: StatusBarNotification?) {
        // 필요 시 삭제 이벤트 처리...
    }
}
