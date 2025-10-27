from datetime import datetime, timezone
import time
from config import Config
import json

class Notifier:
    def __init__(self, mqtt_client):
        self.mqtt_client = mqtt_client
        self.topic_alert = f"pose/{Config.DEVICE_ID}/alert"  # 알림 토픽

        # 내부 상태 추적용 변수
        self.current_state = None               # 현재 상태 ("allowed" / "other")
        self.state_start_time = None            # 상태가 유지되기 시작한 시각
        self.last_published_state = None        # 마지막으로 publish된 상태 (True/False)
        self.allowed_duration = 10.0            # 허용 자세 연속 유지 기준 (초)
        self.disallowed_duration = 3.0          # 비허용 자세 연속 유지 기준 (초)
        self.grace_period = 3.0                 # 허용 자세 중단 허용 시간 (초)
        self.last_allowed_time = None           # 마지막으로 허용 자세로 인식된 시각
        self.person_missing_time = None         # 마지막으로 사람이 사라진 시각

    def reset(self):
        """사람이 사라졌을 때 상태를 초기화"""
        self.current_state = None
        self.state_start_time = None
        self.last_published_state = None
        self.last_allowed_time = None
        print("[SYSTEM] 사람 사라짐 → 상태 초기화 완료")

    def check_and_notify(self, action, user_verified, has_person=True):
        """
        자세 상태를 지속적으로 확인하고 조건 만족 시 1회만 MQTT publish
        - 허용 자세(sitting) 10초 연속 유지 시 publish (1회)
        - 다른 자세 3초 이상 유지 시 허용 상태 해제
        - grace_period 내 잠깐의 흔들림은 무시
        - 사람이 사라지면 상태 리셋
        """
        now = time.time()
        is_allowed = (action in Config.ALLOWED_ACTIONS)

        # --- 사람이 사라졌을 때 ---
        if not has_person:
            # 마지막 인식 후 5초 이상 사람 없으면 상태 리셋
            if self.person_missing_time is None:
                self.person_missing_time = now
            elif now - self.person_missing_time > 5.0:
                self.reset()
            return
        else:
            self.person_missing_time = None  # 사람이 보이면 타이머 초기화

        # --- 허용 자세로 인식될 때 ---
        if is_allowed:
            self.last_allowed_time = now
            if self.current_state != "allowed":
                self.current_state = "allowed"
                self.state_start_time = now
                print("[DEBUG] 상태 변경 → allowed (허용 자세 시작)")
                return  # 상태 전환 직후에는 바로 publish하지 않음

        # --- 비허용 자세로 인식될 때 ---
        else:
            # grace_period 내면 허용 상태 유지로 간주
            if self.last_allowed_time and (now - self.last_allowed_time) <= self.grace_period:
                pass  # 여전히 허용 자세 유지 중으로 간주
            else:
                if self.current_state != "other":
                    self.current_state = "other"
                    self.state_start_time = now
                    print("[DEBUG] 상태 변경 → other (비허용 자세 시작)")
                    return  # 상태 전환 직후에는 바로 publish하지 않음

        # --- 기본 타이머 보정 ---
        if self.state_start_time is None:
            self.state_start_time = now

        elapsed = now - self.state_start_time

        # --- 허용 자세가 10초 연속 유지될 때 ---
        if self.current_state == "allowed" and elapsed >= self.allowed_duration:
            if self.last_published_state != True:
                msg = {
                    "iso": datetime.now(timezone.utc).isoformat(),
                    "user_verified": (user_verified is not None),
                    "pose_ok": True
                }
                self.mqtt_client.publish(self.topic_alert, json.dumps(msg))
                print("[NOTIFY - TRUE] 허용 자세 10초 유지 →", msg)
                self.last_published_state = True
                return

        # --- 비허용 자세가 3초 연속 유지될 때 ---
        elif self.current_state == "other" and elapsed >= self.disallowed_duration:
            if self.last_published_state != False:
                msg = {
                    "iso": datetime.now(timezone.utc).isoformat(),
                    "user_verified": (user_verified is not None),
                    "pose_ok": False
                }
                self.mqtt_client.publish(self.topic_alert, json.dumps(msg))
                print("[NOTIFY - FALSE] 비허용 자세 3초 유지 →", msg)
                self.last_published_state = False
                return
