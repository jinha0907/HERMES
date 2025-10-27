import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

type Alarm = {
  id: number;
  title: string;
  text: string;
  summary?: string;
  received_at?: number;
};

const MainPage = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8080/app-notif?limit=4")
      .then((res) => res.json())
      .then((data) => setAlarms(data))
      .catch((err) => console.error("Error fetching alarms:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-[1024px] h-[600px] mx-auto flex flex-col bg-gray-900 text-white p-6">
      {/* 상단 알림 목록 */}
      <div className="flex flex-col flex-none space-y-4 mb-6">
        {loading ? (
          <p className="text-center text-3xl text-gray-400">불러오는 중...</p>
        ) : alarms.length > 0 ? (
          alarms.map((alarm) => (
            <Link
              key={alarm.id}
              to={`/alarms/${alarm.id}`}
              className="block bg-gray-700 rounded-2xl p-5 text-center text-2xl font-semibold shadow-md hover:bg-gray-600 transition"
            >
              {alarm.title}
            </Link>
          ))
        ) : (
          <p className="text-center text-3xl text-gray-400">
            등록된 알림이 없습니다
          </p>
        )}
      </div>

      {/* 하단 영역 */}
      <div className="grid grid-cols-2 gap-4 flex-none">
        {/* 날씨 박스 + 로고 */}
        <div className="flex flex-col items-center justify-center bg-gray-700 rounded-2xl p-6 shadow-lg space-y-6">
          <div className="flex justify-center gap-4 w-full">
            <div className="flex items-center space-x-3">
              <span className="text-5xl">🌤</span>
              <div>
                <p className="text-2xl font-bold">흐림</p>
                <p className="text-xl">17℃ / 9℃</p>
              </div>
            </div>
            <p className="text-4xl font-extrabold ml-6">12℃</p>
          </div>

          <div className="flex flex-col items-center text-center">
            <p className="text-3xl font-extrabold tracking-widest">HERMES</p>
          </div>
        </div>

        {/* 환경 설정 + 알림 리스트 */}
        <div className="flex flex-col justify-between bg-gray-700 rounded-2xl p-6 shadow-lg text-center">
          <Link
            to="/settings"
            className="block w-full py-4 mb-3 bg-gray-400 rounded-2xl text-2xl font-bold hover:bg-gray-500 transition"
          >
            환경 설정
          </Link>
          <Link
            to="/alarms"
            className="block w-full py-4 mt-3 bg-blue-500 rounded-2xl text-2xl font-bold hover:bg-blue-600 transition"
          >
            알림 리스트
          </Link>
        </div>
      </div>
    </div>
  );
};

export default MainPage;
