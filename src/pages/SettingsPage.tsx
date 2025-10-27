import { Link } from "react-router-dom";
import { useState } from "react";

const SettingsPage = () => {
  const [volume, setVolume] = useState(80);
  const [dndStart, setDndStart] = useState("22:00");
  const [dndEnd, setDndEnd] = useState("07:00");
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // 🔊 서버로 볼륨 전송
  const handleVolumeChange = async (newVolume: number) => {
    setVolume(newVolume);
    setSending(true);
    setStatusMsg("서버에 전송 중...");

    try {
      const res = await fetch("http://localhost:8080/speaker/volume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ volume: newVolume }),
      });

      if (!res.ok) throw new Error("서버 응답 오류");
      const data = await res.json();
      console.log("[Volume API Response]", data);
      setStatusMsg(`서버에 볼륨 ${newVolume}% 설정 완료`);
    } catch (err) {
      console.error(err);
      setStatusMsg("⚠️ 서버 연결 실패");
    } finally {
      setSending(false);
      setTimeout(() => setStatusMsg(""), 2500);
    }
  };

  // 🔹 DND 설정 전송 함수
  const handleDndSubmit = async () => {
    setSending(true);
    setStatusMsg("서버에 전송 중...");

    try {
      const res = await fetch("http://localhost:8080/speaker/dnd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dndStart, dndEnd }),
      });

      if (!res.ok) throw new Error("서버 응답 오류");
      const data = await res.json();
      console.log("[DND API Response]", data);
      setStatusMsg(`⏰ 방해금지 시간 설정 완료: ${dndStart} ~ ${dndEnd}`);
    } catch (err) {
      console.error(err);
      setStatusMsg("⚠️ 서버 연결 실패");
    } finally {
      setSending(false);
      setTimeout(() => setStatusMsg(""), 2500);
    }
  };

  return (
    <div className="w-[1024px] h-[600px] mx-auto bg-gray-900 text-white p-10 flex flex-col">
      {/* 제목 */}
      <h2 className="text-4xl font-extrabold mb-10 text-center">환경 설정</h2>

      {/* 방해금지 설정 */}
      <div className="mb-12">
        <h3 className="text-3xl font-bold mb-4">⏰ 방해금지 설정</h3>
        <p className="text-yellow-400 mb-4 text-xl">
          설정된 시간에는 알림이 전달되지 않습니다
        </p>

        <div className="flex items-center gap-20">
          <div className="flex items-center gap-6">
            <input
              type="time"
              value={dndStart}
              onChange={(e) => setDndStart(e.target.value)}
              className="p-4 text-2xl text-black rounded-xl"
            />
            <span className="text-2xl">~</span>
            <input
              type="time"
              value={dndEnd}
              onChange={(e) => setDndEnd(e.target.value)}
              className="p-4 text-2xl text-black rounded-xl"
            />
          </div>
          <p className="text-3xl">
            현재 설정:{" "}
            <span className="font-bold text-green-400">
              {dndStart} ~ {dndEnd}
            </span>
          </p>
        </div>
      </div>

      {/* 볼륨 조절 */}
      <div className="mb-12">
        <h3 className="text-3xl font-bold mb-4">🔊 볼륨 조절</h3>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-full h-4 accent-blue-500 cursor-pointer"
          disabled={sending}
        />
        <p className="mt-4 text-2xl">현재 볼륨: {volume}%</p>
        {statusMsg && <p className="mt-2 text-xl text-gray-400">{statusMsg}</p>}
      </div>

      {/* 하단 버튼 영역 */}
      <div className="mt-auto flex justify-between gap-6">
        {/* DND 설정 적용 버튼 */}
        <button
          onClick={handleDndSubmit}
          disabled={sending}
          className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-2xl font-bold py-6 rounded-2xl transition"
        >
          설정 적용
        </button>

        {/* 뒤로 가기 버튼 */}
        <Link
          to="/"
          className="flex-1 text-center bg-blue-600 hover:bg-blue-700 py-6 rounded-2xl text-2xl font-bold transition"
        >
          뒤로 가기
        </Link>
      </div>
    </div>
  );
};

export default SettingsPage;
