// src/App.jsx

import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Chat from './components/Chat';
import StatusCards from './components/StatusCards';
import StatusModal from './components/StatusModal';
import Calendar from './components/Calendar'; // Calendar import
import ProjectModal from './components/ProjectModal'; // ProjectModal import
import CreateScheduleModal from './components/CreateScheduleModal';
import AddMemberModal from './components/AddMemberModal';
import { useNavigate } from 'react-router-dom'; // 401 에러 시 로그아웃 처리용

API_URL = process.env.VITE_API_URL;

const socket = io({
  autoConnect: false, // 아직 자동 연결은 안 함
});

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  // 팀원 현황을 위한 State
  const [teamMembers, setTeamMembers] = useState([]); // (API로 가져올 전체 팀원)
  const [onlineUsers, setOnlineUsers] = useState([]); // (Socket으로 받을 실시간 목록)

  const [isLoading, setIsLoading] = useState(true);
  const [openModal, setOpenModal] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const [modalState, setModalState] = useState({
    status: false,
    project: null, // (ProjectModal용)
    createSchedule: false, // '일정 생성' 모달 상태
    addMember: false,
  });

  const navigate = useNavigate();

  // useEffect: 컴포넌트가 처음 마운트될 때 실행
  useEffect(() => {
    // localStorage에서 토큰을 가져옴
    const token = localStorage.getItem('token');

    if (!token) {
      // 로그인 안 한 상태
      setIsLoading(false);
      // ProtectedRoute가 알아서 /login으로 보내겠지만, 여기서 한 번 더 처리해도 됨
      navigate('/login');
      return;
    }

    
    // API 호출: 전체 팀원 목록 가져오기
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch(`/${API_URL}/api/team/`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          throw new Error('팀원 목록 로드 실패');
        }

        const members = await response.json();
        setTeamMembers(members); // State에 저장
      } catch (err) {
        console.error('팀원 목록 로드 오류:', err);
      }
    };

    // 토큰이 있으면, /api/auth/me 호출
    const fetchMe = async () => {
      try {
        const response = await fetch(`/${API_URL}/api/auth/me`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: 'no-store',
        });

        if (response.status === 401) {
          // 토큰이 만료되었거나 유효하지 않은 경우
          localStorage.removeItem('token'); // 잘못된 토큰 삭제
          navigate('/login'); // 로그인 페이지로
          return;
        }

        if (!response.ok) {
          throw new Error('유저 정보 로드 실패');
        }

        const userData = await response.json();

        setCurrentUser(userData);

        // teamId 있으면 팀 화면으로 이동
        if (!userData.team_id) {
          navigate('/create-team');
        } else {
          // 정상적인 성공
          await fetchTeamMembers(); // 팀원 목록 API 호출

          // 소켓 연결 시작
          socket.auth = { token }; // 소켓 연결 시 토큰 전달
          socket.connect();
        }
      } catch (error) {
        console.error(error);
        localStorage.removeItem('token');
        navigate('/login');
      } finally {
        setIsLoading(false); // 로딩 끝
      }
    };

    fetchMe();

    // 나에게 현재 온라인 목록을 보내줌
    socket.on('initialUserStatus', (onlineUserIds) => {
      setOnlineUsers(new Set(onlineUserIds));
    });
    // 'statusHandler.js' 기반: 다른 유저가 온라인됨
    socket.on('userOnline', (data) => {
      console.log('user online', data.userId);
      setOnlineUsers((prevSet) => new Set(prevSet).add(data.userId));
    });
    // 'statusHandler.js' 기반: 다른 유저가 오프라인됨
    socket.on('userOffline', (data) => {
      console.log('user offline', data.userId);
      setOnlineUsers((prevSet) => {
        const newSet = new Set(prevSet);
        newSet.delete(data.userId);
        return newSet;
      });
    });

    // 컴포넌트가 언마운트될 때 소켓 리스너 정리
    return () => {
      socket.off('initialUserStatus');
      socket.off('userOnline');
      socket.off('userOffline');
      socket.disconnect(); // 로그아웃/페이지 이동 시 연결 해제
    };
  }, [navigate]); // navigate 함수가 변경될 때도 (거의 없음) 다시 실행

  // --- StatusModal 핸들러 ---
  const handleOpenStatusModal = () => {
    setModalState((prev) => ({ ...prev, status: true }));
  };

  // --- TimezoneModal 핸들러 ---
  const handleOpenTimezoneModal = () => {
    alert('Timezone 모달은 아직 만들지 않았습니다.');
  };

  // --- ProjectModal 핸들러 ---
  const handleOpenProjectModal = (eventData) => {
    setModalState((prev) => ({ ...prev, project: eventData }));
  };

  // (일정 생성 모달 핸들러)
  const handleOpenCreateScheduleModal = () => {
    setModalState((prev) => ({ ...prev, createSchedule: true }));
  };

  // 팀원 추가 모달 핸들러
  const handleOpenAddMemberModal = () => {
    setModalState((prev) => ({ ...prev, status: false, addMember: true }));
  };

  // --- 공통 모달 닫기 핸들러 ---
  const handleCloseModal = () => {
    setModalState((prev) => ({
      status: false,
      project: null,
      createSchedule: false,
      addMember: false,
    }));
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-8">
      {/* ... (Header) ... */}

      <StatusCards
        onStatusClick={handleOpenStatusModal}
        onTimezoneClick={() => alert('Timezone 모달 미구현')}
        onlineCount={onlineUsers.size} // .length에서 .size로 수정
        totalCount={teamMembers?.length || 0}
      />

      <Calendar
        onEventClick={handleOpenProjectModal}
        onAddScheduleClick={handleOpenCreateScheduleModal} // 핸들러 전달
        currentUser={currentUser}
        socket={socket} // 캘린더 실시간 변경용
      />

      <Chat
        currentUser={currentUser}
        socket={socket} // 채팅용
        teamMembers={teamMembers}
      />

      <StatusModal
        isOpen={modalState.status}
        onClose={handleCloseModal}
        teamMembers={teamMembers}
        onlineUsers={onlineUsers}
        onAddMemberClick={handleOpenAddMemberModal}
      />

      <AddMemberModal
        isOpen={modalState.addMember}
        onClose={handleCloseModal}
        currentUser={currentUser}
      />

      <ProjectModal
        isOpen={!!modalState.project} // project 데이터가 있으면 true
        onClose={handleCloseModal}
        project={modalState.project} // project 데이터 전달
      />

      {/* 6. 일정 생성 모달 렌더링 */}
      <CreateScheduleModal isOpen={modalState.createSchedule} onClose={handleCloseModal} />

      {/* ... (ProjectModal) ... */}
    </div>
  );
}

export default App;
