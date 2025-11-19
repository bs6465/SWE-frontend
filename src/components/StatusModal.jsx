// src/components/StatusModal.jsx
import React, { useMemo, useState } from 'react'; // useMemo 추가

//  props 받기
function StatusModal({
  isOpen,
  onClose,
  teamMembers,
  onlineUsers,
  onAddMemberClick,
  onLeaveSuccess,
}) {
  if (!isOpen) {
    return null;
  }

  //'onlineUsers'는 ID 목록(예: ['user_id_abc'])일 수 있으므로
  // 빠른 조회를 위해 Set으로 변환합니다. (성능 최적화)
  const onlineUserSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);
  const [isLoading, setIsLoading] = useState(false);

  // 팀 나가기
  const handleLeaveTeam = async () => {
    if (!window.confirm('정말로 팀을 나가시겠습니까?')) return;

    setIsLoading(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/team/me', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '팀 나가기 실패');

      // 성공 처리
      // 로컬 스토리지 업데이트 (팀 정보 없는 새 토큰)
      localStorage.setItem('token', data.token);

      alert('팀에서 나왔습니다.');

      // 부모(App.jsx)에게 "성공했으니 후처리해라"고 알림
      onLeaveSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">팀원 현황 (실시간)</h2>

        <div className="space-y-3 max-h-60 overflow-y-auto">
          {teamMembers?.length > 0 ? (
            teamMembers.map((member) => {
              const isOnline = onlineUserSet.has(member.user_id);

              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100"
                >
                  <span className="font-medium">{member.username}</span>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                      {isOnline ? '온라인' : '오프라인'}
                    </span>
                    <div
                      className={`w-3 h-3 rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-gray-300'
                      }`}
                    ></div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">팀원 정보를 불러오는 중...</p>
          )}
        </div>

        <button
          onClick={onAddMemberClick} // App.jsx의 핸들러 호출
          className="mt-6 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 w-full"
        >
          + 새 팀원 추가
        </button>

        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          닫기
        </button>

        <hr className="border-gray-200" />

        {/* 팀 나가기 버튼 (위험하므로 빨간색/작은 글씨) */}
        <button
          onClick={handleLeaveTeam} // 👈 App.jsx에서 전달받은 핸들러 실행
          className="w-full px-4 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
        >
          팀 나가기
        </button>
      </div>
    </div>
  );
}

export default StatusModal;
