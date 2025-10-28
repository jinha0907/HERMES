// mqttHandler.js
require("dotenv").config();
const mqtt = require("mqtt");
const db = require("./db");
const { summarize, analyzeImportance } = require("./llm");

const MQTT_URL = process.env.MQTT_URL || "mqtt://192.168.137.96"; //여기 바꾸기 

const CAMERA_TOPIC = "pose/raspi-01/alert";
const APP_TOPIC = "hermes/app";
const SPEAKER_TOPIC = "hermes/speaker";
const VOLUME_TOPIC = "hermes/speaker/volume";

let mqttClient;
let dndStart = null;
let dndEnd = null;
let currentVolume = 80; // 기본 볼륨

function setDndPeriod(start, end) {
  dndStart = start;
  dndEnd = end;
  console.log(`[DND] Quiet hours set from ${start} to ${end}`);
}

function getDndPeriod() {
  return { startTime: dndStart, endTime: dndEnd };
}

function setVolume(volume) {
  currentVolume = volume;
  console.log(`[VOL] Volume set to ${volume}`);
}

function getVolume() {
  return currentVolume;
}

// ─────────────────────────────────────────────
// MQTT 연결 및 구독 설정
// ─────────────────────────────────────────────
function initMqtt() {
  console.log(`[MQTT] Connecting to ${MQTT_URL} ...`);
  mqttClient = mqtt.connect(MQTT_URL);

  mqttClient.on("connect", () => {
    console.log(`[MQTT] Connected to broker: ${MQTT_URL}`);
    mqttClient.subscribe([CAMERA_TOPIC, APP_TOPIC], { qos: 1 }, err => {
      if (err) console.error("[MQTT] Subscribe failed:", err);
      else console.log(`[MQTT] Subscribed to topics: ${CAMERA_TOPIC}, ${APP_TOPIC}`);
    });
  });

  mqttClient.on("reconnect", () => console.log("[MQTT] Reconnecting..."));
  mqttClient.on("close", () => console.log("[MQTT] Connection closed"));
  mqttClient.on("error", err => console.error("[MQTT] Connection error:", err));

  mqttClient.on("message", handleMessage);
}

// ─────────────────────────────────────────────
// 메시지 분기 처리
// ─────────────────────────────────────────────
async function handleMessage(topic, messageBuf) {
  const raw = messageBuf.toString();

  console.log(`\n[MQTT] Message received on [${topic}]`);
  console.log("[MQTT] ├ Raw payload:", raw);

  try {
    const payload = JSON.parse(raw);

    if (topic === CAMERA_TOPIC) {
      handleCameraMessage(payload);
    } else if (topic === APP_TOPIC) {
      await handleAppMessage(payload);
    } else {
      console.warn("[MQTT] Unknown topic:", topic);
    }
  } catch (e) {
    console.error("[MQTT] JSON parse error:", e.message);
  }
}


// ─────────────────────────────────────────────
// 카메라 메시지 처리 (순차 전송 버전)
// ─────────────────────────────────────────────
function handleCameraMessage(payload) {
  let Message = payload.Message || payload;

  if (typeof Message === "string") {
    try {
      Message = JSON.parse(Message);
    } catch (e) {
      console.error("[MQTT] Failed to parse Message JSON:", e.message);
      return;
    }
  }

  console.log("[DEBUG] Camera payload:", Message);

  const poseOk =
    Message.pose_ok === true ||
    String(Message.pose_ok).toLowerCase() === "true";
  const userVerified =
    Message.user_verified === true ||
    String(Message.user_verified).toLowerCase() === "true";

  console.log("[DEBUG] pose_ok =", poseOk, "| user_verified =", userVerified);

  if (!(poseOk || userVerified)) {
    console.log("[MQTT] No user detected.");
    return;
  }

  console.log("[MQTT] User detected — fetching summaries from DB...");
  const notifs = db.listAppNotifications(50); // 최근 50개

  notifs.forEach((notif, i) => {
    const clean = (notif.summary || notif.text || "").replace(/[.,!?'"“”‘’:;·]/g, "").trim();
    const delay = i * 3000;

    setTimeout(() => {
      publishSpeaker({ text: clean }, notif.id);

      if (i < notifs.length - 1)
        setTimeout(() => publishSpeaker({ text: "다음 알림입니다" }), 1500);

      if (i === notifs.length - 1)
        setTimeout(() => publishSpeaker({ text: "알림 종료입니다" }), 2500);
    }, delay);
});

}


// ─────────────────────────────────────────────
// 앱 알림 메시지 처리
// ─────────────────────────────────────────────
async function handleAppMessage(payload) {
  try {
    const { device_id, device_type, Message } = payload;
    if (!device_id || !device_type || !Message) {
      return console.warn("[MQTT] Missing required fields in app message.");
    }

    console.log(`[MQTT] App message received from ${device_id} (${device_type})`);
    console.log("[MQTT] ├ App:", Message.app_package);
    console.log("[MQTT] ├ Title:", Message.title);
    console.log("[MQTT] └ Text:", Message.text);
  
    // LLM 요약
    const summary = await summarize({
      titleMasked: Message.title,
      bodyMasked: Message.text,
      category: null,
      metaAllowed: {},
    });

    console.log("[LLM] Summary generated:", summary);

    // 중요도 분석
    const importance = await analyzeImportance(Message.title, Message.text);
    console.log(`[LLM] Importance: ${importance}`);

    // 중요도 HIGH일 때만 DB 저장
    if (importance === "HIGH") {
      const now = Date.now();
      db.insertAppNotification({
        device_id,
        device_type,
        app_package: Message.app_package || "",
        title: Message.title || "",
        text: Message.text || "",
        lines: Message.lines ? JSON.stringify(Message.lines) : null,
        posted_at_utc: Message.posted_at_utc || "",
        received_at: now,
        summary,
      });
      console.log("[DB] Important notification stored successfully.\n");
    } else {
      console.log("[DB] Skipped non-essential notification.\n");
    }

  } catch (err) {
    console.error("[MQTT] Error in handleAppMessage:", err);
  }
}

// ─────────────────────────────────────────────
// 스피커 메시지 전송
// ─────────────────────────────────────────────
function publishSpeaker(message, notifId = null) {
  if (isWithinDndPeriod()) {
    console.log("[DND] Speaker muted due to DND mode");
    return; // DND 시간에는 publish하지 않음
  }

  if (!mqttClient || !mqttClient.connected) {
    console.warn("[MQTT] Client not connected, cannot publish to speaker");
    return;
  }
  // 알림 전송 횟수 증가
  if (notifId) {
    db.incrementSentCount(notifId);
    console.log(`[DB] Incremented sent_count for notification ${notifId}`);

    // 2회 이상 전송된 알림 삭제
    db.deleteSentIfLimitReached(2);
  }
  // 이 사이 추가함
  mqttClient.publish(SPEAKER_TOPIC, JSON.stringify( message ), { qos: 1 });
  console.log("[MQTT] Published to speaker:", JSON.stringify( message ));
}

// ─────────────────────────────────────────────
// 스피커 볼륨 조절 메시지 전송
// ─────────────────────────────────────────────
function publishSpeakerVolume(volume) {
  if (isWithinDndPeriod()) {
    console.log("[DND] Volume change blocked due to DND mode");
    return;
  }

  if (!mqttClient || !mqttClient.connected) {
    console.warn("[MQTT] Client not connected, cannot publish volume");
    return;
  }

  const message = { Volume: parseFloat(volume) };
  mqttClient.publish(VOLUME_TOPIC, JSON.stringify(message), { qos: 1 });
  console.log("[MQTT] Volume control sent:", message);

  setVolume(volume); // 현재 볼륨 상태 업데이트
}

// ─────────────────────────────────────────────
// 방해금지(DND) 모드 관리
// ─────────────────────────────────────────────
function setDndPeriod(start, end) {
  dndStart = start;
  dndEnd = end;
  console.log(`[DND] Quiet hours set from ${start} to ${end}`);
}

function isWithinDndPeriod() {
  if (!dndStart || !dndEnd) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [startH, startM] = dndStart.split(":").map(Number);
  const [endH, endM] = dndEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // 자정(00:00) 걸치는 케이스 처리 (ex: 22:00 ~ 07:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes < endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes < endMinutes;
}

module.exports = {
  initMqtt,
  publishSpeaker,
  publishSpeakerVolume,
  setDndPeriod,
  getDndPeriod,
  getVolume
};
