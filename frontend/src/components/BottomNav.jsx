import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home, Compass, MessageCircle, PlusSquare, User } from 'lucide-react';

import Avatar from './Avatar';

const BottomNav = ({ onCreateClick }) => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-instagram-border flex justify-around items-center py-2 z-20">
      <Link
        to="/"
        className={`flex flex-col items-center p-2 text-gray-700 ${isActive('/') ? 'text-black font-bold' : ''}`}
      >
        <Home className="w-6 h-6" />
      </Link>

      <Link
        to="/explore"
        className={`flex flex-col items-center p-2 text-gray-700 ${isActive('/explore') ? 'text-black font-bold' : ''}`}
      >
        <Compass className="w-6 h-6" />
      </Link>

      <button
        onClick={onCreateClick}
        className="flex flex-col items-center p-2 text-gray-700 hover:text-black transition-colors"
      >
        <PlusSquare className="w-6 h-6" />
      </button>

      <Link
        to="/direct"
        className={`flex flex-col items-center p-2 text-gray-700 ${isActive('/direct') ? 'text-black font-bold' : ''}`}
      >
        <MessageCircle className="w-6 h-6" />
      </Link>

      {user && (
        <Link
          to={`/profile/${user.username}`}
          className={`flex flex-col items-center p-2 text-gray-700 ${
            isActive(`/profile/${user.username}`) ? 'text-black font-bold' : ''
          }`}
        >
          <Avatar
            src={user.profilePic}
            alt={user.username}
            className={`w-6 h-6 border ${
              isActive(`/profile/${user.username}`) ? 'border-black' : 'border-gray-200'
            }`}
            textClassName="text-[8px] font-extrabold"
          />
        </Link>
      )}
    </div>
  );
};

export default BottomNav;
