# config.py
MQTT_BROKER = "192.168.137.96"   # 또는 브로커 IP (라즈베리에 브로커 설치 시 localhost)
MQTT_PORT = 1883

# 텍스트/TTS 메시지 토픽
MQTT_TOPIC_TEXT = "hermes/speaker"

# 볼륨 제어 메시지 토픽
MQTT_TOPIC_VOLUME = "hermes/speaker/volume"

VOICE_LANG  = "ko-KR"
VOICE_NAME  = "ko-KR-Wavenet-A"