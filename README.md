# HERMES Server

HERMES는 **스마트 알림 관리 시스템**으로,
스마트폰 앱에서 수신한 알림을 요약하여 Raspberry Pi 기반 서버에서 저장하고,
카메라 감지 시 스피커를 통해 음성으로 알림을 전달합니다.

---

## ⚙️ System Overview

```text
📱 Android App  ──(MQTT)──▶  🧠 HERMES Server (Raspberry Pi)
                                    │
                                    ├── LLM Summarizer (OpenAI API)
                                    ├── DND Manager (방해금지 모드)
                                    ├── Volume Controller
                                    ├── Reminder / Auto-Delete Logic
                                    └── 💾 SQLite Database
                                    │
📡 CAM ──(MQTT: pose/raspi-01/alert)─
                                    │
                                    ▼
🔊 Speaker (MQTT Subscriber)
💻 Frontend (Wallpad UI via HTTP)
```

---

## 🚀 Features

| 기능                               | 설명                                            |
| -------------------------------- | --------------------------------------------- |
| 🔔 **App Notification Handling** | 앱에서 MQTT로 전달된 알림을 요약(LLM) 후 DB에 저장            |
| 🎥 **Camera Detection Trigger**  | 카메라가 `user_verified=true` 전송 시 전체 알림을 스피커로 발송 |
| 💬 **Speaker Communication**     | 요약된 알림을 MQTT(`hermes/speaker`)로 전송            |
| ⏰ **Do Not Disturb (DND)**       | 지정된 시간에는 스피커 출력 차단                            |
| 🔊 **Volume Control**            | 프론트엔드에서 조절된 볼륨을 MQTT로 스피커에 전달                 |
| ♻️ **Reminder & Auto-Delete**    | 모든 알림은 2회 전송 후 자동 삭제                          |
| 💻 **Frontend API 지원**           | 알림 목록, 삭제, 전체 전송, DND, 볼륨 등 REST API 제공       |
| 🧩 **Swagger UI 문서화**            | `/api-docs` 에서 모든 API 테스트 가능                  |

---

## 🧰 Tech Stack

* **Node.js (Express)** — REST API 서버
* **MQTT.js** — MQTT 브로커 통신 (Mosquitto)
* **SQLite (better-sqlite3)** — 로컬 데이터 저장
* **OpenAI API** — LLM 요약 처리
* **Swagger UI** — API 문서 제공
* **CORS** — FE(Wallpad) 통신 허용

---

## 📂 Project Structure

```bash
HERMES/
├── server.js              # Express 서버 (HTTP API + Swagger)
├── mqttHandler.js         # MQTT 연결 및 메시지 처리
├── llm.js                 # LLM 요약 관련 모듈 (OpenAI API)
├── db/
│   ├── index.js           # SQLite 연결 및 CRUD 함수
│   ├── migrations/
│   │   └── 0001_init.sql  # DB 스키마 정의
│   └── data/notifications.db  # 알림 데이터 파일
├── .env                   # 환경변수 (OpenAI Key, MQTT URL 등)
└── swagger/
    └── swagger.yaml       # API 문서 정의
```

---

## 🔧 Installation

### 1️⃣ 사전 준비

라즈베리파이에 Node.js, Mosquitto, SQLite3 설치:

```bash
sudo apt update
sudo apt install -y nodejs npm mosquitto mosquitto-clients sqlite3
```

### 2️⃣ 의존성 설치

```bash
npm install
```

### 3️⃣ 환경 변수 설정

`.env` 파일을 루트 디렉토리에 생성:

```env
OPENAI_API_KEY=sk-xxxxxx
APP_INGEST_TOKEN=hermes-token
MQTT_URL=mqtt://192.168.1.132
MODEL=gpt-4o-mini
PORT=8080
```

### 4️⃣ DB 초기화

```bash
node db/migrations/migrate.js
```

---

## ▶️ Run Server

```bash
node server.js
```

콘솔 로그:

```
Server running on port 8080
[MQTT] ✅ Connected to broker: mqtt://192.168.1.132
[MQTT] 📡 Subscribed to topics: pose/raspi-01/alert, hermes/app
```

Swagger 문서: [http://localhost:8080/api-docs](http://localhost:8080/api-docs)

---

## 🧩 API Endpoints Summary

| Method   | Endpoint               | Description          |
| -------- | ---------------------- | -------------------- |
| `GET`    | `/app-notif`           | DB에 저장된 알림 목록 조회     |
| `DELETE` | `/app-notif/:id`       | 알림 삭제                |
| `POST`   | `/app-notif/speak-all` | 전체 알림 스피커로 전송        |
| `GET`    | `/speaker/volume`      | 현재 볼륨 조회             |
| `POST`   | `/speaker/volume`      | 볼륨 설정 및 MQTT 전송      |
| `GET`    | `/speaker/dnd`         | DND 시간 조회            |
| `POST`   | `/speaker/dnd`         | DND 시간 설정            |

---

## 🧠 MQTT Topics Summary

| Topic                   | Direction        | Payload Example                                                      |
| ----------------------- | ---------------- | -------------------------------------------------------------------- |
| `hermes/app`            | App → Server     | `{ "device_id": "...", "Message": { "title": "...", "text": "..."}}` |
| `pose/raspi-01/alert`   | Camera → Server  | `{ "pose_ok": true, "user_verified": true }`                         |
| `hermes/speaker`        | Server → Speaker | `{ "Message": { "text": "..."}}`                                     |
| `hermes/speaker/volume` | Server → Speaker | `{ "Message": { "Volume": "85"}}`                                    |

---
## Alarm Reminder

> **Tip:**
> 카메라가 `pose_ok=true` 신호를 보낼 때 DB에 저장된 모든 알림을 순차적으로 읽어
> `"다음 알림입니다"` / `"알림 종료입니다"` 문구를 자동 삽입하여
> 스피커로 전송합니다.
> 모든 알림은 2회 송신 후 자동 삭제됩니다.
