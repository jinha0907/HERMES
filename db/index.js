// db/index.js
const path = require("path");
const Database = require("better-sqlite3");

// ─────────────────────────────────────────────
// DB 파일 경로 및 연결 설정
// ─────────────────────────────────────────────
const DB_PATH = path.join(__dirname, "..", "data", "notifications.db");
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL"); // 병렬 쓰기 최적화

// ─────────────────────────────────────────────
// 1️⃣ 알림 저장 (insert)
// ─────────────────────────────────────────────
function insertAppNotification(payload) {
  const stmt = db.prepare(`
    INSERT INTO app_notifications
    (device_id, device_type, app_package, title, text, lines, posted_at_utc, received_at, summary)
    VALUES (@device_id, @device_type, @app_package, @title, @text, @lines, @posted_at_utc, @received_at, @summary)
  `);
  stmt.run(payload);
}

// ─────────────────────────────────────────────
// 2️⃣ 알림 목록 조회 (최신순)
// ─────────────────────────────────────────────
function listAppNotifications(limit = 20) {
  const stmt = db.prepare(`
    SELECT id, device_id, device_type, app_package, title, text, lines,
           posted_at_utc, received_at, summary
    FROM app_notifications
    ORDER BY received_at DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

// ─────────────────────────────────────────────
// 3️⃣ 알림 삭제
// ─────────────────────────────────────────────
function deleteAppNotification(id) {
  const stmt = db.prepare("DELETE FROM app_notifications WHERE id = ?");
  stmt.run(id);
}

// ─────────────────────────────────────────────
// 4️⃣ 전체 요약 문장 리스트 조회
// ─────────────────────────────────────────────
function getAllSummaries() {
  const stmt = db.prepare(`
    SELECT summary FROM app_notifications
    ORDER BY received_at ASC
  `);
  return stmt.all().map(r => r.summary).filter(Boolean);
}

function incrementSentCount(id) {
  db.prepare(`UPDATE app_notifications SET sent_count = sent_count + 1 WHERE id = ?`).run(id);
}

function deleteSentIfLimitReached(limit = 2) {
  db.prepare(`DELETE FROM app_notifications WHERE sent_count >= ?`).run(limit);
}
// ─────────────────────────────────────────────
// 5️⃣ 내보내기
// ─────────────────────────────────────────────
module.exports = {
  insertAppNotification,
  listAppNotifications,
  deleteAppNotification,
  getAllSummaries,
  incrementSentCount,
  deleteSentIfLimitReached
};
