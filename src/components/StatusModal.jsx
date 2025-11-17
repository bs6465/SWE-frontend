// src/components/StatusModal.jsx
import React, { useMemo } from 'react'; // 👈 useMemo 추가

// 1. [수정] props 받기
function StatusModal({ isOpen, onClose, teamMembers, onlineUsers, onAddMemberClick }) {
  if (!isOpen) {
    return null;
  }

  // 2. [신규] 'onlineUsers'는 ID 목록(예: ['user_id_abc'])일 수 있으므로
  //    빠른 조회를 위해 Set으로 변환합니다. (성능 최적화)
  const onlineUserSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">팀원 현황 (실시간)</h2>

        {/* 3. [수정] 하드코딩된 텍스트 대신, 실제 목록을 map으로 렌더링 */}
        <div className="space-y-3 max-h-60 overflow-y-auto">
          {teamMembers?.length > 0 ? (
            teamMembers.map((member) => {
              // 4. [신규] 이 멤버가 onlineUserSet에 있는지 확인
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
          onClick={onAddMemberClick} // 👈 App.jsx의 핸들러 호출
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
      </div>
    </div>
  );
}

export default StatusModal;
