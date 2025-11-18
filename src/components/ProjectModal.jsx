// src/components/ProjectModal.jsx

import React, { useState, useEffect } from 'react';
import { FaTrash, FaCheckCircle, FaRegCircle } from 'react-icons/fa';

API_URL = process.env.VITE_API_URL;

function ProjectModal({ isOpen, onClose, project: schedule }) {
  const [tasks, setTasks] = useState([]);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');

  // schedule_id가 없을 경우를 대비 (모달이 닫히면 project가 null이 됨)
  const scheduleId = schedule?.schedule_id;

  // 진행률 계산
  const completedTasks = tasks.filter((t) => t.is_completed).length;
  const totalTasks = tasks.length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Task 목록 API 호출 (모달이 열릴 때마다 실행)
  useEffect(() => {
    if (!scheduleId || !token) return;

    const fetchTasks = async () => {
      try {
        const response = await fetch(`/${API_URL}/api/task/${scheduleId}`, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!response.ok) throw new Error('체크리스트 로드 실패');

        const data = await response.json(); //
        setTasks(data);
      } catch (err) {
        console.error('Task 로드 오류:', err);
        setError('체크리스트 로드 실패');
      }
    };
    fetchTasks();
  }, [scheduleId, token]); // scheduleId가 바뀔 때마다 실행

  // Task 생성 핸들러
  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const response = await fetch(`/${API_URL}/api/task/${scheduleId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ title: newTaskTitle, managerId: null, due_date: null }), //
      });
      if (!response.ok) throw new Error('체크리스트 생성 실패');

      const data = await response.json(); // { task: 새 task 객체, message: ... }

      // Socket.io를 통해 다른 유저에게 알림이 가겠지만,
      // 현재 유저는 State를 직접 업데이트합니다.
      setTasks((prevTasks) => [...prevTasks, data.task]);
      setNewTaskTitle('');
    } catch (err) {
      setError(err.message);
    }
  };

  // 완료/미완료 핸들러
  const handleToggleComplete = async (taskId, isCompleted) => {
    try {
      const response = await fetch(`/${API_URL}/api/task/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isCompleted: !isCompleted }),
      });
      if (!response.ok) throw new Error('상태 변경 실패');

      // State 업데이트 (Socket.io를 사용하지 않고 직접 업데이트)
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t.task_id === taskId ? { ...t, is_completed: !isCompleted } : t)),
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // 삭제 핸들러
  const handleDeleteTask = async (taskId) => {
    try {
      const response = await fetch(`/${API_URL}/api/task/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('삭제 실패');

      // State 업데이트
      setTasks((prevTasks) => prevTasks.filter((t) => t.task_id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  };

  // 렌더링
  if (!isOpen || !schedule) return null;

  const createProgressBar = (status, progress) => {
    /* ... (기존과 동일) ... */
  }; // 진행률 막대 함수

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* 모달 헤더 */}
        <div className="flex justify-between items-center mb-2 border-b pb-2">
          <h2 className="text-2xl font-bold">{schedule.title}</h2>
          <span className="text-sm font-semibold">{schedule.status || '미지정'}</span>
        </div>

        {/* 1. 진행률 바 */}
        <div className="my-4">
          <p className="text-sm font-medium mb-1">
            진행률: {progressPercent}% ({completedTasks}/{totalTasks})
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-indigo-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>

        {/* 2. 상세 정보 */}
        <p className="text-gray-600 mb-4">{schedule.description}</p>
        <div className="space-y-1 text-sm">
          <p>
            <strong>시작:</strong> {new Date(schedule.start_time).toLocaleString()}
          </p>
          <p>
            <strong>종료:</strong> {new Date(schedule.end_time).toLocaleString()}
          </p>
        </div>

        <hr className="my-4" />

        {/* 3. 체크리스트 (Task) 섹션 */}
        <h3 className="text-xl font-semibold mb-3">체크리스트 ({totalTasks}개)</h3>

        {/* Task 목록 */}
        <div className="max-h-40 overflow-y-auto space-y-2 mb-4">
          {tasks?.length > 0 ? (
            tasks.map((task) => (
              <div
                key={task.task_id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded"
              >
                <div
                  className="flex items-center cursor-pointer"
                  onClick={() => handleToggleComplete(task.task_id, task.is_completed)}
                >
                  {task.is_completed ? (
                    <FaCheckCircle className="text-green-500 mr-2" />
                  ) : (
                    <FaRegCircle className="text-gray-400 mr-2" />
                  )}
                  <span
                    className={`text-sm ${task.is_completed ? 'line-through text-gray-500' : ''}`}
                  >
                    {task.title}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteTask(task.task_id)}
                  className="text-red-400 hover:text-red-600 ml-3"
                >
                  <FaTrash className="w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">등록된 체크리스트가 없습니다.</p>
          )}
        </div>

        {/* Task 생성 Form */}
        <form onSubmit={handleCreateTask} className="flex space-x-2">
          <input
            type="text"
            placeholder="새 체크리스트를 입력하세요..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="flex-grow p-2 border rounded-lg"
          />
          <button
            type="submit"
            className="px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600"
          >
            추가
          </button>
        </form>

        {error && <p className="text-sm text-center text-red-600 mt-2">{error}</p>}

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

export default ProjectModal;
