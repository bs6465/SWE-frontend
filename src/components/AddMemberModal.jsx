// src/components/AddMemberModal.jsx
import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

function AddMemberModal({ isOpen, onClose, currentUser }) {
  const [addUserId, setAddUserId] = useState('');
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // [참고] 백엔드에서 팀원 추가는 팀 오너만 가능하도록 검증하고 있습니다.
    if (currentUser.user_id === addUserId) {
      setError('자기 자신은 추가할 수 없습니다.');
      return;
    }

    try {
      // 1. API 호출 (team.controller.js의 addMember)
      const response = await fetch(`/api/team/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ addUserId }), // 백엔드에 addUserId 전달
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || '팀원 추가 실패');
      }

      // 2. 성공! (Socket.io가 'userAdded' 이벤트를 보내므로 UI는 자동 업데이트됩니다.)
      setMessage(data.message || `${addUserId} 님이 성공적으로 팀에 추가되었습니다.`);
      setAddUserId(''); // 입력 필드 초기화
      // TODO: (나중에) 모달을 닫고 StatusModal을 리프레시해야 합니다.
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">팀원 초대</h2>
        <p className="text-gray-600 mb-4">초대할 유저의 ID를 입력하세요.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">유저 ID</label>
            <input
              type="text"
              required
              value={addUserId}
              onChange={(e) => setAddUserId(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
              placeholder="예: user-b4f7-..."
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {message && <p className="text-sm text-green-600">{message}</p>}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              팀에 추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddMemberModal;
