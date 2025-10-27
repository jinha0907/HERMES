# run_ver3.py
import time
import cv2
from ultralytics import YOLO
from config import Config
from vision_pose import PoseEstimator
from vision_face import FaceRecognizer
from mqtt_client import MQTTClient
from notifier import Notifier

def main():
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

    # 사람 감지
    person_detector = YOLO("yolov8n.pt")

    cap = cv2.VideoCapture(Config.CAM_INDEX)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, Config.WIDTH)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, Config.HEIGHT)

    active = False        # 현재 활성화 상태 (사람 있을 때 True)
    last_seen = 0.0       # 마지막 사람 감지 시각
    ACTIVE_TIMEOUT = 5.0  # 5초 동안 사람 없으면 비활성화
    prev_person_state = False  # 이전 사람 상태 기억 (처음엔 False)

    try:
        while True:
            ok, frame = cap.read()
            if not ok:
                continue

            # 사람 존재 감지
            det = person_detector(frame, classes=[0], conf=0.5, verbose=False)
            has_person = len(det[0].boxes) > 0

            # 사람이 보이면 활성화 상태 진입
            if has_person:
                last_seen = time.time()
                if not active:
                    print("[SYSTEM] 사람 인식됨 → 활성화 시작")
                    active = True
                    # 활성화 시 YOLO Pose 모델 강제 리로드
                    pose_estimator = PoseEstimator(Config.POSE_MODEL, Config.CONF_THRESHOLD,
                                                   Config.IMG_SIZE, Config.YOLO_DEVICE)

                # 최초 1회 True publish
                if not prev_person_state:
                    notifier.check_and_notify("PersonDetected", user_verified=True)
                    prev_person_state = True

                # Pose + Face 인식
                res = pose_estimator.detect(frame.copy()) 
                has_boxes = (getattr(res, "boxes", None) is not None) and (res.boxes.xyxy is not None)
                has_kps = (getattr(res, "keypoints", None) is not None)

                if has_boxes and has_kps:
                    kps = res.keypoints.xy.cpu().numpy()
                    boxes = res.boxes.xyxy.cpu().numpy()
                    n_pose = int(res.boxes.shape[0])
                else:
                    n_pose = 0

                user_verified = True  # False 시 얼굴 인식 함께 진행
                if n_pose > 0:
                    # 얼굴 인식
                    results = face_recognizer.recognize(frame)
                    matched = sum(1 for uid, sim, bbox in results if uid)
                    user_verified = matched > 0

                    # 각 사람에 대해 자세 분석
                    for i, box in enumerate(boxes):
                        try:
                            action = pose_estimator.classify_action(kps[i], box)
                            print("[DEBUG] Detected Action:", action)
                            notifier.check_and_notify(action, user_verified)
                        except Exception as e:
                            print("[ERROR] classify_action failed:", e)
                            continue

            # 사람이 일정 시간 안 보이면 비활성화
            elif active and (time.time() - last_seen) > ACTIVE_TIMEOUT:
                print("[SYSTEM] 5초 이상 사람 없음 → 비활성화 전환")
                active = False
                prev_person_state = False  # 다음에 새로 들어올 때 True 한번만 보내기
                notifier.check_and_notify("Unknown", user_verified=False)

            # 기본 대기 화면 (사람 없을 때)
            elif not active:
                cv2.putText(frame, "Idle - No Person Detected", (20, 40),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 0, 255), 2)
                cv2.imshow("Pose+Face", frame)

            # 종료 조건
            if cv2.waitKey(1) & 0xFF in (ord('q'), 27):
                break

    finally:
        cap.release()
        cv2.destroyAllWindows()
        mqtt_client.disconnect()

if __name__ == "__main__":
    main()
