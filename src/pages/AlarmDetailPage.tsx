import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

type Alarm = {
  id: number;
  title: string;
  text: string;
  posted_at_utc?: string;
  received_at?: number;
  summary?: string;
};

const AlarmDetailPage = () => {
  const { id } = useParams();
  const [alarm, setAlarm] = useState<Alarm | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:8080/app-notif`)
      .then((res) => res.json())
      .then((data: Alarm[]) => {
        const found = data.find((a) => String(a.id) === id);
        setAlarm(found || null);
      })
      .catch((err) => console.error("Error fetching alarm:", err))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = () => {
    if (!alarm) return;
    fetch(`http://localhost:8080/app-notif/${alarm.id}`, { method: "DELETE" })
      .then((res) => res.json())
      .then(() => {
        toast.success("✅ 알림이 삭제되었습니다.", {
          style: {
            fontSize: "1.5rem",
            padding: "20px",
            minWidth: "400px",
            textAlign: "center",
          },
          duration: 3000,
        });
        setTimeout(() => (window.location.href = "/alarms"), 1500);
      })
      .catch((err) => console.error("Error deleting:", err))
      .finally(() => setShowModal(false));
  };

  if (loading) {
    return (
      <div className="w-[1024px] mx-auto bg-gray-900 text-white flex items-center justify-center text-3xl">
        불러오는 중...
      </div>
    );
  }

  if (!alarm) {
    return (
      <div className="w-[1024px] mx-auto bg-gray-900 text-white p-12 flex flex-col items-center justify-center">
        <p className="text-3xl font-bold mb-10">알림을 찾을 수 없습니다</p>
        <Link
          to="/alarms"
          className="bg-blue-600 px-10 py-6 rounded-2xl text-2xl font-bold"
        >
          알림 리스트로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="h-full min-h-screen bg-gray-900">
      <div className="w-[1024px] mx-auto bg-gray-900 text-white p-12 flex flex-col relative">
        <Toaster
          position="top-center"
          reverseOrder={false}
          containerStyle={{ marginTop: "30px" }}
        />

        <h2 className="text-4xl font-extrabold mb-10 text-center">
          알림 상세보기
        </h2>

        <div className="bg-gray-700 p-8 rounded-3xl shadow-xl flex-1 space-y-8 text-left">
          <p className="text-4xl">
            <strong className="text-blue-400">제목: </strong>
            {alarm.title}
          </p>
          <p className="text-3xl">
            <strong className="text-blue-400">내용: </strong>
            {alarm.text || "내용 없음"}
          </p>
          <p className="text-2xl text-gray-300">
            <strong>요약: </strong>
            {alarm.summary || "요약 없음"}
          </p>
          <p className="text-2xl text-gray-400">
            <strong>수신 시각: </strong>
            {new Date(alarm.received_at || 0).toLocaleString()}
          </p>
        </div>

        <div className="flex justify-between mt-12 space-x-6">
          <Link
            to="/alarms"
            className="bg-blue-600 px-10 py-6 rounded-3xl text-2xl font-bold w-1/2 text-center"
          >
            뒤로 가기
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="bg-red-600 px-10 py-6 rounded-3xl text-2xl font-bold w-1/2"
          >
            삭제
          </button>
        </div>

        {showModal && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
            <div className="bg-gray-800 p-12 rounded-2xl shadow-2xl text-center w-[480px]">
              <p className="text-3xl mb-10">정말 삭제하시겠습니까?</p>
              <div className="flex justify-between gap-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="bg-gray-500 px-6 py-3 rounded-xl text-2xl font-bold w-1/2"
                >
                  취소
                </button>
                <button
                  onClick={handleDelete}
                  className="bg-red-600 px-8 py-5 rounded-xl text-2xl font-bold w-1/2"
                >
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlarmDetailPage;
