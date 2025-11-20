// src/components/StatusCards.jsx
import React, { useState, useEffect } from 'react';

//  props 받기
function StatusCards({ onStatusClick, onTimezoneClick, onlineCount, totalCount, teamMembers }) {
  const [timeString, setTimeString] = useState('');

  // 시계 기능 (1초마다 갱신)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // 기본적으로 내 시간(브라우저 로컬) 표시
      setTimeString(
        now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  //  팀원들의 주요 타임존 추출
  // (예: ['Asia/Seoul', 'America/New_York'])
  const distinctTimezones = [...new Set(teamMembers?.map((m) => m.timezone || 'Asia/Seoul'))].slice(
    0,
    2,
  ); // 공간상 최대 2개만

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      {/* 1. 팀원 현황 카드 (기존 동일) */}
      <div
        id="statusCard"
        className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
        onClick={onStatusClick}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-2">팀원 현황</h3>
        <p className="text-gray-600">
          현재 온라인: <span className="font-bold text-green-600">{onlineCount}</span> /{' '}
          {totalCount}
        </p>
        <div className="mt-4 flex -space-x-2 overflow-hidden">
          {/* (나중에 아바타 추가) */}
          <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs text-gray-500">
            ...
          </div>
        </div>
      </div>

      {/* 2. [수정] 글로벌 시간대 카드 */}
      <div
        id="timezoneCard"
        className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer relative overflow-hidden"
        onClick={onTimezoneClick}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-1">팀 주요 시간대</h3>

        {/* 메인 시계 (내 시간) */}
        <div className="text-3xl font-bold text-indigo-600 mb-2">{timeString}</div>

        {/* 팀원들의 타임존 요약 */}
        <div className="space-y-1">
          {distinctTimezones.map((tz) => {
            const timeInTz = new Date().toLocaleTimeString('en-US', {
              timeZone: tz,
              hour: '2-digit',
              minute: '2-digit',
              hour12: false,
            });
            // 도시 이름만 추출 (Asia/Seoul -> Seoul)
            const city = tz.split('/')[1]?.replace('_', ' ') || tz;
            return (
              <div key={tz} className="flex justify-between text-sm text-gray-500">
                <span>{city}</span>
                <span className="font-mono">{timeInTz}</span>
              </div>
            );
          })}
        </div>

        {/* 장식용 배경 아이콘 */}
        <div className="absolute -bottom-4 -right-4 text-9xl text-indigo-50 opacity-20 pointer-events-none">
          🌍
        </div>
      </div>

      {/* 3. 예정된 기능 (빈 카드) */}
      {/* <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 opacity-50">
        <h3 className="text-lg font-semibold text-gray-500 mb-2">예정된 기능</h3>
        <p className="text-gray-400">작업 관리 통계...</p>
      </div> */}
    </section>
  );
}

export default StatusCards;
