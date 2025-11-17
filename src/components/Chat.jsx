// src/components/Chat.jsx

// 1. { io } import 제거!
import React, { useState, useEffect, useRef } from 'react';

// 2. [제거] const socket = io(...) 줄 삭제!

// 3. [수정] props로 'socket' 받기
function Chat({ currentUser, socket }) {
  const [messages, setMessages] = useState([]);
  // const [isConnected, setIsConnected] = useState(false); // 👈 App.jsx가 관리
  const currentUserId = currentUser ? currentUser.user_id : null;
  const [newMessage, setNewMessage] = useState('');
  const chatMessagesEndRef = useRef(null);

  useEffect(() => {
    // 4. [수정] socket이 없거나 유저 ID가 없으면 아무것도 안 함
    if (!socket || !currentUserId) return;

    // 'chatHandler.js' 기반
    socket.on('newTeamMessage', (messageData) => {
      // 'messageData'의 형식이 { from, text, timestamp }일 수 있습니다.
      // 백엔드 코드와 React UI 간의 데이터 형식 매핑이 필요할 수 있습니다.
      // (예: { user_id: messageData.from, message_text: messageData.text, ... })

      // 임시: 백엔드가 보낸 형식을 그대로 State에 저장한다고 가정
      setMessages((prevMessages) => [...prevMessages, messageData]);
    });

    // 7. [수정] 리스너 정리
    return () => {
      socket.off('newChatMessage');
    };
    // 8. [수정] 의존성 배열에 socket 추가
  }, [currentUserId, socket]);

  // [수정] 보낼 때도 'sendTeamMessage' 사용
  const sendMessage = () => {
    const text = newMessage.trim();
    if (!text || !socket || !socket.connected) return;

    socket.emit('sendTeamMessage', {
      // 👈 [이벤트 수정]
      msg: text, // 👈 'chatHandler.js'에 맞게 'msg' 키 사용
    });

    setNewMessage('');
  };

  return (
    <section /* ... */>
      {/* ... */}
      {/* 9. [제거] isConnected 상태 제거 (하드코딩된 로딩 텍스트) */}
      <div id="chatStatus" className="text-center text-gray-500 mt-20" style={{ display: 'block' }}>
        채팅 내역 없음 (실시간 채팅만 지원)
      </div>
      {/* ... */}
      <button
        onClick={sendMessage}
        disabled={!socket || !socket.connected} // 👈 소켓 연결 상태로 disabled
      >
        전송
      </button>
      {/* ... */}
    </section>
  );
}

export default Chat;
