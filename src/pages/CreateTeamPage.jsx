import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateTeamPage() {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('create');

  const [teamName, setTeamName] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const token = localStorage.getItem('token');

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch(`/api/team`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamName }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || '팀 생성에 실패했습니다.');

      // 팀 생성 성공
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  // ---------------------------------------------------------
  // 3. [신규] 팀 합류 핸들러 (초대 링크/ID 사용)
  // ---------------------------------------------------------
  const handleJoinSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // 입력된 링크에서 ID만 추출
      // 예: "http://domain.com/invite/123-abc" -> "123-abc"
      // 예: "123-abc" -> "123-abc"
      let teamId = inviteLink;
      if (inviteLink.includes('/invite/')) {
        teamId = inviteLink.split('/invite/')[1];
      }

      // 공백 제거
      teamId = teamId.trim();

      if (!teamId) {
        setError('올바른 초대 링크나 ID를 입력해주세요.');
        return;
      }

      // API 호출 (기존에 만든 invite join API 사용)
      const response = await fetch('/api/team/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ teamId }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || '팀 합류 실패');

      // 성공 처리
      localStorage.setItem('token', data.token);
      setMessage('팀에 성공적으로 합류했습니다!');

      setTimeout(() => {
        navigate('/');
      }, 1000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        {/* 헤더 */}
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">환영합니다!</h2>
        <p className="text-center text-gray-600 mb-6">서비스를 이용하려면 팀이 필요합니다.</p>

        {/* 탭 버튼 */}
        <div className="flex border-b mb-6">
          <button
            className={`flex-1 py-2 text-center font-semibold ${
              activeTab === 'create'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('create');
              setError(null);
            }}
          >
            새 팀 만들기
          </button>
          <button
            className={`flex-1 py-2 text-center font-semibold ${
              activeTab === 'join'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('join');
              setError(null);
            }}
          >
            초대 코드로 합류
          </button>
        </div>

        {/* 에러/성공 메시지 */}
        {error && <p className="text-sm text-center text-red-600 mb-4">{error}</p>}
        {message && <p className="text-sm text-center text-green-600 mb-4">{message}</p>}

        {/* 폼 1: 팀 생성 */}
        {activeTab === 'create' && (
          <form className="space-y-6" onSubmit={handleCreateSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">팀 이름</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="예: 멋쟁이 개발팀"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition"
            >
              팀 생성하고 시작하기
            </button>
          </form>
        )}

        {/* 폼 2: 팀 합류 */}
        {activeTab === 'join' && (
          <form className="space-y-6" onSubmit={handleJoinSubmit}>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                초대 링크 또는 팀 ID
              </label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 mt-1 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
                placeholder="http://z/invite/abc-123 또는 ID 붙여넣기"
              />
            </div>
            <button
              type="submit"
              className="w-full px-4 py-2 font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition"
            >
              팀 합류하기
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            로그인 화면으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateTeamPage;
