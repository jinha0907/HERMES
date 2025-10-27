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

  useEffect(() => {
    fetch("http://localhost:8080/app-notif")
      .then((res) => res.json())
      .then((data) => setAlarms(data))
      .catch((err) => console.error("Error fetching alarms:", err));
  }, []);

  return (
    <div className="w-[1024px] h-[600px] mx-auto bg-gray-900 text-white p-6 flex flex-col">
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl ml-2 font-extrabold">알림 리스트</h1>
        <Link
          to="/"
          className="px-6 py-3 bg-gray-200 text-black text-3xl rounded-2xl font-bold"
        >
          홈으로
        </Link>
      </header>

      <main className="flex-1 overflow-y-auto space-y-4 pr-2">
        {alarms.map((alarm) => (
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
          </div>
        ))}
      </main>
    </div>
  );
};

export default AlarmListPage;
