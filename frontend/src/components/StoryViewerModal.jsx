import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const StoryViewerModal = ({ isOpen, onClose, groupedStories = [], initialUserIndex = 0, onStoryDeleted }) => {
  const { user: currentUser } = useAuth();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);

  const activeUser = groupedStories[currentUserIndex];
  const activeStory = activeUser?.stories[currentStoryIndex];

  // Reset counters when opening/closing or switching users
  useEffect(() => {
    if (isOpen) {
      setCurrentUserIndex(initialUserIndex);
      setCurrentStoryIndex(0);
      setProgress(0);
    }
  }, [isOpen, initialUserIndex]);

  // Mark story as seen on display
  useEffect(() => {
    if (isOpen && activeStory) {
      setProgress(0);
      markAsSeen(activeStory._id);
    }
  }, [isOpen, currentUserIndex, currentStoryIndex]);

  // Auto progression timer
  useEffect(() => {
    if (!isOpen || !activeStory) return;

    const duration = activeStory.isVideo ? 10000 : 5000; // 10s for video, 5s for photo
    const intervalTime = 100;
    const increment = (intervalTime / duration) * 100;

    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timerRef.current);
          handleNextStory();
          return 0;
        }
        return prev + increment;
      });
    }, intervalTime);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, currentUserIndex, currentStoryIndex, activeStory]);

  if (!isOpen || !activeUser) return null;

  const markAsSeen = async (storyId) => {
    try {
      await api.post(`/api/stories/${storyId}/seen`);
      activeStory.isSeen = true; // Update local state representation
    } catch (error) {
      console.error('Failed to mark story as seen:', error);
    }
  };

  const handleNextStory = () => {
    if (currentStoryIndex < activeUser.stories.length - 1) {
      // Next story of same user
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex < groupedStories.length - 1) {
      // Next user's stories
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      // All stories completed, close viewer
      onClose();
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      // Prev story of same user
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      // Prev user's stories (start at their last story)
      const prevUserIndex = currentUserIndex - 1;
      setCurrentUserIndex(prevUserIndex);
      setCurrentStoryIndex(groupedStories[prevUserIndex].stories.length - 1);
    } else {
      // At start, loop or close? Let's just reset current story
      setProgress(0);
    }
  };

  const handleDeleteStory = async (storyId) => {
    if (!window.confirm('Are you sure you want to delete this story?')) return;
    try {
      await api.delete(`/api/stories/${storyId}`);
      
      if (onStoryDeleted) {
        onStoryDeleted(storyId);
      }
      
      if (activeUser.stories.length <= 1) {
        onClose();
      } else {
        handleNextStory();
      }
    } catch (error) {
      console.error('Failed to delete story:', error);
      alert('Failed to delete story. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 transition-all">
      {/* Close button */}
      <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-55">
        <X className="w-8 h-8" />
      </button>

      <div className="relative flex items-center justify-center w-full max-w-md h-[85vh] max-h-[800px] bg-black rounded-2xl overflow-hidden shadow-2xl">
        {/* Progress bars header */}
        <div className="absolute top-3 left-3 right-3 flex gap-1 z-35">
          {activeUser.stories.map((story, index) => (
            <div key={story._id} className="h-1 bg-gray-600 rounded-full flex-1 overflow-hidden">
              <div
                className="h-full bg-white transition-all ease-linear"
                style={{
                  width:
                    index < currentStoryIndex
                      ? '100%'
                      : index === currentStoryIndex
                      ? `${progress}%`
                      : '0%',
                }}
              ></div>
            </div>
          ))}
        </div>

        {/* User Info Header */}
        <div className="absolute top-6 left-3 right-3 flex items-center justify-between z-35 p-1 text-white">
          <div className="flex items-center gap-3.5">
            <img
              src={activeUser.user.profilePic}
              alt={activeUser.user.username}
              className="w-8 h-8 rounded-full object-cover border border-white/40"
            />
            <span className="font-semibold text-sm drop-shadow">{activeUser.user.username}</span>
            <span className="text-xs text-white/60 drop-shadow">
              {new Date(activeStory?.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Delete Option for Story Owner */}
          {currentUser?._id === activeUser.user._id && (
            <button
              onClick={() => handleDeleteStory(activeStory._id)}
              className="p-1 text-white/70 hover:text-red-500 transition-colors z-45"
              title="Delete Story"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Media display */}
        <div className="w-full h-full flex justify-center items-center select-none bg-neutral-900">
          {activeStory?.isVideo ? (
            <video
              src={activeStory.mediaUrl}
              className="max-w-full max-h-full object-contain"
              autoPlay
              muted
              playsInline
            />
          ) : (
            <img
              src={activeStory?.mediaUrl}
              alt="story media"
              className="max-w-full max-h-full object-contain"
            />
          )}
        </div>

        {/* Navigation Overlays */}
        <div className="absolute inset-0 flex justify-between z-30">
          <div onClick={handlePrevStory} className="w-1/3 h-full cursor-pointer"></div>
          <div onClick={handleNextStory} className="w-2/3 h-full cursor-pointer"></div>
        </div>

        {/* Desktop control arrows */}
        <button
          onClick={handlePrevStory}
          className="hidden md:flex absolute -left-14 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-40"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={handleNextStory}
          className="hidden md:flex absolute -right-14 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white z-40"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default StoryViewerModal;
