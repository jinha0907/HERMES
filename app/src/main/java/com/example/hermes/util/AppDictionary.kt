package com.example.hermes.util

object AppDictionary {
    val blockedApps = listOf(
        "android.systemui", "google.android.gms", "settings", "launcher",
        "packageinstaller", "updater", "firmware", "wallpaper",
        "weather", "chrome", "browser"
    )

    val categories = mapOf(
        "메신저" to listOf("kakao", "talk", "sms", "mms", "telegram", "whatsapp", "line", "messaging", "instagram.direct", "facebook.orca"),
        "은행" to listOf("bank", "pay", "card", "toss", "finance", "wallet", "kakaobank", "payco", "ibk", "nh", "kb", "hana", "shinhan", "woori"),
        "전화" to listOf("phone", "dialer", "call"),
        "알람" to listOf("clock", "alarm", "timer")
    )
}
