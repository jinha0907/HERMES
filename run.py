from datetime import datetime, timezone
import time
import cv2
from config import Config
from vision_pose import PoseEstimator
from vision_face import FaceRecognizer
from mqtt_client import MQTTClient
from notifier import Notifier

def main():
    last_heartbeat = 0.0 # 전원 확인 interval 초기화

    # MQTT 연결
    mqtt_client = MQTTClient(Config.MQTT_HOST, Config.MQTT_PORT,
                             Config.USERNAME, Config.PASSWORD,
                             Config.KEEPALIVE, Config.DEVICE_ID)
    mqtt_client.connect()
    notifier = Notifier(mqtt_client)

    # 모듈 로드
    pose_estimator = PoseEstimator(Config.POSE_MODEL, Config.CONF_THRESHOLD,
                                   Config.IMG_SIZE, Config.YOLO_DEVICE)
    face_recognizer = FaceRecognizer(Config.FACES_DIR, Config.FACES_DB,
                                     Config.REBUILD_FACES_DB, Config.FACE_THR,
                                     Config.BLUR_THR, Config.CTX_ID)

    cap = cv2.VideoCapture(Config.CAM_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, Config.WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, Config.HEIGHT)

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                continue
            res = pose_estimator.detect(frame)
            has_boxes = (getattr(res, "boxes", None) is not None) and (res.boxes.xyxy is not None)
            has_kps   = (getattr(res, "keypoints", None) is not None)

            action = "Unknown"

            # 얼굴 인식 (여러 얼굴 중 하나라도 등록된 사용자 있으면 True)
            results = face_recognizer.recognize(frame)
            user_verified = any(uid is not None for uid, _ in results)

            # 포즈 인식
            if has_boxes and has_kps:
                for i, box in enumerate(res.boxes.xyxy.cpu().numpy()):
                    action = pose_estimator.classify_action(res.keypoints.xy[i].cpu().numpy(), box,
                                                            pose_estimator.history[(i,0)])
                    # 알림 조건 체크 (Boolean만 전달)
                    notifier.check_and_notify(action, user_verified)

            cv2.imshow("Pose+Face", frame)
            if cv2.waitKey(1) & 0xFF in (ord('q'), 27):
                break
            if (time.time() - last_heartbeat) >= Config.HEARTBEAT_INTERVAL:
                hb = {
                    "iso": datetime.now(timezone.utc).isoformat() + "(UTC)", # 항상 ISO 시간 추가
                    "Power": True # 전원 알림
                }
                mqtt_client.publish(Config.HEARTBEAT_TOPIC, hb)
                last_heartbeat = time.time()

    finally:
        hb = {
            "iso": datetime.now(timezone.utc).isoformat() + "(UTC)", # 항상 ISO 시간 추가
            "Power": False # 종료 알림
        }
        mqtt_client.publish(Config.HEARTBEAT_TOPIC, hb)

        cap.release()
        cv2.destroyAllWindows()
        mqtt_client.disconnect()

if __name__ == "__main__":
    main()
