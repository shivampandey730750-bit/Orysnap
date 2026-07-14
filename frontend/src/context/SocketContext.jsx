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
  const [remoteStream, setRemoteStream] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const pcRef = useRef(null);

  const audioCtxRef = useRef(null);
  const audioOscRef = useRef(null);

  const activeCallRef = useRef(activeCall);
  const localStreamRef = useRef(localStream);
  const isVideoCallRef = useRef(isVideoCall);
  const callUserRef = useRef(callUser);

  useEffect(() => { activeCallRef.current = activeCall; }, [activeCall]);
  useEffect(() => { localStreamRef.current = localStream; }, [localStream]);
  useEffect(() => { isVideoCallRef.current = isVideoCall; }, [isVideoCall]);
  useEffect(() => { callUserRef.current = callUser; }, [callUser]);

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

  const captureMedia = async (videoRequired) => {
    try {
      console.log('Capturing media: video =', videoRequired);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoRequired ? { facingMode: 'user' } : false,
        audio: true
      });
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.error('Failed to get user media:', err);
      if (videoRequired) {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setLocalStream(audioStream);
          return audioStream;
        } catch (err2) {
          console.error('Failed to get audio media fallback:', err2);
        }
      }
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

  // Bind remote stream to video/audio players
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
      }
    }
  }, [remoteStream]);

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

  const createPeerConnection = (targetUserId, stream) => {
    console.log('Creating RTCPeerConnection for:', targetUserId);
    if (pcRef.current) {
      pcRef.current.close();
    }

    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' }
      ]
    });

    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc_signal', {
          targetId: targetUserId,
          signal: { candidate: event.candidate }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async (targetUser, isVideo = false) => {
    setIsVideoCall(isVideo);
    setCallUser(targetUser);
    setActiveCall('ringing');
    setCallDuration(0);
    playRingtone();

    const stream = await captureMedia(isVideo);
    createPeerConnection(targetUser._id, stream);

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

  const acceptCall = async () => {
    if (!socket || !callUser) return;
    stopRingtone();
    setActiveCall('connected');
    
    const stream = await captureMedia(isVideoCall);
    const pc = createPeerConnection(callUser._id, stream);

    socket.emit('accept_call', {
      callerId: callUser._id,
      recipientId: user._id
    });

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit('webrtc_signal', {
        targetId: callUser._id,
        signal: { offer }
      });
    } catch (err) {
      console.error('Error creating WebRTC offer:', err);
    }
  };

  const endCall = () => {
    if (!socket || !callUser) return;
    stopRingtone();
    stopLocalVideo();
    
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setRemoteStream(null);
    
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
      if (activeCallRef.current) {
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
      if (pcRef.current) {
        pcRef.current.close();
        pcRef.current = null;
      }
      setRemoteStream(null);
      setActiveCall(null);
      setCallUser(null);
      setCallDuration(0);
    });

    newSocket.on('webrtc_signal', async ({ signal, senderId }) => {
      console.log('Received WebRTC signal:', Object.keys(signal));
      try {
        let pc = pcRef.current;
        if (!pc) {
          if (signal.offer) {
            console.log('Creating PeerConnection in response to remote offer');
            const stream = localStreamRef.current || await captureMedia(isVideoCallRef.current);
            pc = createPeerConnection(senderId, stream);
          } else {
            console.warn('PeerConnection not initialized yet. Delaying candidate/answer processing...');
            return;
          }
        }

        if (signal.offer) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          newSocket.emit('webrtc_signal', { targetId: senderId, signal: { answer } });
        } else if (signal.answer) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.answer));
        } else if (signal.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
        }
      } catch (err) {
        console.error('Error handling WebRTC signal:', err);
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

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
      remoteStream,
      remoteVideoRef,
      remoteAudioRef,
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
