import React, { useState, useEffect } from 'react';

function TimezoneModal({ isOpen, onClose, teamMembers, currentUser, onUpdateTimezone }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false); // 수정 모드 State

  // 주요 타임존 목록 (선택지)
  const timezoneOptions = [
    'Asia/Seoul',
    'Asia/Tokyo',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Australia/Sydney',
  ];

  // 1초마다 시간 갱신
  useEffect(() => {
    if (!isOpen) return;
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  // [신규] 시간대 변경 핸들러
  const handleChangeTimezone = async (newTimezone) => {
    if (!window.confirm(`${newTimezone}으로 시간대를 변경하시겠습니까?`)) return;

    try {
      // 오프셋 계산은 복잡하므로 일단 백엔드나 DB 기본값에 맡기거나,
      // 여기서 간단히 0으로 보내고 백엔드에서 처리하도록 할 수 있습니다.
      // 정확하게 하려면 라이브러리(moment-timezone)가 필요하지만,
      // 여기서는 브라우저 API로 가능한 선에서 처리합니다.
      const response = await fetch('/api/auth/timezone', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          timezone: newTimezone,
          timezoneOffset: 0, // (임시) 오프셋은 moment.js 없이 정확히 구하기 까다로우므로 0 또는 생략
        }),
      });

      if (!response.ok) throw new Error('변경 실패');

      const data = await response.json();

      // App.jsx의 currentUser 상태 업데이트 (화면 즉시 반영을 위해)
      onUpdateTimezone(data.user);

      setIsEditing(false);
      alert('시간대가 변경되었습니다.');
    } catch (err) {
      alert(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-4">글로벌 시간대</h2>

        {/* 1. [신규] 내 시간대 설정 영역 */}
        <div className="bg-indigo-50 p-4 rounded-lg mb-6 flex justify-between items-center">
          <div>
            <p className="text-sm text-indigo-600 font-semibold">나의 시간대</p>
            {isEditing ? (
              <select
                className="mt-1 p-1 border rounded"
                value={currentUser?.timezone}
                onChange={(e) => handleChangeTimezone(e.target.value)}
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-lg font-bold text-indigo-900">
                {currentUser?.timezone || 'Asia/Seoul'}
              </p>
            )}
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-xs text-indigo-500 underline hover:text-indigo-700"
          >
            {isEditing ? '취소' : '변경'}
          </button>
        </div>

        <p className="text-gray-600 mb-4">팀원들의 현재 현지 시간입니다.</p>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {teamMembers?.map((member) => {
            const tz = member.timezone || 'Asia/Seoul';
            // 해당 타임존의 시간 문자열 구하기
            const localTime = currentTime.toLocaleTimeString('ko-KR', {
              timeZone: tz,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: true,
            });
            const localDate = currentTime.toLocaleDateString('ko-KR', {
              timeZone: tz,
              month: 'short',
              day: 'numeric',
            });

            const isMe = member.user_id === currentUser?.user_id;

            return (
              <div
                key={member.user_id}
                className={`flex justify-between items-center p-3 rounded-lg ${
                  isMe ? 'bg-indigo-50 border border-indigo-200' : 'bg-gray-50'
                }`}
              >
                <div>
                  <div className="font-semibold text-gray-800 flex items-center">
                    {member.username}
                    {isMe && (
                      <span className="ml-2 text-xs bg-indigo-200 text-indigo-700 px-1.5 py-0.5 rounded">
                        나
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">{tz}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono font-bold text-gray-700">{localTime}</div>
                  <div className="text-xs text-gray-500">{localDate}</div>
                </div>
              </div>
            );
          })}
        </div>

        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 w-full"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default TimezoneModal;
