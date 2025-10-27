# tts_player.py
import numpy as np
import wave
import subprocess
import tempfile
from google.cloud import texttospeech
import config

client = texttospeech.TextToSpeechClient()

def text_to_pcm(text: str):
    """Google TTS 호출 → PCM16 numpy 배열 반환"""
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(
        language_code=config.VOICE_LANG,
        name=config.VOICE_NAME,
    )
    audio_config = texttospeech.AudioConfig(
        audio_encoding=texttospeech.AudioEncoding.LINEAR16,
        sample_rate_hertz=24000, 
    )

    response = client.synthesize_speech(
        input=synthesis_input, voice=voice, audio_config=audio_config
    )
    pcm16 = np.frombuffer(response.audio_content, dtype=np.int16)
    return pcm16


def play_pcm(pcm16: np.ndarray):
    """PCM16 → 임시 WAV 저장 후 ALSA로 재생 (유선 AUX 출력)"""
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
        wav_path = f.name
        with wave.open(wav_path, "wb") as wf:
            wf.setnchannels(1)        # 모노
            wf.setsampwidth(2)        # 16bit
            wf.setframerate(24000)    # 24kHz
            wf.writeframes(pcm16.tobytes())

    # 유선 출력: card 0, device 0 (bcm2835 Headphones)
    subprocess.run(["aplay", "-D", "hw:0,0", "-r", "24000", wav_path])


def speak(text: str):
    print(f"[TTS] {text}")
    pcm16 = text_to_pcm(text)
    play_pcm(pcm16)
