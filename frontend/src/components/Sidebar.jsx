import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Search,
  Compass,
  MessageCircle,
  Heart,
  PlusSquare,
  LogOut,
  User as UserIcon,
  Menu,
} from 'lucide-react';

import Avatar from './Avatar';

const Sidebar = ({ onCreateClick, onSearchClick, onNotificationsClick, unreadNotifications = 0 }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isActive = (path) => location.pathname === path;

  return (
    <div className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-white border-r border-instagram-border p-3 justify-between z-20">
      <div className="flex flex-col gap-6 w-full">
        {/* Logo */}
        <Link to="/" className="px-3 pt-6 pb-2 text-2xl font-bold tracking-wider font-sans italic bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
          OrySnap
        </Link>

        {/* Navigation Items */}
        <nav className="flex flex-col gap-1 w-full">
          <Link
            to="/"
            className={`flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
              isActive('/') ? 'font-bold' : ''
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-sm">Home</span>
          </Link>

          <button
            onClick={onSearchClick}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
          >
            <Search className="w-6 h-6" />
            <span className="text-sm">Search</span>
          </button>

          <Link
            to="/explore"
            className={`flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
              isActive('/explore') ? 'font-bold' : ''
            }`}
          >
            <Compass className="w-6 h-6" />
            <span className="text-sm">Explore</span>
          </Link>

          <Link
            to="/direct"
            className={`flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
              isActive('/direct') ? 'font-bold' : ''
            }`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-sm">Messages</span>
          </Link>

          <button
            onClick={onNotificationsClick}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left relative"
          >
            <div className="relative">
              <Heart className="w-6 h-6" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {unreadNotifications}
                </span>
              )}
            </div>
            <span className="text-sm">Notifications</span>
          </button>

          <button
            onClick={onCreateClick}
            className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
          >
            <PlusSquare className="w-6 h-6" />
            <span className="text-sm">Create</span>
          </button>

          {user && (
            <Link
              to={`/profile/${user.username}`}
              className={`flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors ${
                isActive(`/profile/${user.username}`) ? 'font-bold' : ''
              }`}
            >
              <Avatar
                src={user.profilePic}
                alt={user.username}
                className="w-6 h-6 border border-gray-200"
                textClassName="text-[8px] font-extrabold"
              />
              <span className="text-sm">Profile</span>
            </Link>
          )}
        </nav>
      </div>

      {/* More / Logout Dropdown */}
      <div className="relative">
        {showMoreMenu && (
          <div className="absolute bottom-16 left-0 w-full bg-white border border-instagram-border rounded-xl shadow-lg p-1.5 flex flex-col z-30">
            <Link
              to={`/profile/${user?.username}`}
              onClick={() => setShowMoreMenu(false)}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-100 text-sm"
            >
              <UserIcon className="w-4 h-4" />
              <span>View Profile</span>
            </Link>
            <hr className="my-1 border-gray-100" />
            <button
              onClick={() => {
                logout();
                setShowMoreMenu(false);
              }}
              className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-red-50 text-red-600 text-sm font-semibold w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        )}

        <button
          onClick={() => setShowMoreMenu(!showMoreMenu)}
          className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
        >
          <Menu className="w-6 h-6" />
          <span className="text-sm font-medium">More</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
