# config.py
MQTT_BROKER = "localhost"   # 또는 브로커 IP (라즈베리에 브로커 설치 시 localhost)
MQTT_PORT = 1883

# 텍스트/TTS 메시지 토픽
MQTT_TOPIC_TEXT = "tts/text"

# 볼륨 제어 메시지 토픽
MQTT_TOPIC_VOLUME = "tts/volume"
