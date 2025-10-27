# tts_player.py
import os
from google.cloud import texttospeech
import subprocess
import tempfile

# Google 인증 키 JSON 경로 (환경변수에 미리 설정하는 게 안전)
# 예: ~/.bashrc 에 추가
# export GOOGLE_APPLICATION_CREDENTIALS="/home/pi/google_tts_key.json"

def speak(text: str):
    """
    Google Cloud TTS를 이용해 텍스트를 음성으로 변환하고 재생
    - text: 출력할 문자열
    """
    try:
        # 클라이언트 초기화
        client = texttospeech.TextToSpeechClient()

        # 요청 설정
        synthesis_input = texttospeech.SynthesisInput(text=text)

        voice = texttospeech.VoiceSelectionParams(
            language_code="ko-KR",   # 한국어
            ssml_gender=texttospeech.SsmlVoiceGender.FEMALE
        )

        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.LINEAR16,  # PCM (wav 호환)
            speaking_rate=1.0
        )

        # 요청 보내기
        response = client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )

        # 임시 wav 파일 저장
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as out:
            out.write(response.audio_content)
            tmp_path = out.name

        # aplay 로 재생 (라즈베리파이 기본 wav 플레이어)
        subprocess.run(["aplay", "-q", tmp_path], check=False)

        # 재생 후 파일 삭제
        os.remove(tmp_path)

    except Exception as e:
        print("[TTS] Error:", e)
