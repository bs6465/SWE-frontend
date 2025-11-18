// src/components/CreateScheduleModal.jsx
import React, { useState } from 'react';

// const API_URL = import.meta.env.VITE_API_URL;

function CreateScheduleModal({ isOpen, onClose }) {
  // 1. 폼 입력을 위한 State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [color, setColor] = useState('#6366f1'); // 기본색 (indigo)
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // 데이터 변환
    const startISO = new Date(startTime).toISOString();
    const endISO = new Date(endTime).toISOString();
    const finalColor = color.toUpperCase();

    try {
      const response = await fetch(`/api/schedules`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: title,
          description: description,
          start_time: startISO,
          end_time: endISO,
          color: finalColor,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '일정 생성 실패');
      }

      // 3. 성공 시: 모달 닫기
      // (Socket.io가 'scheduleAdded' 이벤트를 보내주므로
      //  Calendar.jsx는 자동으로 업데이트됩니다.)
      onClose();
      // 폼 초기화
      setTitle('');
      setDescription('');
      setStartTime('');
      setEndTime('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">새 일정 추가</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">제목 *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">설명</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
              rows="2"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">시작 (날짜/시간) *</label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">종료 (날짜/시간) *</label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">색상</label>
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-20 h-10 p-1 mt-1 border border-gray-300 rounded-lg"
            />
          </div>

          {error && <p className="text-sm text-center text-red-600">{error}</p>}

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
              생성하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateScheduleModal;
