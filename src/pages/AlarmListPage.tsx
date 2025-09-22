import { Link } from "react-router-dom";
import { dummyAlarms } from "../data/dummyAlarms";

const getTypeIcon = (title: string) => {
  if (title.includes("은행") || title.includes("카드")) return "💰";
  if (title.includes("택배")) return "📦";
  if (title.includes("약")) return "💊";
  if (title.includes("예약") || title.includes("캘린더")) return "📅";
  return "🔔";
};

const AlarmListPage = () => {
  return (
    <div className="w-[1024px] h-[600px] mx-auto bg-gray-900 text-white p-6 flex flex-col">
      {/* 헤더 */}
      <header className="mb-6 flex justify-between items-center">
        <h1 className="text-4xl ml-2 font-extrabold">알림 리스트</h1>
        <Link
          to="/"
          className="px-6 py-3 bg-gray-200 text-black text-3xl rounded-2xl font-bold"
          role="button"
        >
          홈으로
        </Link>
      </header>

      {/* 알림 목록 */}
      <main className="flex-1 overflow-y-auto space-y-4 pr-2">
        {dummyAlarms.map((alarm) => (
          <div
            key={alarm.id}
            className="bg-gray-700 rounded-2xl p-6 flex justify-between items-center shadow-lg"
          >
            {/* 알림 내용 → 클릭 시 상세보기 */}
            <Link
              to={`/alarms/${alarm.id}`}
              className="flex-1 pr-4 hover:opacity-90 transition"
            >
              <p className="text-3xl font-semibold flex items-center gap-2">
                <span>{getTypeIcon(alarm.title)}</span>
                {alarm.title}
              </p>
              <p className="text-xl text-gray-300 mt-2">{alarm.time}</p>
            </Link>

            {/* 액션 버튼 */}
            <div className="flex flex-col space-y-2 w-44">
              <button className="px-4 py-3 rounded-xl bg-blue-500 text-xl font-bold">
                다시 울리기
              </button>
              <button className="px-4 py-3 rounded-xl bg-red-600 text-xl font-bold">
                삭제
              </button>
            </div>
          </div>
        ))}
        <div className="h-6" />
      </main>
    </div>
  );
};

export default AlarmListPage;
