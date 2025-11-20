import React, { useState, useEffect } from 'react';
import { FaTrash, FaCheckCircle, FaRegCircle, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

// [신규] Hex 색상을 연한 배경색(RGBA)으로 변환하는 헬퍼 함수
const getLightColor = (hex, alpha = 0.15) => {
  if (!hex) return `rgba(99, 102, 241, ${alpha})`; // 기본값 (Indigo)
  // #RRGGBB 형식 파싱
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// 날짜 포맷 헬퍼
const toLocalInputFormat = (isoString) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  const offset = date.getTimezoneOffset() * 60000;
  const localDate = new Date(date.getTime() - offset);
  return localDate.toISOString().slice(0, 16);
};

function ProjectModal({ isOpen, onClose, project: schedule }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const scheduleId = schedule?.schedule_id;

  // 모달 열릴 때 데이터 초기화
  useEffect(() => {
    if (isOpen && schedule) {
      setEditData({
        title: schedule.title,
        description: schedule.description || '',
        notes: schedule.notes || '',
        start_time: toLocalInputFormat(schedule.start_time),
        end_time: toLocalInputFormat(schedule.end_time),
        color: schedule.color || '#6366f1',
      });
      setIsEditing(false);
      setError(null);

      const fetchTasks = async () => {
        try {
          const res = await fetch(`/api/task/${scheduleId}`, {
            headers: { Authorization: `Bearer ${token}` },
            cache: 'no-store',
          });
          if (res.ok) setTasks(await res.json());
        } catch (err) {
          console.error(err);
        }
      };
      fetchTasks();
    }
  }, [isOpen, schedule, token, scheduleId]);

  // 수정 저장
  const handleSaveChanges = async () => {
    try {
      const startISO = new Date(editData.start_time).toISOString();
      const endISO = new Date(editData.end_time).toISOString();

      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...editData,
          start_time: startISO,
          end_time: endISO,
          color: editData.color,
        }),
      });

      if (!response.ok) throw new Error('수정 실패');

      setIsEditing(false);
      alert('저장되었습니다.');
    } catch (err) {
      setError(err.message);
    }
  };

  // 일정 삭제
  const handleDeleteSchedule = async () => {
    if (!window.confirm('일정을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) onClose();
    } catch (err) {
      alert('삭제 실패');
    }
  };

  // Task 핸들러들
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    try {
      const res = await fetch(`/api/task/${scheduleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTaskTitle }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [...prev, data.task]);
        setNewTaskTitle('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTask = async (taskId, isCompleted) => {
    try {
      const res = await fetch(`/api/task/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });
      if (res.ok)
        setTasks((prev) =>
          prev.map((t) => (t.task_id === taskId ? { ...t, is_completed: !isCompleted } : t)),
        );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const res = await fetch(`/api/task/delete/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setTasks((prev) => prev.filter((t) => t.task_id !== taskId));
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !schedule) return null;

  const completedCount = tasks.filter((t) => t.is_completed).length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // [신규] 현재 일정 색상을 기준으로 연한 배경색 생성
  const lightBgColor = getLightColor(isEditing ? editData.color : schedule.color);
  const mainColor = isEditing ? editData.color : schedule.color;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content max-h-[90vh] overflow-y-auto w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- 1. 헤더 (제목 및 버튼) --- */}
        <div className="flex justify-between items-start mb-4 border-b pb-3">
          <div className="flex-grow mr-4">
            {isEditing ? (
              <input
                className="text-2xl font-bold border-b-2 outline-none w-full p-1"
                style={{ borderColor: mainColor }}
                value={editData.title}
                onChange={(e) => setEditData({ ...editData, title: e.target.value })}
                placeholder="일정 제목"
              />
            ) : (
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                {/* 제목 옆에 색상 원 표시 */}
                <div
                  className="w-4 h-4 rounded-full mr-2 shrink-0"
                  style={{ backgroundColor: mainColor }}
                ></div>
                {schedule.title}
              </h2>
            )}
          </div>

          {/* [확인] 수정/삭제 버튼 영역 */}
          <div className="flex space-x-2 shrink-0">
            {isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(false)}
                  className="text-gray-400 hover:text-gray-600 p-2 rounded hover:bg-gray-100"
                >
                  <FaTimes size={18} />
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="text-green-600 hover:text-green-800 p-2 rounded hover:bg-green-50"
                >
                  <FaSave size={18} />
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="text-gray-500 hover:text-blue-600 p-2 rounded hover:bg-blue-50"
                title="수정"
              >
                <FaEdit size={18} />
              </button>
            )}
            <button
              onClick={handleDeleteSchedule}
              className="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50"
              title="삭제"
            >
              <FaTrash size={16} />
            </button>
          </div>
        </div>

        {/* --- 2. 본문 (배경색 적용) --- */}
        <div className="space-y-4 mb-6">
          {/* 일정 정보 박스 (연한 컬러 배경 적용) */}
          <div className="p-4 rounded-xl" style={{ backgroundColor: lightBgColor }}>
            <div className="grid grid-cols-2 gap-4 text-sm mb-3">
              <div>
                <span className="font-bold block text-xs mb-1 opacity-70">시작</span>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    className="border rounded p-1 w-full bg-white/80"
                    value={editData.start_time}
                    onChange={(e) => setEditData({ ...editData, start_time: e.target.value })}
                  />
                ) : (
                  <span className="font-mono font-medium">
                    {new Date(schedule.start_time).toLocaleString()}
                  </span>
                )}
              </div>
              <div>
                <span className="font-bold block text-xs mb-1 opacity-70">종료</span>
                {isEditing ? (
                  <input
                    type="datetime-local"
                    className="border rounded p-1 w-full bg-white/80"
                    value={editData.end_time}
                    onChange={(e) => setEditData({ ...editData, end_time: e.target.value })}
                  />
                ) : (
                  <span className="font-mono font-medium">
                    {new Date(schedule.end_time).toLocaleString()}
                  </span>
                )}
              </div>
              {isEditing && (
                <div className="col-span-2 flex items-center mt-2 pt-2 border-t border-black/10">
                  <span className="font-bold text-xs mr-3 opacity-70">색상 변경</span>
                  <div className="flex items-center bg-white/80 rounded px-2 py-1 border">
                    <input
                      type="color"
                      value={editData.color}
                      onChange={(e) => setEditData({ ...editData, color: e.target.value })}
                      className="cursor-pointer h-6 w-8 p-0 border-0 bg-transparent"
                    />
                    <span className="text-xs ml-2 text-gray-500 font-mono">{editData.color}</span>
                  </div>
                </div>
              )}
            </div>

            <div>
              <span className="font-bold block mb-1 text-sm opacity-70">설명</span>
              {isEditing ? (
                <textarea
                  className="w-full border rounded p-2 text-sm bg-white/80"
                  rows="2"
                  value={editData.description}
                  onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                />
              ) : (
                <p className="text-sm whitespace-pre-wrap">{schedule.description || '-'}</p>
              )}
            </div>
          </div>

          {/* 메모 (Notes) */}
          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100">
            <span className="font-bold block mb-1 text-yellow-800 text-sm">📝 메모</span>
            {isEditing ? (
              <textarea
                className="w-full border border-yellow-300 rounded p-2 bg-white text-sm"
                rows="3"
                value={editData.notes}
                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                placeholder="회의록이나 중요 사항을 기록하세요."
              />
            ) : (
              <p className="text-gray-700 text-sm whitespace-pre-wrap min-h-[20px]">
                {schedule.notes || '메모 없음'}
              </p>
            )}
          </div>
        </div>

        {error && <p className="text-center text-red-500 text-sm mb-2">{error}</p>}

        {/* --- 3. 진행률 & 체크리스트 --- */}
        <div className="border-t pt-4">
          <div className="flex justify-between items-end mb-2">
            <h3 className="text-lg font-bold text-gray-800">체크리스트</h3>
            <span className="text-xs font-semibold" style={{ color: mainColor }}>
              {progress}% 완료
            </span>
          </div>

          {/* 진행률 바 (색상 동적 적용) */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
            <div
              className="h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: mainColor }}
            ></div>
          </div>

          <form onSubmit={handleCreateTask} className="flex space-x-2 mb-3">
            <input
              type="text"
              placeholder="할 일 추가..."
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              className="flex-grow p-2 border rounded text-sm outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              className="px-3 py-2 text-white rounded text-sm font-bold hover:opacity-90"
              style={{ backgroundColor: mainColor }}
            >
              추가
            </button>
          </form>

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <div
                  key={task.task_id}
                  className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition group"
                >
                  <div
                    className="flex items-center cursor-pointer flex-grow"
                    onClick={() => handleToggleTask(task.task_id, task.is_completed)}
                  >
                    {task.is_completed ? (
                      <FaCheckCircle className="text-green-500 mr-2 shrink-0" />
                    ) : (
                      <FaRegCircle className="text-gray-400 mr-2 shrink-0" />
                    )}
                    <span
                      className={`text-sm ${
                        task.is_completed ? 'line-through text-gray-400' : 'text-gray-700'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteTask(task.task_id)}
                    className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                  >
                    <FaTrash size={14} />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 text-xs py-2">등록된 할 일이 없습니다.</p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default ProjectModal;
