import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Search, Heart, Phone, PhoneOff, Mic, MicOff, Volume2, Video } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider, useSocket } from './context/SocketContext';
import api from './services/api';

// Pages
import AuthPage from './pages/AuthPage';
import FeedPage from './pages/FeedPage';
import ExplorePage from './pages/ExplorePage';
import ProfilePage from './pages/ProfilePage';
import DirectMessagePage from './pages/DirectMessagePage';

// Components
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import SearchSlider from './components/SearchSlider';
import NotificationSlider from './components/NotificationSlider';
import CreatePostModal from './components/CreatePostModal';

// Layout Wrapper for protected routes
const AppLayout = ({ children }) => {
  const { user, loading } = useAuth();
  const {
    socket,
    activeCall,
    callUser,
    isVideoCall,
    callDuration,
    isMuted,
    setIsMuted,
    isSpeakerOn,
    setIsSpeakerOn,
    localStream,
    localVideoRef,
    acceptCall,
    endCall
  } = useSocket();
  const location = useLocation();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/api/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.isRead).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  // Real-time socket notification listener
  useEffect(() => {
    if (!socket) return;

    const handleNewNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('notification_received', handleNewNotification);

    return () => {
      socket.off('notification_received', handleNewNotification);
    };
  }, [socket]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-instagram-gray">
        <div className="text-xl font-bold font-sans italic bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent animate-pulse">
          OrySnap
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleMarkAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error(error);
    }
  };

  const handleNotificationRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handlePostCreated = () => {
    // If on home, refresh page or let feed refetch.
    // For simplicity, we trigger a page reload or let state updates handle it.
    if (location.pathname === '/') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-instagram-gray">
      {/* Desktop Sidebar */}
      <Sidebar
        onCreateClick={() => setIsCreateOpen(true)}
        onSearchClick={() => setIsSearchOpen(!isSearchOpen)}
        onNotificationsClick={() => setIsNotifOpen(!isNotifOpen)}
        unreadNotifications={unreadCount}
      />

      {/* Mobile Top Header */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-instagram-border sticky top-0 z-20 w-full">
        <Link to="/" className="text-xl font-bold tracking-wider font-sans italic bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          OrySnap
        </Link>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-gray-700 hover:text-black transition-colors"
          >
            <Search className="w-6 h-6" />
          </button>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="text-gray-700 hover:text-black transition-colors relative"
          >
            <Heart className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {unreadCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav onCreateClick={() => setIsCreateOpen(true)} />

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 pb-16 md:pb-0 min-h-screen">
        {children}
      </main>

      {/* Sliders and Modals */}
      <SearchSlider isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      
      <NotificationSlider
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onNotificationRead={handleNotificationRead}
        onMarkAllRead={handleMarkAllRead}
      />

      <CreatePostModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onPostCreated={handlePostCreated}
      />

      {/* Global Call Overlay UI */}
      {activeCall && (
        <div className="fixed inset-0 bg-neutral-950/95 backdrop-blur-xl z-50 flex flex-col justify-between items-center p-8 md:p-12 text-white select-none">
          {/* Top Header info */}
          <div className="flex flex-col items-center gap-2 mt-8">
            <span className="text-xs uppercase tracking-wider text-gray-400 font-bold">
              {isVideoCall ? 'Video Call' : 'Voice Call'}
            </span>
            <h3 className="text-2xl font-bold">{callUser?.username}</h3>
            <span className="text-sm font-semibold text-instagram-blue animate-pulse">
              {activeCall === 'ringing'
                ? 'Ringing...'
                : activeCall === 'incoming'
                ? 'Incoming Call...'
                : 'Connected'}
            </span>
          </div>

          {/* Avatar / Video Stream */}
          <div className="flex-1 flex items-center justify-center relative w-full max-w-sm my-6">
            {isVideoCall && activeCall === 'connected' ? (
              <div className="w-full aspect-video rounded-3xl overflow-hidden bg-neutral-900 border border-neutral-800 shadow-2xl relative">
                {/* Mock User Stream */}
                <img
                  src={callUser?.profilePic}
                  alt="active user stream"
                  className="w-full h-full object-cover opacity-80"
                />
                
                {/* Mock Self Stream overlay - uses live camera stream */}
                <div className="absolute bottom-4 right-4 w-28 aspect-video rounded-xl overflow-hidden bg-neutral-800 border-2 border-white shadow-lg z-20">
                  {localStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      muted
                      playsInline
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <img
                      src={user?.profilePic}
                      alt="your stream"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                
                <span className="absolute top-4 left-4 text-xs font-semibold bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md z-20">
                  Active Video Feed
                </span>
              </div>
            ) : (
              <div className="relative flex items-center justify-center">
                <div className={`w-28 h-28 md:w-36 md:h-36 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl transition-all duration-500 absolute scale-125 opacity-30 ${
                  activeCall === 'ringing' || activeCall === 'incoming' ? 'animate-ping' : 'hidden'
                }`}></div>
                <img
                  src={callUser?.profilePic}
                  alt="avatar"
                  className="w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-4 border-white/20 relative z-10 shadow-2xl"
                />
              </div>
            )}
          </div>

          {/* Active Call details / Action controls */}
          <div className="flex flex-col items-center gap-6 w-full max-w-sm mb-6 z-20">
            {activeCall === 'connected' && (
              <div className="text-sm font-mono tracking-widest text-gray-300">
                {Math.floor(callDuration / 60).toString().padStart(2, '0')}:
                {(callDuration % 60).toString().padStart(2, '0')}
              </div>
            )}

            {activeCall === 'incoming' ? (
              // Incoming Call controls: Accept or Decline
              <div className="flex items-center gap-8 justify-center">
                {/* Decline Button */}
                <button
                  type="button"
                  onClick={endCall}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="p-4 bg-red-600 hover:bg-red-700 text-white rounded-full transition-all active:scale-95 shadow-lg shadow-red-600/30">
                    <PhoneOff className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-gray-300">Decline</span>
                </button>

                {/* Accept Button */}
                <button
                  type="button"
                  onClick={acceptCall}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="p-4 bg-green-500 hover:bg-green-600 text-white rounded-full transition-all active:scale-95 shadow-lg shadow-green-500/35">
                    <Phone className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-semibold text-gray-300">Accept</span>
                </button>
              </div>
            ) : (
              // Outgoing Ringing or Connected call controls
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
                  onClick={endCall}
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
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            
            <Route
              path="/"
              element={
                <AppLayout>
                  <FeedPage />
                </AppLayout>
              }
            />
            
            <Route
              path="/explore"
              element={
                <AppLayout>
                  <ExplorePage />
                </AppLayout>
              }
            />
            
            <Route
              path="/direct/:userId?"
              element={
                <AppLayout>
                  <DirectMessagePage />
                </AppLayout>
              }
            />
            
            <Route
              path="/profile/:username"
              element={
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              }
            />

            {/* Fallback redirect to / */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
