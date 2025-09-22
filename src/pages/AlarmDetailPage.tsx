import { Link, useParams } from "react-router-dom";
import { dummyAlarms } from "../data/dummyAlarms";
import { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

const AlarmDetailPage = () => {
  const { id } = useParams();
  const alarm = dummyAlarms.find((a) => a.id === id);

  const [showModal, setShowModal] = useState(false);

  if (!alarm) {
    return (
      <div className="w-[1024px] h-[600px] mx-auto bg-gray-900 text-white p-12 flex flex-col items-center justify-center">
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

  const handleDelete = () => {
    setShowModal(false); // 모달 닫기
    toast.success("✅ 알림이 삭제되었습니다.", {
      style: {
        fontSize: "1.5rem",
        padding: "20px",
        minWidth: "400px",
        textAlign: "center",
      },
      duration: 3000,
    });
  };

  return (
    <div className="w-[1024px] h-[600px] mx-auto bg-gray-900 text-white p-12 flex flex-col relative">
      {/* Toaster: 토스트 표시 (상단에서 조금 더 떨어짐) */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          marginTop: "30px",
        }}
      />

      {/* 제목 */}
      <h2 className="text-4xl font-extrabold mb-10 text-center">
        알림 {alarm.id} 상세보기
      </h2>

      {/* 알림 상세 카드 */}
      <div className="bg-gray-700 p-8 rounded-3xl shadow-xl flex-1 space-y-8 text-left">
        <p className="text-4xl">
          <strong className="text-blue-400">제목: </strong>
          {alarm.title}
        </p>
        <p className="text-3xl">
          <strong className="text-blue-400">수신 시각: </strong>
          {alarm.time}
        </p>
      </div>

      {/* 하단 버튼 */}
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

      {/* 삭제 확인 모달 */}
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
  );
};

export default AlarmDetailPage;
