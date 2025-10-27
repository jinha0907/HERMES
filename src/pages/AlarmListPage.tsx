import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

type Alarm = {
  id: number;
  title: string;
  time: string;
  summary?: string;
};

const AlarmListPage = () => {
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  // 🔹 알림 목록 불러오기
  useEffect(() => {
    fetch("http://localhost:8080/app-notif")
      .then((res) => res.json())
      .then((data) => setAlarms(data))
      .catch((err) => console.error("Error fetching alarms:", err));
  }, []);

  // 🔹 삭제 버튼 클릭 시 모달 열기
  const openDeleteModal = (id: number) => {
    setSelectedId(id);
    setShowModal(true);
  };

  // 🔹 실제 삭제 요청
  const handleDelete = async () => {
    if (!selectedId) return;

    try {
      const res = await fetch(`http://localhost:8080/app-notif/${selectedId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("삭제 실패");

      setAlarms((prev) => prev.filter((a) => a.id !== selectedId));
      toast.success("✅ 알림이 삭제되었습니다.", {
        style: {
          fontSize: "1.3rem",
          padding: "16px",
          minWidth: "400px",
          textAlign: "center",
        },
        duration: 3000,
      });
    } catch (err) {
      console.error("Error deleting alarm:", err);
      toast.error("⚠️ 삭제 중 오류가 발생했습니다.");
    } finally {
      setShowModal(false);
      setSelectedId(null);
    }
  };

  return (
    <div className="w-[1024px] h-[600px] mx-auto bg-gray-900 text-white p-6 flex flex-col relative">
      {/* ✅ Toast */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{ marginTop: "30px" }}
      />

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
              <div className="flex-1 pr-4">
                <p className="text-3xl font-semibold">{alarm.title}</p>
                <p className="text-xl text-gray-300 mt-2">{alarm.time}</p>
              </div>

              {/* 🔹 삭제 버튼 */}
              <button
                onClick={() => openDeleteModal(alarm.id)}
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

      {/* 🔻 삭제 확인 모달 */}
      {showModal && (
        <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
          <div className="bg-gray-800 p-10 rounded-2xl shadow-2xl text-center w-[480px]">
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
  );
};

export default AlarmListPage;
