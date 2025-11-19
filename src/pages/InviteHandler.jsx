import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function InviteHandler() {
  const { teamId } = useParams(); // URL에서 :teamId 가져옴
  const navigate = useNavigate();
  const [status, setStatus] = useState('팀 정보를 확인 중입니다...');

  useEffect(() => {
    const token = localStorage.getItem('token');

    // 1. 로그인이 안 된 경우
    if (!token) {
      // 나중에 로그인 완료 후 이 팀으로 가입시키기 위해 ID 저장
      localStorage.setItem('pendingInviteTeamId', teamId);
      alert('팀에 합류하려면 먼저 로그인해야 합니다.');
      navigate('/login');
      return;
    }

    // 2. 로그인 된 경우 -> 즉시 가입 시도
    const joinTeam = async () => {
      try {
        const response = await fetch('/api/team/join', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ teamId }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || '팀 가입 실패');
        }

        // 성공! 토큰 갱신 및 이동
        localStorage.setItem('token', data.token);
        // 이미 처리했으므로 pending 제거
        localStorage.removeItem('pendingInviteTeamId');

        alert('팀에 성공적으로 합류했습니다!');
        navigate('/');
      } catch (err) {
        console.error(err);
        alert(err.message); // "이미 다른 팀에 있습니다" 등
        navigate('/'); // 메인으로 이동
      }
    };

    joinTeam();
  }, [teamId, navigate]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-xl font-semibold text-gray-600">{status}</div>
    </div>
  );
}

export default InviteHandler;
