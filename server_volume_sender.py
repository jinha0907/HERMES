# server_volume_sender.py
import json
import paho.mqtt.client as mqtt
import config

TOPIC = config.MQTT_TOPIC_VOLUME

def main():
    client = mqtt.Client()
    client.connect(config.MQTT_BROKER, config.MQTT_PORT, 60)
    client.loop_start()
    print(f"[SERVER] Connected to MQTT at {config.MQTT_BROKER}:{config.MQTT_PORT}")
    print(f"[SERVER] Type a volume (0~100 or 0.0~1.0). 'q' to quit. Publish topic: '{TOPIC}'")

    try:
        while True:
            s = input("Volume > ").strip()
            if s.lower() in ("q", "quit", "exit"):
                break

            try:
                val = float(s)
            except ValueError:
                print("  ! Enter a number (0~100 or 0.0~1.0).")
                continue

            # 0~1.0 입력 → 0~100 변환
            if 0.0 <= val <= 1.0:
                percent = round(val * 100)
            else:
                percent = round(val)

            percent = max(0, min(100, percent))

            payload = json.dumps({"volume": percent})
            client.publish(TOPIC, payload, qos=1, retain=False)
            print(f"  -> Sent {payload} to '{TOPIC}'")

    finally:
        client.loop_stop()
        client.disconnect()
        print("[SERVER] Disconnected.")

if __name__ == "__main__":
    main()
