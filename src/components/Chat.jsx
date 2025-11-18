// src/components/Chat.jsx

// 1. { io } import 제거!
import React, { useState, useEffect, useRef, useMemo } from 'react';

function Chat({ currentUser, socket, teamMembers }) {
  const [messages, setMessages] = useState([]);
  const currentUserId = currentUser ? currentUser.user_id : null;
  const [newMessage, setNewMessage] = useState('');
  const chatMessagesEndRef = useRef(null);

  useEffect(() => {
    if (!socket || !currentUserId) return;

    // 'chatHandler.js' 기반
    socket.on('newTeamMessage', (messageData) => {
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    // 리스너 정리
    return () => {
      socket.off('newChatMessage');
    };
    // 의존성 배열에 socket 추가
  }, [currentUserId, socket]);

  // teamMembers 목록이 바뀔 때만 다시 계산 (성능 최적화)
  const userMap = useMemo(() => {
    const map = new Map();

    // teamMembers가 undefined일 때를 대비해 '?.' 추가
    teamMembers?.forEach((member) => {
      map.set(member.user_id, member.username);
    });
    return map;
  }, [teamMembers]);

  // 보낼 때도 'sendTeamMessage' 사용
  const sendMessage = () => {
    const text = newMessage.trim();
    if (!text || !socket || !socket.connected) return;

    socket.emit('sendTeamMessage', {
      msg: text,
    });

    setNewMessage('');
  };

  // UI를 위한 헬퍼 함수 (메시지 렌더링)
  const renderMessageBubble = (messageData) => {
    const { from, text, timestamp } = messageData;
    const isMe = from === currentUser?.user_id;

    const alignment = isMe ? 'justify-end' : 'justify-start';
    const bubbleColor = isMe ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800';

    // userMap에서 username 가져오기
    const name = isMe ? '나' : userMap.get(from) || '알 수 없음';

    const time = new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <div key={Math.random()} className={`flex ${alignment} w-full`}>
        <div className="max-w-[80%] mb-3">
          <p className={`text-xs mb-1 ${isMe ? 'text-right' : 'text-left'} text-gray-600`}>
            {name} <span className="ml-2 text-gray-400">{time}</span>
          </p>
          <div className={`px-3 py-2 rounded-xl shadow-sm ${bubbleColor} inline-block break-words`}>
            {text}
          </div>
        </div>
      </div>
    );
  };

  return (
    <section className="mb-8">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">채팅</h2>
      <div className="bg-white p-4 rounded-xl shadow-xl border border-indigo-100">
        {/* 1. Message Display Area */}
        <div
          id="chatMessages"
          className="h-64 w-full mb-4 max-h-[400px] overflow-y-auto flex flex-col pr-3"
        >
          {/* [Placeholder] */}
          <div
            id="chatStatus"
            className="text-center text-gray-500 mt-20"
            style={{ display: 'block' }}
          >
            현재 팀 실시간 채팅만 지원
          </div>

          {/* 2. 메시지 목록 렌더링 */}
          {messages.map((msg, index) => renderMessageBubble(msg))}

          {/* (스크롤 앵커 - 스크롤 로직은 이전 코드와 유사하게 구현되어 있어야 함) */}
          <div ref={chatMessagesEndRef} />
        </div>

        {/* 3. Message Input Form */}
        <div className="flex space-x-3">
          <input
            type="text"
            placeholder="메시지를 입력하고 Enter를 누르세요..."
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') sendMessage();
            }}
          />
          <button
            onClick={sendMessage}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-150 disabled:bg-indigo-300"
            disabled={!socket || !socket.connected || !currentUser}
          >
            전송
          </button>
        </div>
      </div>
    </section>
  );
}

export default Chat;
