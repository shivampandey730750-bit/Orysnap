import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { MessageSquare, Send, Image, X, Circle, Phone, Video, PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';
import api from '../services/api';

const DirectMessagePage = () => {
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  const { socket, onlineUsers } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);

  // Mock Call state
  const [activeCall, setActiveCall] = useState(null); // null, 'ringing', 'connected'
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Handle call duration ticking
  useEffect(() => {
    let interval;
    if (activeCall === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [activeCall]);

  const handleStartCall = (video = false) => {
    setIsVideoCall(video);
    setActiveCall('ringing');
    setCallDuration(0);
    
    // Simulate connection after 2.5 seconds
    setTimeout(() => {
      setActiveCall((current) => {
        if (current === 'ringing') return 'connected';
        return current;
      });
    }, 2500);
  };

  const handleEndCall = () => {
    setActiveCall(null);
    setCallDuration(0);
  };

  // Handle optional route userId parameter for quick-chat initiation
  useEffect(() => {
    if (!userId) return;

    if (selectedUser?._id === userId) return;

    const existingConv = conversations.find(c => c.user._id === userId);
    if (existingConv) {
      setSelectedUser(existingConv.user);
    } else {
      const fetchSelectedUser = async () => {
        try {
          const { data } = await api.get(`/api/users/find/${userId}`);
          setSelectedUser(data);
        } catch (error) {
          console.error('Failed to fetch chat user details:', error);
        }
      };
      fetchSelectedUser();
    }
  }, [userId, conversations, selectedUser]);

  // Fetch conversations summary
  const fetchConversations = async () => {
    try {
      const { data } = await api.get('/api/messages/conversations');
      setConversations(data);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  };

  // Fetch messages with selected user
  const fetchMessages = async (userId) => {
    try {
      const { data } = await api.get(`/api/messages/chat/${userId}`);
      setMessages(data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedUser) {
      fetchMessages(selectedUser._id);
      setOtherUserTyping(false);
    }
  }, [selectedUser]);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, otherUserTyping]);

  // Socket IO event listeners
  useEffect(() => {
    if (!socket) return;

    const handleMessageReceived = (msg) => {
      // If message belongs to active chat, append it
      if (
        selectedUser &&
        (msg.sender._id === selectedUser._id || msg.recipient?._id === selectedUser._id)
      ) {
        setMessages((prev) => [...prev, msg]);
      }
      
      // Refresh conversations sidebar summary
      fetchConversations();
    };

    const handleTyping = (userId) => {
      if (selectedUser && selectedUser._id === userId) {
        setOtherUserTyping(true);
      }
    };

    const handleStopTyping = (userId) => {
      if (selectedUser && selectedUser._id === userId) {
        setOtherUserTyping(false);
      }
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('typing', handleTyping);
    socket.on('stop_typing', handleStopTyping);

    return () => {
      socket.off('message_received', handleMessageReceived);
      socket.off('typing', handleTyping);
      socket.off('stop_typing', handleStopTyping);
    };
  }, [socket, selectedUser]);

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    setMessageText(e.target.value);

    if (!socket || !selectedUser) return;

    if (!isTyping) {
      setIsTyping(true);
      socket.emit('typing', { chatUserId: selectedUser._id });
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { chatUserId: selectedUser._id });
      setIsTyping(false);
    }, 2000); // 2 seconds idle
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() && !mediaFile) return;

    const formData = new FormData();
    if (messageText.trim()) formData.append('text', messageText);
    if (selectedUser) formData.append('recipientId', selectedUser._id);
    if (mediaFile) formData.append('media', mediaFile);

    try {
      if (socket && selectedUser) {
        socket.emit('stop_typing', { chatUserId: selectedUser._id });
        setIsTyping(false);
      }

      const { data } = await api.post('/api/messages', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Optimistic append is handled since socket emits to BOTH rooms,
      // but let's append directly just in case or depend entirely on Socket.io connection.
      // Actually, controllers emit via socket, which sends to both. 
      // In case socket is lagging, appending locally and checking uniqueness works.
      setMessages((prev) => {
        if (prev.some((m) => m._id === data._id)) return prev;
        return [...prev, data];
      });

      setMessageText('');
      setMediaFile(null);
      setMediaPreview('');
      fetchConversations();
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 px-4 md:px-6 h-[85vh] flex bg-white border border-instagram-border rounded-2xl shadow-sm overflow-hidden">
      {/* Conversations List (Left Pane) */}
      <div className={`w-full md:w-1/3 border-r border-instagram-border flex flex-col ${selectedUser ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-instagram-border flex items-center justify-between">
          <span className="font-bold text-gray-900">{currentUser?.username}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-8">No chats found. Go to profile to follow users and text!</p>
          ) : (
            conversations.map((conv) => {
              const isOnline = onlineUsers.has(conv.user._id);
              const unread = conv.lastMessage?.sender !== currentUser?._id && !conv.lastMessage?.isRead;
              return (
                <div
                  key={conv.user._id}
                  onClick={() => setSelectedUser(conv.user)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                    selectedUser?._id === conv.user._id ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 w-4/5">
                    {/* Avatar with Online indicator */}
                    <div className="relative flex-shrink-0">
                      <img
                        src={conv.user.profilePic}
                        alt={conv.user.username}
                        className="w-12 h-12 rounded-full object-cover border"
                      />
                      {isOnline && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></span>
                      )}
                    </div>

                    <div className="flex flex-col truncate">
                      <span className={`text-sm text-gray-900 ${unread ? 'font-bold' : ''}`}>
                        {conv.user.username}
                      </span>
                      <span className={`text-xs text-gray-500 truncate ${unread ? 'font-bold text-gray-800' : ''}`}>
                        {conv.lastMessage?.text || 'Sent an attachment'}
                      </span>
                    </div>
                  </div>

                  {unread && (
                    <Circle className="w-2.5 h-2.5 bg-instagram-blue text-instagram-blue rounded-full" />
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Message window (Right Pane) */}
      <div className={`w-full md:w-2/3 flex flex-col bg-instagram-gray/25 ${!selectedUser ? 'hidden md:flex justify-center items-center p-8' : 'flex'}`}>
        {!selectedUser ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full border-2 border-gray-800">
              <MessageSquare className="w-12 h-12 text-gray-800 stroke-[1.2]" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Your Messages</h2>
            <p className="text-sm text-gray-500 max-w-xs">
              Send private photos and messages to a friend or group.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-white border-b border-instagram-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedUser(null)} className="md:hidden p-1 text-gray-500 font-bold">←</button>
                <div className="relative">
                  <img
                    src={selectedUser.profilePic}
                    alt={selectedUser.username}
                    className="w-10 h-10 rounded-full object-cover border"
                  />
                  {onlineUsers.has(selectedUser._id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white"></span>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-gray-900 leading-tight">{selectedUser.username}</span>
                  <span className="text-[10px] text-gray-400 mt-0.5">
                    {onlineUsers.has(selectedUser._id) ? 'Active now' : 'Offline'}
                  </span>
                </div>
              </div>

              {/* Call Controls */}
              <div className="flex items-center gap-4 text-gray-600 mr-1.5">
                <button
                  type="button"
                  onClick={() => handleStartCall(false)}
                  className="p-2 hover:bg-gray-50 rounded-xl hover:text-instagram-blue transition-all"
                  title="Voice Call"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleStartCall(true)}
                  className="p-2 hover:bg-gray-50 rounded-xl hover:text-instagram-blue transition-all"
                  title="Video Call"
                >
                  <Video className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {messages.map((msg) => {
                const isOwn = msg.sender._id === currentUser?._id;
                return (
                  <div
                    key={msg._id}
                    className={`flex flex-col max-w-[75%] ${isOwn ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    {/* Media Attachments */}
                    {msg.mediaUrl && (
                      <div className="rounded-xl overflow-hidden mb-1 border border-gray-200 shadow-sm max-w-[200px] aspect-square bg-neutral-900">
                        {msg.mediaUrl.includes('.mp4') || msg.mediaUrl.includes('.webm') ? (
                          <video src={msg.mediaUrl} controls className="w-full h-full object-cover" />
                        ) : (
                          <img src={msg.mediaUrl} alt="message attachment" className="w-full h-full object-cover" />
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    {msg.text && (
                      <div
                        className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                          isOwn
                            ? 'bg-instagram-blue text-white rounded-br-none'
                            : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                        }`}
                      >
                        {msg.text}
                      </div>
                    )}

                    <span className="text-[9px] text-gray-400 mt-0.5 px-1 font-semibold">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}

              {/* Typing indicator bubble */}
              {otherUserTyping && (
                <div className="self-start flex items-center gap-1.5 bg-white border border-gray-200 rounded-2xl px-4 py-2.5 text-xs text-gray-400 font-semibold shadow-sm">
                  <div className="flex gap-0.5">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                  </div>
                  <span>typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="bg-white border-t border-instagram-border p-3 flex flex-col gap-2 relative">
              {/* Media Preview Box */}
              {mediaPreview && (
                <div className="absolute bottom-16 left-4 bg-white border border-gray-200 p-1.5 rounded-xl flex items-center shadow-lg gap-2">
                  <div className="w-12 h-12 rounded-lg overflow-hidden border">
                    {mediaFile.type.startsWith('video') ? (
                      <video src={mediaPreview} className="w-full h-full object-cover" />
                    ) : (
                      <img src={mediaPreview} alt="attachment preview" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview('');
                    }}
                    className="p-1 rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-500 hover:text-gray-800 rounded-full hover:bg-gray-50"
                >
                  <Image className="w-6 h-6" />
                </button>

                <input
                  type="file"
                  accept="image/*,video/*"
                  ref={fileInputRef}
                  onChange={handleMediaChange}
                  className="hidden"
                />

                <input
                  type="text"
                  placeholder="Message..."
                  value={messageText}
                  onChange={handleInputChange}
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-instagram-blue"
                />

                <button
                  type="submit"
                  disabled={!messageText.trim() && !mediaFile}
                  className="p-2.5 bg-instagram-blue text-white rounded-xl hover:bg-instagram-hoverblue transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Call Overlay UI */}
      {activeCall && (
        <div className="fixed inset-0 bg-neutral-950/90 backdrop-blur-lg z-50 flex flex-col justify-between items-center p-8 md:p-12 text-white select-none animate-fade-in">
          {/* Top Header info */}
          <div className="flex flex-col items-center gap-2 mt-8">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              {isVideoCall ? 'Video Call' : 'Voice Call'}
            </span>
            <h3 className="text-2xl font-bold">{selectedUser?.username}</h3>
            <span className="text-sm font-semibold text-instagram-blue animate-pulse">
              {activeCall === 'ringing' ? 'Ringing...' : 'Connected'}
            </span>
          </div>

          {/* Avatar Ringing / Video Screen */}
          <div className="flex-1 flex items-center justify-center relative w-full max-w-sm my-6">
            {isVideoCall && activeCall === 'connected' ? (
              <div className="w-full aspect-video rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl relative">
                {/* Mock User Stream */}
                <img
                  src={selectedUser?.profilePic}
                  alt="active user stream"
                  className="w-full h-full object-cover opacity-80"
                />
                
                {/* Mock Self Stream in overlay */}
                <div className="absolute bottom-4 right-4 w-28 aspect-video rounded-xl overflow-hidden bg-neutral-800 border-2 border-white shadow-lg">
                  <img
                    src={currentUser?.profilePic}
                    alt="your stream"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <span className="absolute top-4 left-4 text-xs font-semibold bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md">
                  Active Video Feed
                </span>
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl transition-all duration-500 absolute scale-125 opacity-30 ${
                  activeCall === 'ringing' ? 'animate-ping' : 'hidden'
                }`}></div>
                <img
                  src={selectedUser?.profilePic}
                  alt="avatar"
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-white/20 relative z-10 shadow-2xl"
                />
              </div>
            )}
          </div>

          {/* Active Call details / Action controls */}
          <div className="flex flex-col items-center gap-6 w-full max-w-sm mb-6">
            {activeCall === 'connected' && (
              <div className="text-sm font-mono tracking-widest text-gray-300">
                {Math.floor(callDuration / 60).toString().padStart(2, '0')}:
                {(callDuration % 60).toString().padStart(2, '0')}
              </div>
            )}

            <div className="flex items-center gap-6 md:gap-8 justify-center">
              {/* Mute button */}
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-full transition-colors ${
                  isMuted ? 'bg-red-500 text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              {/* End Call Button */}
              <button
                type="button"
                onClick={handleEndCall}
                className="p-5 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all active:scale-95 shadow-lg shadow-red-600/30"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              {/* Speaker button */}
              <button
                type="button"
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`p-3.5 rounded-full transition-colors ${
                  isSpeakerOn ? 'bg-instagram-blue text-white' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
                title="Toggle Speaker"
              >
                <Volume2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectMessagePage;
