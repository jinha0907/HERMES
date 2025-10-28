package com.example.hermes.util

object Masking {
    // 전화번호 (기존)
    private val phone = Regex("""(?<!\d)(01[016789]|02|0[3-9]\d)-?\d{3,4}-?\d{4}(?!\d)""")
    // 이메일 (기존)
    private val email = Regex("""[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}""")
    // 주민등록번호 (앞6-뒤7)
    private val idnum = Regex("""\b\d{6}-?\d{7}\b""")

    // 문맥 키워드(계좌 관련). 계좌가 바로 앞/뒤에 있으면 정확도 상승
    private val accountKeywords = Regex("""(?i)\b(계좌|입금|출금|계좌번호|예금주|은행)\b""")

    // === 은행별 정밀 패턴 예시 (한국 주요 은행 사례 기반)
    // 주: 실제 은행별 패턴은 변동 가능. 자리수/하이픈 배치로 커버.

    private val invalidKeywords = listOf(
        "광고", "[AD]", "(AD)", "[광고]", "(광고)",
        "(걸음)", "걸음", "[걸음]",
        "[국외발신]", "국외발신", "국외",
    )

    private val bankPatterns = listOf(
        // 국민은행 (KB) 예시: 3-2-(-)-7 등 다양한 포맷 존재 -> 몇가지 대표 포맷 추가
        Regex("""\b\d{2,3}-\d{2,6}-\d{2,7}\b"""), // e.g. 123-45-6789012
        // 신한은행: 보통 14자리 내외 그룹화 가능
        Regex("""\b\d{3}-\d{6}-\d{4}\b"""),
        // 우리은행: 3-8-? 등 여러 포맷
        Regex("""\b\d{3}-\d{6,8}-\d{1,4}\b"""),
        // 하나은행/KEB: 3-6-? 등
        Regex("""\b\d{3}-\d{6}-\d{1,4}\b"""),
        // 농협(NH) : 3-2-? 등 변형
        Regex("""\b\d{3}-\d{2}-\d{7,8}\b"""),
        // 기업은행(IBK) : 3-6-? 등
        Regex("""\b\d{3}-\d{6}-\d{1,4}\b"""),
        // (더 많은 은행별 포맷을 필요시 추가)
    )

    // 범용 계좌번호 의심 패턴: 하이픈 포함 숫자 조합 또는 10~16자리 연속 숫자
    private val genericAccount = Regex("""\b(?:\d{2,4}[- ]?){2,5}\d{2,6}\b""")
    // 보다 엄격한 길이 기반 추가: 연속 숫자 10~16자리 (하이픈 없는 경우)
    private val longNumeric = Regex("""(?<!\d)\d{10,16}(?!\d)""")

    fun mask_app(input: String): Boolean {
        val name = input.lowercase()
        val category = "none"
        if (AppDictionary.blockedApps.any { name.contains(it) }) return false
        if (AppDictionary.categories.values.flatten().any { name.contains(it) }) return true
        // 기본적으로 허용하지 않음
        return false
    }

    // 광고/해외발신 등 필터링
    fun containsInvalid(text: String): Boolean {
        val lower = text.lowercase()
        return invalidKeywords.any { lower.contains(it) }
    }
    fun mask(input: String): String {
        var s = input

        // 1) 전화, 이메일, 주민번호 먼저 처리 (우선순위)
        s = s.replace(phone, "***-****-****")
        s = s.replace(email) { m ->
            val parts = m.value.split("@")
            if (parts[0].length <= 1) "***@***" else "${parts[0][0]}***@${parts[1]}"
        }
        s = s.replace(idnum, "******-*******")

        // 2) 문맥이 있는 경우(예: '계좌', '입금' 등)에 은행패턴 우선 적용
        if (accountKeywords.containsMatchIn(s)) {
            for (p in bankPatterns) {
                if (p.containsMatchIn(s)) {
                    s = s.replace(p, "****계좌****")
                }
            }
            // 범용 패턴도 적용
            if (genericAccount.containsMatchIn(s)) s = s.replace(genericAccount, "****계좌****")
            if (longNumeric.containsMatchIn(s)) s = s.replace(longNumeric, "****계좌****")
            return s
        }

        // 3) 문맥 없을 때는 오탐을 줄이기  ` 위해 '엄격' 규칙부터 적용
        for (p in bankPatterns) {
            s = s.replace(p, "********")
        }
        // 그런 다음 범용 패턴(긴 숫자열) 적용하되,
        // 너무 짧거나 다른 유형과 겹치면 오탐 가능 -> 이미 전화/주민 마스킹 했으니 위험 줄음
        s = s.replace(genericAccount, "********")
        s = s.replace(longNumeric, "*******")

        return s
    }
}