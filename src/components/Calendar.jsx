// src/components/Calendar.jsx

import React, { useState, useEffect, useMemo } from 'react';

API_URL = process.env.VITE_API_URL;

// 헬퍼 함수: 날짜를 'YYYY-MM-DD' 형식으로 변환
const toYYYYMMDD = (date) => date.toISOString().split('T')[0];

function Calendar({ currentUser, socket, onEventClick, onAddScheduleClick }) {
  // 1. [State] 현재 사용자가 보고 있는 월 (기본값: 오늘)
  const [currentDate, setCurrentDate] = useState(new Date());

  // 2. [State] API로 불러온 이번 달 일정 목록
  const [schedules, setSchedules] = useState([]);

  const token = localStorage.getItem('token');

  // 3. [API Fetch Effect]
  // 'currentDate' (보고 있는 월)가 바뀔 때마다 실행
  useEffect(() => {
    if (!token || !currentUser?.team_id) return; // 팀 ID가 없으면 중단

    // 현재 연도와 월 (1-12)
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1; // getMonth()는 0-11 반환

    // 백엔드 API 호출 ('getSchedulesByMonth')
    const fetchSchedules = async () => {
      try {
        const response = await fetch(
          `/${API_URL}/api/schedules/month?year=${year}&month=${month}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store', // 캐시 방지
          },
        );
        if (!response.ok) throw new Error('일정 로드 실패');

        const data = await response.json();
        setSchedules(data); // 불러온 일정을 State에 저장
      } catch (err) {
        console.error('캘린더 일정 로드 오류:', err);
      }
    };

    fetchSchedules();
  }, [currentDate, currentUser, token]); // 월이 바뀌거나 유저가 확정될 때

  // 4. [Socket.io Effect]
  // 컴포넌트가 마운트될 때 딱 한 번 실행
  useEffect(() => {
    if (!socket) return;

    const handleScheduleAdded = (data) => {
      console.log('소켓: 일정 추가됨', data.schedule);
      // TODO: 이번 달에 해당하는 일정인지 확인하는 로직 (선택 사항)
      setSchedules((prevSchedules) => [...prevSchedules, data.schedule]);
    };

    // 이벤트 리스너: 다른 유저가 일정 삭제
    // 'schedule.controller.js'의 'deleteSchedule'
    const handleScheduleRemoved = (data) => {
      console.log('소켓: 일정 삭제됨', data.scheduleId);
      setSchedules((prevSchedules) =>
        prevSchedules.filter((s) => s.schedule_id !== data.scheduleId),
      );
    };

    // 'task.controller.js'의 이벤트들도 여기에서 처리
    //
    const handleTaskChange = (data) => {
      console.log('소켓: 태스크 변경', data);
      // (캘린더 새로고침 또는 특정 일정만 업데이트)
      // 지금은 간단히 console.log만
    };

    // 소켓 리스너 등록
    socket.on('scheduleAdded', handleScheduleAdded);
    socket.on('scheduleRemoved', handleScheduleRemoved);
    socket.on('createTask', handleTaskChange);
    socket.on('isTaskCompletedChanged', handleTaskChange);
    socket.on('deleteTask', handleTaskChange);

    // 컴포넌트 언마운트 시 리스너 정리
    return () => {
      socket.off('scheduleAdded', handleScheduleAdded);
      socket.off('scheduleRemoved', handleScheduleRemoved);
      socket.off('createTask', handleTaskChange);
      socket.off('isTaskCompletedChanged', handleTaskChange);
      socket.off('deleteTask', handleTaskChange);
    };
  }, [socket]); // socket 객체가 확정될 때

  // 5. [렌더링 로직] 현재 월의 날짜 배열 생성 (useMemo로 캐싱)
  const calendarGrid = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-11

    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0(일) - 6(토)
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // 30, 31 등

    const days = [];

    // 1일차가 시작하기 전의 빈 칸들
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ key: `empty-${i}`, date: null, events: [] });
    }

    // 실제 날짜 칸들
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = toYYYYMMDD(new Date(year, month, day));

      // 해당 날짜(dateStr)에 포함되는 일정들을 필터링
      const dayEvents = schedules.filter((schedule) => {
        const startDate = toYYYYMMDD(new Date(schedule.start_time));
        // const endDate = toYYYYMMDD(new Date(schedule.end_time));
        return dateStr === startDate;
      });

      days.push({ key: `day-${day}`, date: day, events: dayEvents });
    }

    return days;
  }, [currentDate, schedules]); // 월이 바뀌거나 일정이 바뀌면 재계산

  // 6. [핸들러] 월 변경
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  return (
    <section className="mb-8">
      {/* 월 이동 헤더 */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-800">
          {`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}
        </h2>
        <div className="space-x-2">
          {/* 2. '+ 일정 추가' 버튼 */}
          <button
            onClick={onAddScheduleClick} // App.jsx가 넘겨준 함수 호출
            className="px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-semibold"
          >
            + 일정 추가
          </button>
          <button
            onClick={goToPreviousMonth}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            &lt; 이전
          </button>
          <button
            onClick={goToNextMonth}
            className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
          >
            다음 &gt;
          </button>
        </div>
      </div>

      {/* 캘린더 그리드 */}
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b">
          {['일', '월', '화', '수', '목', '금', '토'].map((day) => (
            <div key={day} className="text-center font-semibold text-gray-600 p-3 text-sm">
              {day}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7">
          {calendarGrid.map((dayInfo) => (
            <div
              key={dayInfo.key}
              className={`calendar-cell relative ${!dayInfo.date ? 'bg-gray-50' : ''}`}
            >
              <span className="day-number text-gray-700">{dayInfo.date}</span>

              {/* 이벤트 렌더링 */}
              <div className="mt-1 space-y-1">
                {dayInfo.events.map((event) => (
                  <div
                    key={event.schedule_id}
                    // 'onEventClick'은 App.jsx에서 ProjectModal을 엽니다.
                    onClick={() => onEventClick(event)}
                    className="event-container p-1 rounded-md text-white text-xs truncate"
                    // 'schedule.controller.js'의 'color' 필드 사용
                    style={{ backgroundColor: event.color || '#6366f1' }} // 기본색(indigo)
                  >
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Calendar;
