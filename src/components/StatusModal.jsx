// src/components/StatusModal.jsx
import React, { useMemo, useState } from 'react';
import { FaTimes } from 'react-icons/fa';

//  props 받기
function StatusModal({
  isOpen,
  onClose,
  teamMembers,
  onlineUsers,
  onAddMemberClick,
  onLeaveSuccess,
  currentUser,
  teamOwnerId,
}) {
  if (!isOpen) return null;

  //'onlineUsers'는 ID 목록(예: ['user_id_abc'])일 수 있으므로
  // 빠른 조회를 위해 Set으로 변환합니다. (성능 최적화)
  const onlineUserSet = useMemo(() => new Set(onlineUsers), [onlineUsers]);
  const [isLoading, setIsLoading] = useState(false);

  // 현재 로그인한 사람이 팀장인지 확인
  const isMeOwner = currentUser?.user_id === teamOwnerId;

  // --- 팀 삭제 핸들러 (팀장용) ---
  const handleDeleteTeam = async () => {
    if (
      !window.confirm(
        '경고: 팀을 삭제하면 모든 팀원과 데이터가 영구적으로 삭제됩니다. 계속하시겠습니까?',
      )
    )
      return;

    setIsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/team/delete-team', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '팀 삭제 실패');

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      alert('팀이 삭제되었습니다.');
      onLeaveSuccess(); // App.jsx의 후처리(로그아웃/이동) 실행
      onClose();
    } catch (err) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- 멤버 강퇴 핸들러 (팀장용) ---
  const handleKickMember = async (targetUserId, targetUsername) => {
    if (!window.confirm(`${targetUsername}님을 팀에서 내보내시겠습니까?`)) return;

    const token = localStorage.getItem('token');
    try {
      const response = await fetch('/api/team/members', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deleteUserId: targetUserId }),
      });

      if (!response.ok) throw new Error('강퇴 실패');

      alert(`${targetUsername}님을 내보냈습니다.`);
    } catch (err) {
      alert(err.message);
    }
  };

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

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

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
        <h2 className="text-2xl font-bold mb-4">
          팀원 현황 {isMeOwner && <span className="text-sm text-indigo-500">(팀장)</span>}
        </h2>

        <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
          {teamMembers?.length > 0 ? (
            teamMembers.map((member) => {
              const isOnline = onlineUserSet.has(member.user_id);
              const isTargetMe = member.user_id === currentUser?.user_id;
              const isTargetOwner = member.user_id === teamOwnerId;

              return (
                <div
                  key={member.user_id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100"
                >
                  <div className="flex items-center">
                    <span className="font-medium">
                      {member.username}
                      {isTargetOwner && <span className="text-xs text-yellow-500 ml-1">👑</span>}
                    </span>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          isOnline ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      ></div>
                      <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-400'}`}>
                        {isOnline ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    {/* 강퇴 버튼: 나는 팀장이고 + 상대방은 내가 아닐 때 */}
                    {isMeOwner && !isTargetMe && (
                      <button
                        onClick={() => handleKickMember(member.user_id, member.username)}
                        className="text-red-400 hover:text-red-600 p-1"
                        title="팀에서 내보내기"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-gray-500">로딩 중...</p>
          )}
        </div>

        <div className="space-y-3">
          <button
            onClick={onAddMemberClick}
            className="w-full px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
          >
            + 새 팀원 추가
          </button>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300"
          >
            닫기
          </button>

          <hr className="border-gray-200" />

          {/* 팀장이면 '삭제', 팀원이면 '나가기' */}
          {isMeOwner ? (
            <button
              onClick={handleDeleteTeam}
              disabled={isLoading}
              className="w-full px-4 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition disabled:opacity-50"
            >
              ⚠️ 팀 삭제하기 (복구 불가)
            </button>
          ) : (
            <button
              onClick={handleLeaveTeam}
              className="w-full px-4 py-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
            >
              팀 나가기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default StatusModal;
