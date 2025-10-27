# run_tts_mqtt.py
import paho.mqtt.client as mqtt
from tts_player import speak
import config
import json

def on_connect(client, userdata, flags, rc):
    print("[MQTT] Connected with result code", rc)
    client.subscribe(config.MQTT_TOPIC)

def on_message(client, userdata, msg):
    payload = msg.payload.decode("utf-8")
    print("[MQTT] Received raw:", payload)

    text = None
    # JSON 처리
    try:
        data = json.loads(payload)
        if isinstance(data, dict) and "text" in data:
            text = data["text"]
        elif isinstance(data, str):
            text = data
    except json.JSONDecodeError:
        # 일반 문자열인 경우 그대로 사용
        text = payload

    if text:
        print("[MQTT] Text to speak:", text)
        speak(text)
    else:
        print("[WARN] No valid text found in MQTT payload")

def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(config.MQTT_BROKER, config.MQTT_PORT, 60)
    client.loop_forever()

if __name__ == "__main__":
    main()
