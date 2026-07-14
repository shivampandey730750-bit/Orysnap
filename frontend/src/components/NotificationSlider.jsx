import React from 'react';
import { Link } from 'react-router-dom';
import { X, Heart, MessageCircle, UserPlus, Check } from 'lucide-react';
import api from '../services/api';

const NotificationSlider = ({ isOpen, onClose, notifications = [], onNotificationRead, onMarkAllRead }) => {
  const getNotificationText = (notif) => {
    switch (notif.type) {
      case 'LIKE':
        return 'liked your post.';
      case 'COMMENT':
        return `commented: "${notif.comment?.text || ''}"`;
      case 'FOLLOW':
        return 'started following you.';
      case 'MENTION':
        return 'mentioned you in a comment.';
      default:
        return 'interacted with your account.';
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'COMMENT':
      case 'MENTION':
        return <MessageCircle className="w-4 h-4 text-blue-500" />;
      case 'FOLLOW':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      default:
        return <Heart className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) {
      try {
        await api.put(`/api/notifications/${notif._id}/read`);
        if (onNotificationRead) onNotificationRead(notif._id);
      } catch (error) {
        console.error('Failed to mark notification read:', error);
      }
    }
    onClose();
  };

  const formatTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 6000);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${Math.max(1, minutes)}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose}></div>
      )}

      {/* Slider Container */}
      <div
        className={`fixed top-0 left-0 h-screen w-80 md:w-96 bg-white border-r border-instagram-border z-50 shadow-2xl transition-transform duration-300 ease-in-out p-6 flex flex-col gap-4 ${
          isOpen ? 'translate-x-0 md:translate-x-64' : '-translate-x-full'
        }`}
      >
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Notifications</h2>
          <div className="flex items-center gap-2">
            {notifications.some((n) => !n.isRead) && (
              <button
                onClick={onMarkAllRead}
                title="Mark all as read"
                className="p-1 hover:bg-gray-100 rounded-full text-instagram-blue hover:text-instagram-hoverblue transition-colors"
              >
                <Check className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-4">
          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
              <Heart className="w-12 h-12 stroke-[1.2]" />
              <p className="text-sm">No notifications yet</p>
            </div>
          )}

          {notifications.map((notif) => (
            <div
              key={notif._id}
              className={`flex items-center justify-between p-2 rounded-xl transition-colors ${
                notif.isRead ? 'opacity-80' : 'bg-blue-50/40 border-l-2 border-instagram-blue'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* User avatar with small type icon badge */}
                <div className="relative">
                  <Link to={`/profile/${notif.sender.username}`} onClick={onClose}>
                    <img
                      src={notif.sender.profilePic}
                      alt={notif.sender.username}
                      className="w-10 h-10 rounded-full object-cover border border-gray-200"
                    />
                  </Link>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-white p-0.5 rounded-full shadow border border-gray-100">
                    {getNotificationIcon(notif.type)}
                  </div>
                </div>

                <div className="flex flex-col text-xs md:text-sm">
                  <span className="text-gray-900">
                    <Link
                      to={`/profile/${notif.sender.username}`}
                      onClick={onClose}
                      className="font-bold hover:underline"
                    >
                      {notif.sender.username}
                    </Link>{' '}
                    {getNotificationText(notif)}
                  </span>
                  <span className="text-xs text-gray-400 font-semibold mt-0.5">
                    {formatTime(notif.createdAt)}
                  </span>
                </div>
              </div>

              {/* Action Thumbnail or Follow Link */}
              {notif.post && (
                <Link
                  to={`/explore`} // Or display a post modal. Direct Link to profile works.
                  onClick={() => handleNotifClick(notif)}
                  className="w-10 h-10 flex-shrink-0 border border-gray-100 rounded-lg overflow-hidden"
                >
                  <img
                    src={notif.post.mediaUrls[0]}
                    alt="post preview"
                    className="w-full h-full object-cover"
                  />
                </Link>
              )}

              {notif.type === 'FOLLOW' && (
                <Link
                  to={`/profile/${notif.sender.username}`}
                  onClick={() => handleNotifClick(notif)}
                  className="px-3 py-1.5 bg-instagram-blue hover:bg-instagram-hoverblue text-white rounded-xl text-xs font-semibold"
                >
                  View
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default NotificationSlider;
