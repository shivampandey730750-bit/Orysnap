import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const { user } = useAuth();

  // Global Call States
  const [activeCall, setActiveCall] = useState(null); // null, 'ringing', 'incoming', 'connected'
  const [callUser, setCallUser] = useState(null); // { _id, username, profilePic }
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  const localVideoRef = useRef(null);
  const audioCtxRef = useRef(null);
  const audioOscRef = useRef(null);

  // Audio Synthesis Ringtone
  const playRingtone = () => {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(380, ctx.currentTime);

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      let time = ctx.currentTime;
      for (let i = 0; i < 20; i++) {
        gainNode.gain.setValueAtTime(0.12, time);
        time += 1.0;
        gainNode.gain.setValueAtTime(0, time);
        time += 1.5;
      }

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      audioOscRef.current = osc;
    } catch (e) {
      console.warn('Web Audio API blocked or not supported:', e);
    }
  };

  const playIncomingRingtone = () => {
    try {
      if (!window.AudioContext && !window.webkitAudioContext) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, ctx.currentTime);

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      let time = ctx.currentTime;
      for (let i = 0; i < 25; i++) {
        gainNode.gain.setValueAtTime(0.15, time);
        time += 0.8;
        gainNode.gain.setValueAtTime(0, time);
        time += 1.2;
      }

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      audioOscRef.current = osc;
    } catch (e) {
      console.warn('Web Audio API blocked or not supported:', e);
    }
  };

  const stopRingtone = () => {
    try {
      if (audioOscRef.current) {
        audioOscRef.current.stop();
        audioOscRef.current.disconnect();
        audioOscRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const startLocalVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
    } catch (err) {
      console.warn('Failed to access camera:', err);
    }
  };

  const stopLocalVideo = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
  };

  // Bind local stream to video player
  useEffect(() => {
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, activeCall]);

  // Call duration counter
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

  const startCall = (targetUser, isVideo = false) => {
    setIsVideoCall(isVideo);
    setCallUser(targetUser);
    setActiveCall('ringing');
    setCallDuration(0);
    playRingtone();

    if (isVideo) {
      startLocalVideo();
    }

    if (socket) {
      socket.emit('call_user', {
        recipientId: targetUser._id,
        isVideo,
        callerId: user._id,
        callerName: user.username,
        callerPic: user.profilePic
      });
    }
  };

  const acceptCall = () => {
    if (!socket || !callUser) return;
    stopRingtone();
    setActiveCall('connected');
    
    if (isVideoCall) {
      startLocalVideo();
    }

    socket.emit('accept_call', {
      callerId: callUser._id,
      recipientId: user._id
    });
  };

  const endCall = () => {
    if (!socket || !callUser) return;
    stopRingtone();
    stopLocalVideo();
    
    socket.emit('end_call', { targetId: callUser._id });
    
    setActiveCall(null);
    setCallUser(null);
    setCallDuration(0);
  };

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const newSocket = io(import.meta.env.VITE_API_URL || window.location.origin, {
      transports: ['websocket'],
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to socket server');
      newSocket.emit('setup', user._id);
    });

    newSocket.on('user_online', (userId) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.add(userId);
        return next;
      });
    });

    newSocket.on('user_offline', (userId) => {
      setOnlineUsers((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    });

    // Handle incoming call signaling
    newSocket.on('incoming_call', ({ isVideo, callerId, callerName, callerPic }) => {
      // If we are already busy, auto decline incoming
      if (activeCall) {
        newSocket.emit('end_call', { targetId: callerId });
        return;
      }
      setIsVideoCall(isVideo);
      setCallUser({ _id: callerId, username: callerName, profilePic: callerPic });
      setActiveCall('incoming');
      playIncomingRingtone();
    });

    newSocket.on('call_accepted', () => {
      stopRingtone();
      setActiveCall('connected');
    });

    newSocket.on('call_ended', () => {
      stopRingtone();
      stopLocalVideo();
      setActiveCall(null);
      setCallUser(null);
      setCallDuration(0);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, activeCall, callUser, isVideoCall, localStream]);

  return (
    <SocketContext.Provider value={{
      socket,
      onlineUsers,
      activeCall,
      setActiveCall,
      callUser,
      setCallUser,
      isVideoCall,
      callDuration,
      isMuted,
      setIsMuted,
      isSpeakerOn,
      setIsSpeakerOn,
      localStream,
      localVideoRef,
      startCall,
      acceptCall,
      endCall,
      stopRingtone,
      stopLocalVideo
    }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
export default SocketContext;
