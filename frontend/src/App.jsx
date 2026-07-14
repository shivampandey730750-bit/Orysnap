import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import { Search, Heart } from 'lucide-react';
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
  const { socket } = useSocket();
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
