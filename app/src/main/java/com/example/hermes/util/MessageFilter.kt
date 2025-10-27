package com.example.hermes.util
/**
 * 메시지 중요도 필터 (Heuristic 기반)
 *
 * 기능:
 *  1. 너무 짧거나 의미 없는 메시지 ("ㅋㅋ", "ㅎㅇ" 등) 필터링
 *  2. 중요 키워드 기반 점수 계산
 *  3. 카테고리별 가중치 부여
 *  4. 임계값에 따라 전송 여부 결정
 *
 *  점수 기준:
 *   - < 0.3 : 무의미 → 폐기
 *   - 0.3~0.6 : 애매 → 서버/월패드에서 LLM 판단 필요
 *   - > 0.6 : 중요 → 즉시 전송
 */
object MessageFilter {
    private var TAG = "Hermes-Filter"

    //의미 없는 단어 -> 의성어/반복음/짧은 반응
    private  val meaninglessTokens = listOf(
        "ㅋㅋ", "ㅎㅎ", "ㅠㅠ", "ㅜㅜ", "ㅇㅋ", "ㅇㅇ", "ㄱㄱ", "ㄴㄴ",
        "ㅎ", "ㅋ", "굿", "ok", "lol", "hi", "hey", "yes", "no", "응",
        "ㅅㅂ", "ㅄ", "ㅈㅂ", "ㅠㅜ", "ㅜㅠ", "n", "h", "ㅗ", "ㅗㅗ"
    )
    private val positiveKeywords = listOf(
        "입금", "이체", "결제", "배송", "택배", "도착", "확인",
        "회의", "예약", "긴급", "공지", "알림", "발표", "시간", "일정",
        "완료", "약속", "부재", "일정", "마감", "신청", "제출", "방문", "전화", "은행",
        "급하게", "급한", "부탁", "안녕하세요", "올림", "공지", "중요", "감사합니다", "회신",
        "귀하", "고객님", "대상자", "보험", "건강", "암", "검진", "출석", "고소", "변호사","경관",
        "형사", "민사", "소방", "구급", "응급"
    )

    fun importanceScore(text: String): Float {
        val t = text.trim()
        if (t.isBlank()) return 0f
        val lower = t.lowercase()

        var score = 0f

        if (t.length > 10) score += 0.2f

        if (positiveKeywords.any { lower.contains(it) }) score += 0.5f
        if (meaninglessTokens.any { lower.contains(it) }) score -= 0.5f

        val emojiRatio = t.count { it.code > 0x1F600 }.toFloat() / t.length.toFloat()
        if (emojiRatio > 0.7f) score -= 0.4f

        return score.coerceIn(0f, 1f)
    }

    /** 전송 여부 판단 (로컬 단계) */
    fun shouldForward(text: String): Boolean {
        val s = importanceScore(text)
        return when {
            s < 0.3f -> false   // 무의미: 폐기
            s > 0.6f -> true    // 명확히 중요: 즉시 전송
            else -> false       // 애매: 로컬에서는 보류 (서버 판단용으로만 전송 가능)
        }
    }

    /** 단순히 "무의미한 대화"만 판별할 때 사용 */
    fun isMeaningless(text: String): Boolean {
        val t = text.trim()
        if (t.isBlank()) return true
        val lower = t.lowercase()
        return meaninglessTokens.any { lower.contains(it) }
    }
}