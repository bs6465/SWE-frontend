// src/components/StatusCards.jsx
import React from 'react';

// 1. [수정] props 받기
function StatusCards({ onStatusClick, onTimezoneClick, onlineCount, totalCount }) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 1. 팀원 현황 카드 */}
      <div
        id="statusCard"
        className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow cursor-pointer"
        onClick={onStatusClick}
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-2">팀원 현황</h3>

        {/* 2. [수정] props로 받은 데이터 표시 */}
        <p className="text-gray-600">
          현재 온라인:
          <span className="font-bold text-green-600"> {onlineCount}</span> / {totalCount}
        </p>

        <div className="flex space-x-2 mt-4">{/* TODO: (나중에) 아바타 아이콘 목록 */}</div>
      </div>

      {/* 2. 시간대 카드 */}
      {/* ... (동일) ... */}
    </section>
  );
}

export default StatusCards;
