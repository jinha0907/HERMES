import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type Alarm = {
  id: number;
  title: string;
  time: string;
  summary?: string;
};

const AlarmListPage = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);

  // 🔹 알림 목록 불러오기
  useEffect(() => {
    fetch("http://localhost:8080/app-notif")
      .then((res) => res.json())
      .then((data) => setAlarms(data))
      .catch((err) => console.error("Error fetching alarms:", err));
  }, []);

  // 🔹 알림 삭제
  const handleDelete = async (id: number) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      await fetch(`http://localhost:8080/app-notif/${id}`, {
        method: "DELETE",
      });
      setAlarms((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("Error deleting alarm:", err);
      alert("삭제 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="w-[1024px] h-[600px] mx-auto bg-gray-900 text-white p-6 flex flex-col">
      {/* 헤더 */}
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl ml-2 font-extrabold">알림 리스트</h1>
        <Link
          to="/"
          className="px-6 py-3 bg-gray-200 text-black text-3xl rounded-2xl font-bold"
        >
          홈으로
        </Link>
      </header>

      {/* 알림 목록 */}
      <main className="flex-1 overflow-y-auto space-y-4 pr-2">
        {alarms.length > 0 ? (
          alarms.map((alarm) => (
            <div
              key={alarm.id}
              className="bg-gray-700 rounded-2xl p-6 flex justify-between items-center shadow-lg"
            >
              <Link
                to={`/alarms/${alarm.id}`}
                className="flex-1 pr-4 hover:opacity-90 transition"
              >
                <p className="text-3xl font-semibold">{alarm.title}</p>
                <p className="text-xl text-gray-300 mt-2">{alarm.time}</p>
              </Link>

              {/* 삭제 버튼 */}
              <button
                onClick={() => handleDelete(alarm.id)}
                className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-2xl font-bold"
              >
                삭제
              </button>
            </div>
          ))
        ) : (
          <p className="text-center text-3xl text-gray-400 mt-20">
            등록된 알림이 없습니다
          </p>
        )}
      </main>
    </div>
  );
};

export default AlarmListPage;
