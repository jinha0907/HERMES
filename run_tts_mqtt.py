# run_tts_mqtt.py
import json
import paho.mqtt.client as mqtt
from tts_player import speak   # <- 기존 TTS 실행 모듈
import config
import volume_control

TOPIC_TEXT = config.MQTT_TOPIC_TEXT
TOPIC_VOLUME = config.MQTT_TOPIC_VOLUME

def on_connect(client, userdata, flags, rc):
    print("[MQTT] Connected with result code", rc)
    client.subscribe(TOPIC_TEXT)
    client.subscribe(TOPIC_VOLUME)
    print(f"[MQTT] Subscribed: {TOPIC_TEXT}, {TOPIC_VOLUME}")

def _handle_text(msg):
    try:
        text = msg.payload.decode("utf-8")
    except Exception as e:
        print("[MQTT][TEXT] Decode error:", e)
        return
    print("[MQTT][TEXT] Received:", text)
    speak(text)

def _handle_volume(msg):
    try:
        data = json.loads(msg.payload.decode("utf-8"))
        vol = data.get("volume", None)
        if vol is None:
            print("[MQTT][VOL] Missing 'volume' key in JSON.")
            return

        if isinstance(vol, (int, float)):
            if 0.0 <= float(vol) <= 1.0:
                percent = round(float(vol) * 100)
            else:
                percent = round(float(vol))
        else:
            print("[MQTT][VOL] 'volume' must be number.")
            return

        percent = max(0, min(100, percent))
        ok, used_ctl = volume_control.set_system_volume(percent)
        if ok:
            print(f"[MQTT][VOL] Volume set to {percent}% (control='{used_ctl}')")
        else:
            print(f"[MQTT][VOL] Failed to set volume (tried control='{used_ctl}')")

    except json.JSONDecodeError:
        print("[MQTT][VOL] JSON decode error. Expected e.g. {'volume': 75}")
    except Exception as e:
        print("[MQTT][VOL] Error:", e)

def on_message(client, userdata, msg):
    if msg.topic == TOPIC_TEXT:
        _handle_text(msg)
    elif msg.topic == TOPIC_VOLUME:
        _handle_volume(msg)
    else:
        print(f"[MQTT] Unhandled topic: {msg.topic}")

def main():
    client = mqtt.Client()
    client.on_connect = on_connect
    client.on_message = on_message

    client.connect(config.MQTT_BROKER, config.MQTT_PORT, 60)
    client.loop_forever()

if __name__ == "__main__":
    main()
