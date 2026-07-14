import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { X, Search } from 'lucide-react';
import api from '../services/api';

const SearchSlider = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/api/users/search?q=${encodeURIComponent(query)}`);
        setResults(data);
      } catch (error) {
        console.error('Failed to search users:', error);
      } finally {
        setLoading(false);
      }
    }, 400); // 400ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  // Reset query on close
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

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
          <h2 className="text-xl font-bold text-gray-900">Search</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-instagram-blue text-sm bg-gray-50"
            autoFocus
          />
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 mt-2">
          {loading && (
            <p className="text-sm text-gray-400 text-center py-4">Searching...</p>
          )}

          {!loading && query && results.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No results found.</p>
          )}

          {!loading && !query && (
            <p className="text-xs text-gray-400 text-center py-8">Search for accounts by username</p>
          )}

          {results.map((user) => (
            <Link
              key={user._id}
              to={`/profile/${user.username}`}
              onClick={onClose}
              className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <img
                src={user.profilePic}
                alt={user.username}
                className="w-11 h-11 rounded-full object-cover border border-gray-100"
              />
              <div className="flex flex-col">
                <span className="font-semibold text-sm text-gray-900">{user.username}</span>
                <span className="text-xs text-gray-400 truncate max-w-[180px]">{user.bio || 'No bio'}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};

export default SearchSlider;
