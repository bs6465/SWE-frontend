import React, { useState, useEffect, useMemo } from 'react';

// 1. [신규] 색상 변환 헬퍼 함수 (Hex -> RGBA)
// alpha 값(0.0 ~ 1.0)을 조절해 연한 배경색을 만듭니다.
const getLightColor = (hex, alpha = 0.2) => {
  if (!hex) return `rgba(99, 102, 241, ${alpha})`; // 기본값 (Indigo)
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 날짜 비교 헬퍼
const isSameDate = (d1, d2) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

const toYYYYMMDD = (d) => d.toISOString().split('T')[0];

function Calendar({ currentUser, socket, onEventClick, onAddScheduleClick }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState([]);
  const token = localStorage.getItem('token');

  // ... (useEffect 데이터 로드 및 소켓 로직은 기존과 동일) ...
  useEffect(() => {
    if (!token || !currentUser?.team_id) return;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;
    const fetchSchedules = async () => {
      try {
        const res = await fetch(`/api/schedules/month?year=${year}&month=${month}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (res.ok) setSchedules(await res.json());
      } catch (err) {
        console.error(err);
      }
    };
    fetchSchedules();
  }, [currentDate, currentUser, token]);

  useEffect(() => {
    if (!socket) return;
    const refresh = () => setCurrentDate((d) => new Date(d));
    socket.on('scheduleAdded', refresh);
    socket.on('scheduleUpdated', refresh);
    socket.on('scheduleRemoved', refresh);
    socket.on('createTask', refresh);
    socket.on('isTaskCompletedChanged', refresh);
    socket.on('deleteTask', refresh);
    return () => {
      socket.off('scheduleAdded');
      socket.off('scheduleUpdated');
      socket.off('scheduleRemoved');
      socket.off('createTask');
      socket.off('isTaskCompletedChanged');
      socket.off('deleteTask');
    };
  }, [socket]);

  // 달력 그리드 생성 (테트리스 알고리즘 포함)
  const calendarWeeks = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(firstDayOfMonth.getDate() - firstDayOfMonth.getDay());
    const endDate = new Date(lastDayOfMonth);
    endDate.setDate(lastDayOfMonth.getDate() + (6 - lastDayOfMonth.getDay()));

    const weeks = [];
    let currentWeek = [];
    let dayIter = new Date(startDate);

    while (dayIter <= endDate) {
      currentWeek.push({
        date: new Date(dayIter),
        isCurrentMonth: dayIter.getMonth() === month,
      });
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      dayIter.setDate(dayIter.getDate() + 1);
    }
    return weeks;
  }, [currentDate]);

  // 주별 일정 배치 (Tetris Logic)
  const processWeekEvents = (week) => {
    const weekStart = week[0].date;
    const weekEnd = week[6].date;
    weekStart.setHours(0, 0, 0, 0);
    weekEnd.setHours(23, 59, 59, 999);

    const weekEvents = schedules.filter((sch) => {
      const s = new Date(sch.start_time);
      const e = new Date(sch.end_time);
      s.setHours(0, 0, 0, 0);
      e.setHours(23, 59, 59, 999);
      return s <= weekEnd && e >= weekStart;
    });

    weekEvents.sort((a, b) => {
      const startA = new Date(a.start_time).getTime();
      const startB = new Date(b.start_time).getTime();
      if (startA !== startB) return startA - startB;
      const durA = new Date(a.end_time) - new Date(a.start_time);
      const durB = new Date(b.end_time) - new Date(b.start_time);
      return durB - durA;
    });

    const slots = [];
    const processedEvents = weekEvents.map((sch) => {
      const s = new Date(sch.start_time);
      const e = new Date(sch.end_time);
      s.setHours(0, 0, 0, 0);
      e.setHours(0, 0, 0, 0);

      let startIdx = Math.floor((s - weekStart) / (1000 * 60 * 60 * 24));
      let endIdx = Math.floor((e - weekStart) / (1000 * 60 * 60 * 24));

      const isContinuesLeft = startIdx < 0;
      const isContinuesRight = endIdx > 6;
      if (startIdx < 0) startIdx = 0;
      if (endIdx > 6) endIdx = 6;

      let assignedSlot = -1;
      for (let i = 0; i < slots.length; i++) {
        if (slots[i] < startIdx) {
          assignedSlot = i;
          slots[i] = endIdx;
          break;
        }
      }
      if (assignedSlot === -1) {
        assignedSlot = slots.length;
        slots.push(endIdx);
      }

      return {
        ...sch,
        layout: {
          startIdx,
          endIdx,
          span: endIdx - startIdx + 1,
          isContinuesLeft,
          isContinuesRight,
          slotIndex: assignedSlot,
        },
      };
    });
    return { events: processedEvents, totalSlots: slots.length };
  };

  return (
    <section className="mb-8 select-none">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
        </h2>
        <div className="space-x-2">
          <button
            onClick={onAddScheduleClick}
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold shadow-sm"
          >
            + 일정 추가
          </button>
          <button
            onClick={() =>
              setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))
            }
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            &lt; 이전
          </button>
          <button
            onClick={() =>
              setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))
            }
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            다음 &gt;
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b bg-gray-50">
          {['일', '월', '화', '수', '목', '금', '토'].map((d) => (
            <div key={d} className="py-2 text-center text-sm font-bold text-gray-500">
              {d}
            </div>
          ))}
        </div>

        <div className="flex flex-col">
          {calendarWeeks.map((week, wIndex) => {
            const { events, totalSlots } = processWeekEvents(week);
            const rowHeight = Math.max(100, totalSlots * 26 + 35);

            return (
              <div
                key={wIndex}
                className="grid grid-cols-7 border-b relative"
                style={{ height: `${rowHeight}px` }}
              >
                {/* 배경 그리드 */}
                {week.map((dayInfo, dIndex) => (
                  <div
                    key={dIndex}
                    className={`border-r p-1 h-full ${
                      dayInfo.isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <span
                      className={`text-sm font-medium block w-7 h-7 leading-7 text-center ${
                        isSameDate(dayInfo.date, new Date())
                          ? 'bg-indigo-600 text-white rounded-full'
                          : dayInfo.isCurrentMonth
                          ? 'text-gray-700'
                          : 'text-gray-400'
                      }`}
                    >
                      {dayInfo.date.getDate()}
                    </span>
                  </div>
                ))}

                {/* 이벤트 바 */}
                <div className="absolute top-8 left-0 w-full px-0">
                  {events.map((sch) => {
                    const totalDuration = new Date(sch.end_time) - new Date(sch.start_time);
                    const percentRatio =
                      sch.total_tasks > 0 ? sch.completed_tasks / sch.total_tasks : 0;

                    // 👇 [수정] 100%일 때 시간 계산 무시하고 강제로 100으로 설정
                    let fillPercent = 0;


                    if (percentRatio === 1) {
                      fillPercent = 100; // 👈 100%면 무조건 꽉 채움 (시간 차이 무시)
                    } else {
                      // 100%가 아닐 때만 기존 시간 기반 계산 수행
                      const progressEndTime = new Date(
                        new Date(sch.start_time).getTime() + totalDuration * percentRatio,
                      );

                      const weekStart = new Date(week[sch.layout.startIdx].date);
                      weekStart.setHours(0, 0, 0, 0);
                      const weekEnd = new Date(week[sch.layout.endIdx].date);
                      weekEnd.setHours(23, 59, 59, 999);

                      if (progressEndTime < weekStart) fillPercent = 0;
                      else if (progressEndTime > weekEnd) fillPercent = 100;
                      else
                        fillPercent = ((progressEndTime - weekStart) / (weekEnd - weekStart)) * 100;
                    }

                    const displayPercent = Math.round(percentRatio * 100);
                    const { layout } = sch;

                    // 2. [핵심] 해당 일정 색상의 연한 버전(배경용) 계산 (투명도 0.2)
                    const lightBgColor = getLightColor(sch.color, 0.2);

                    return (
                      <div
                        key={sch.schedule_id}
                        className={`
                          absolute h-[22px] text-xs cursor-pointer flex items-center shadow-sm hover:brightness-95 transition-all border border-white/20 box-border
                          ${
                            layout.isContinuesLeft
                              ? 'rounded-l-none border-l-0'
                              : 'rounded-l-md ml-1'
                          } 
                          ${
                            layout.isContinuesRight
                              ? 'rounded-r-none border-r-0'
                              : 'rounded-r-md mr-1'
                          }
                        `}
                        style={{
                          left: `${(layout.startIdx / 7) * 100}%`,
                          width: `calc(${(layout.span / 7) * 100}% - ${
                            layout.isContinuesLeft ? 0 : 4
                          }px - ${layout.isContinuesRight ? 0 : 4}px)`,

                          // 3. [핵심] 회색 대신 '연한 일정 색상'을 배경으로 사용
                          backgroundColor: lightBgColor,

                          top: `${layout.slotIndex * 26}px`,
                          zIndex: 10,
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick(sch);
                        }}
                      >
                        {/* 진행률 게이지 (진한 원본 색상) */}
                        <div
                          className={`absolute top-0 left-0 h-full transition-all duration-500 ${
                            layout.isContinuesLeft ? 'rounded-l-none' : 'rounded-l-md'
                          } ${layout.isContinuesRight || fillPercent < 100 ? '' : 'rounded-r-md'}`}
                          style={{
                            width: `${fillPercent}%`,
                            backgroundColor: sch.color || '#6366f1',
                          }}
                        />

                        {/* 텍스트: 진행바가 덮으면(>40%) 흰색, 아니면 짙은 색 */}
                        <span
                          className="relative z-10 px-2 truncate font-semibold"
                          style={{
                            // 짙은 색 텍스트도 '검정' 대신 '일정 색의 아주 짙은 버전'이나 '짙은 회색' 사용
                            color: fillPercent > 40 ? 'white' : '#1f2937',
                            textShadow: fillPercent > 40 ? '0px 0px 2px rgba(0,0,0,0.3)' : 'none',
                          }}
                        >
                          {(!layout.isContinuesLeft || new Date(sch.start_time).getDay() === 0) && (
                            <>
                              {sch.title}{' '}
                              <span className="opacity-90 text-[10px] font-normal ml-1">
                                {sch.total_tasks > 0 ? `${displayPercent}%` : ''}
                              </span>
                            </>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default Calendar;
