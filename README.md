# HERMES

# 📘 프로젝트 개요

이 프로젝트는 라즈베리파이 단일 보드 기반의 스마트 스피커 시스템이다.  
MQTT 프로토콜을 통해 전달된 텍스트를 Google Cloud Text-to-Speech API로 실시간 변환하여
오디오로 재생하는 기능을 수행한다.  
또한, MQTT를 통해 볼륨 제어 명령도 함께 처리할 수 있다.  

---

# 🧩 파일 구성

1. run_tts_mqtt.py
   - 메인 실행 스크립트. MQTT 메시지를 수신하고, 텍스트를 음성으로 재생하거나 볼륨을 제어함.
2. tts_player.py
   - Google Cloud TTS API를 통해 텍스트를 PCM 오디오로 변환하고 ALSA를 이용해 재생.
3. volume_control.py
   - amixer를 이용해 시스템 볼륨을 0~100% 범위 내에서 제어.
4. config.py
   - MQTT 브로커 주소, 포트, 토픽, TTS 음성 설정(언어/보이스) 저장.

---

# 🔧 설치 및 설정, 실행

- 패키지 설치
```
sudo apt update
sudo apt install python3-pip alsa-utils
pip3 install paho-mqtt google-cloud-texttospeech numpy
```
- Google Cloud 인증키 등록
```
export GOOGLE_APPLICATION_CREDENTIALS="/home/pi/google-tts-key.json"
```
- MQTT 설정
```
sudo apt install mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```
- ip 및 port 설정
```
MQTT_BROKER = "localhost"   # 또는 외부 브로커 IP
MQTT_PORT = 1883
```
위 설정은 `config.py`에서 진행
- 실행
```
python run_tts_mqtt.py
```
