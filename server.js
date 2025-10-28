require("dotenv").config();
const YAML = require("yamljs"); 
const swaggerUi = require("swagger-ui-express");
const express = require("express");
const db = require("./db");
const cors = require("cors");            
const { 
  initMqtt, 
  publishSpeaker, 
  publishSpeakerVolume, 
  setDndPeriod, 
  getDndPeriod, 
  getVolume 
} = require("./mqttHandler");

const swaggerDocument = YAML.load("./swagger/swagger.yaml");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// FE(프론트)와 통신 가능하도록 CORS 허용
app.use(cors({
  origin: [
    "http://localhost:5173",           // 로컬 개발용
    "http://192.168.1.132:5173"        // 라즈베리 실제 IP 기반 FE 접근
  ],
  credentials: true,
}));


// ─────────────────────────────────────────────
// FE → 알림 목록 조회
// ─────────────────────────────────────────────
app.get("/app-notif", (req, res) => {
  const limit = Number(req.query.limit) || 20;
  const rows = db.listAppNotifications(limit).map(r => {
    if (r.lines) {
      try { r.lines = JSON.parse(r.lines); } catch {}
    }
    return r;
  });
  res.json(rows);
});

// ─────────────────────────────────────────────
// FE → 알림 삭제 (스피커 전송 없음)
// ─────────────────────────────────────────────
app.delete("/app-notif/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ error: "invalid_id" });
  db.deleteAppNotification(id);
  res.json({ ok: true, deleted_id: id });
});

// ─────────────────────────────────────────────
// FE → 전체 알림 요약 스피커로 전달
// ─────────────────────────────────────────────
app.post("/app-notif/speak-all", (req, res) => {
  const summaries = db.getAllSummaries();
  if (!summaries.length) {
    publishSpeaker({
      detected: true,
      iso: new Date().toISOString(),
      text: "현재 등록된 알림이 없습니다.",
    });
    return res.json({ ok: true, count: 0 });
  }
   
  const joined = summaries.join(" / ");
  
  publishSpeaker({
    detected: true,
    iso: new Date().toISOString(),
    text: joined
  });
  
  res.json({ ok: true, count: summaries.length });
});
// ─────────────────────────────────────────────
// FE → 스피커 볼륨 조정 요청
// ─────────────────────────────────────────────
app.post("/speaker/volume", (req, res) => {
  const { volume } = req.body;
  if (volume === undefined) {
    return res.status(400).json({ error: "missing_volume" });
  }

  publishSpeakerVolume(volume);
  res.json({ ok: true, sent_volume: volume });
});
// ─────────────────────────────────────────────
// FE → 방해금지 모드 설정
// ─────────────────────────────────────────────
app.post("/speaker/dnd", (req, res) => {
  const { dndStart, dndEnd } = req.body;
  if (!dndStart || !dndEnd) {
    return res.status(400).json({ error: "missing_time" });
  }

  const { setDndPeriod } = require("./mqttHandler");
  setDndPeriod(dndStart, dndEnd);

  res.json({ ok: true, dndStart, dndEnd });
});

// 현재 볼륨 조회
app.get("/speaker/volume", (req, res) => {
  const volume = getVolume();
  res.json({
    volume,
  });
});

// ✅ 현재 DND 시간 조회
app.get("/speaker/dnd", (req, res) => {
  const dnd = getDndPeriod();
  res.json({
    dndStart: dnd.startTime || null, 
    dndEnd: dnd.endTime || null,
  });
});


// ─────────────────────────────────────────────
// 서버 실행
// ─────────────────────────────────────────────
const port = 8080;
app.listen(port, () => console.log(`Server running on port ${port}`));
initMqtt();
