//llm.js
require("dotenv").config(); 
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = process.env.MODEL || "gpt-4o-mini";

function buildPrompt(p) {
  const system = [
    "너는 한국어 알림 요약 도우미야.",
    "대상은 60세 이상 어르신을 위한 거라 40자 이내로 간결하게하되 최대한 공손한 말투를 사용해줘.",
    "카톡이나 문자 같은 경우 제목에 있는 송신자 이름과 요청한 내용을 포함해 요약을 만들어줘",
    "예를들면 홍길동이 송금 요청을 했으면 홍길동님이 송금을 요청했습니다.라고 만들어",
    "Title 변수는 무시하고 message만 요약해.",
    "메세지에 대답을 하지 말고 요약만 해.",
    "- 개인식별 정보 절대 포함하지 말 것.",
    "- 문장 중간의 문장부호는 절대 포함하지 마(,.:'등)"
  ].join("\n");

  const userLines = [
    p.category ? `카테고리: ${p.category}` : null,
    p.titleMasked ? `제목: ${p.titleMasked}` : null,
    `본문(마스킹됨): ${p.bodyMasked}`,
    p.metaAllowed && Object.keys(p.metaAllowed).length
      ? `허용된 메타: ${JSON.stringify(p.metaAllowed)}`
      : null,
  ].filter(Boolean);

  return [
    { role: "system", content: system },
    { role: "user", content: userLines.join("\n") },
  ];
}

async function summarize(p) {
  const messages = buildPrompt(p);
  const resp = await openai.chat.completions.create({
    model: MODEL,
    temperature: 0.2,
    max_tokens: 160,
    messages,
  });
  return (resp.choices?.[0]?.message?.content || "").trim();
}
async function analyzeImportance(title, text) {
  const prompt = `
너는 알림 필터링 AI야. 아래 알림의 중요도를 판단해줘.

[중요도 판단 기준]
- HIGH: 금융, 결제, 입금/출금, 승인, 송금, 계좌, 은행 관련
        정부/공공/재난, 복지, 기상특보, 건강, 병원 예약, 보안/인증
        택배 배송 완료, 안전/비상 안내, 배송, 택배
- LOW: 광고, 이벤트, 뉴스, 프로모션, 일반 앱 알림, SNS

출력은 반드시 JSON 형식으로만:
{"importance": "HIGH"} 또는 {"importance": "LOW"}

제목: ${title}
내용: ${text}
  `

  try {
    const res = await openai.chat.completions.create({
      model: MODEL,
      temperature: 0,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = res.choices?.[0]?.message?.content || "";
    const json = JSON.parse(raw);
    return json.importance || "LOW";
  } catch (err) {
    console.error("[LLM] 중요도 분석 실패:", err.message);
    return "LOW";
  }
}
module.exports = { summarize, analyzeImportance, MODEL };
