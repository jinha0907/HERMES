# HERMES

# 🧠 HERMES: Real-Time Pose & Face Monitoring System

라즈베리파이 기반 실시간 자세 및 얼굴 인식 시스템  
YOLOv8 기반 자세 탐지 + InsightFace 얼굴 인식 + MQTT 알림 통합  

---

# ⚙️ 주요 기능

1. YOLOv8 Pose Estimation
   - 사람의 주요 관절 좌표를 기반으로 행동(Sitting, Standing, Falling 등)을 분류
2. InsightFace Recognition
   - 등록된 얼굴 DB와 비교해 인증 사용자 여부 판단
3. MQTT Notification
   - 허용 자세가 10초 이상 유지되거나 비허용 자세가 지속될 때 브로커에 JSON 형태로 알림 전송
4. Grace Period 처리
   - 순간 자세 변화(3초 이내)는 무시하여 오탐지 방지
5. Heartbeat 전송
   - 일정 주기마다 장치 상태(Power On/Off)를 MQTT로 브로드캐스트

---

# 🧩 파일 구성

1. vision_pose.py
   - YOLOv8을 이용해 관절 좌표 추출 → classify_action()에서 Standing, Sitting, Falling 등 분류
2. vision_face.py
   - 얼굴 임베딩 생성 및 DB 매칭 → 사용자 인증 여부 판단
3. notifier.py
   - 자세 상태를 시간 기반으로 추적 → 10초/3초 조건 충족 시 MQTT 발행
4. mqtt_client.py
   - JSON 직렬화 후 브로커에 전송
5. run.py
   - 모든 모듈을 통합하여 프레임 단위로 분석 수행

---

# ⚙️ 설치 및 설정, 실행

- 패키지 설치
```
pip install ultralytics insightface opencv-python paho-mqtt
```
- 카메라 및 MQTT 설정
```
DEVICE_ID = "raspi-01"
MQTT_HOST = "192.168.0.10"
MQTT_PORT = 1883
ALLOWED_ACTIONS = ["Standing", "HandsUp"]
```
`config.py`에서 위 항목을 사용자의 의도에 맞게 설정
- 실행
```
python run.py
```
