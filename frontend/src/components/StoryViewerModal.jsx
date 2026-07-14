import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Trash2, Volume2, VolumeX, Music } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Avatar from './Avatar';

const StoryViewerModal = ({ isOpen, onClose, groupedStories = [], initialUserIndex = 0, onStoryDeleted }) => {
  const { user: currentUser } = useAuth();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isStoryMuted, setIsStoryMuted] = useState(false);
  const [viewers, setViewers] = useState([]);
  const [isViewersOpen, setIsViewersOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const timerRef = useRef(null);

  const [localGrouped, setLocalGrouped] = useState([]);

  // Sync localGrouped with prop updates only when modal is closed
  useEffect(() => {
    if (!isOpen) {
      setLocalGrouped(groupedStories);
    }
  }, [groupedStories, isOpen]);

  const activeUser = localGrouped[currentUserIndex];
  const activeStory = activeUser?.stories[currentStoryIndex];

  // Reset counters when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentUserIndex(initialUserIndex);
      setCurrentStoryIndex(0);
      setProgress(0);
      setLocalGrouped(groupedStories);
      setIsViewersOpen(false);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, initialUserIndex]);

  // Mark story as seen on display
  useEffect(() => {
    if (isOpen && activeStory) {
      setProgress(0);
      markAsSeen(activeStory._id);
    }
  }, [isOpen, currentUserIndex, currentStoryIndex]);

  // Fetch story viewers when story changes (Story Owner only)
  useEffect(() => {
    if (isOpen && activeStory && currentUser && activeUser) {
      const isOwner = (currentUser._id || currentUser.id) === (activeUser.user._id || activeUser.user.id);
      setIsViewersOpen(false); // Close viewer tray when story changes
      setShowDeleteConfirm(false); // Close delete confirm overlay when story changes
      if (isOwner) {
        const fetchViewers = async () => {
          try {
            const { data } = await api.get(`/api/stories/${activeStory._id || activeStory.id}/viewers`);
            setViewers(data);
          } catch (err) {
            console.error('Failed to fetch story viewers:', err);
          }
        };
        fetchViewers();
      } else {
        setViewers([]);
      }
    }
  }, [isOpen, activeStory, currentUser, activeUser]);

  // Auto progression timer
  useEffect(() => {
    if (!isOpen || !activeStory || isViewersOpen || showDeleteConfirm) return; // Pause timer if viewersTray or deleteConfirm is open

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
  }, [isOpen, currentUserIndex, currentStoryIndex, activeStory, isViewersOpen, showDeleteConfirm]);

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
    } else if (currentUserIndex < localGrouped.length - 1) {
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
      setCurrentStoryIndex(localGrouped[prevUserIndex].stories.length - 1);
    } else {
      // At start, loop or close? Let's just reset current story
      setProgress(0);
    }
  };

  const getRemainingTime = (expiresAt) => {
    if (!expiresAt) return '';
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) {
      return `${hours}h ${minutes}m left`;
    }
    return `${minutes}m left`;
  };

  const handleDeleteStory = async (storyId) => {
    if (!storyId) {
      alert('Error: Story ID is undefined or missing.');
      return;
    }
    
    console.log('Attempting to delete story ID:', storyId);
    try {
      await api.delete(`/api/stories/${storyId}`);
      
      // Update local state first to prevent index out of bounds crashes
      const updatedGrouped = localGrouped.map((userGroup, uIdx) => {
        if (uIdx === currentUserIndex) {
          return {
            ...userGroup,
            stories: userGroup.stories.filter((s) => (s._id || s.id) !== storyId),
          };
        }
        return userGroup;
      });

      const updatedUserStories = updatedGrouped[currentUserIndex].stories;

      if (updatedUserStories.length === 0) {
        // No stories left for this user, close modal
        onClose();
      } else {
        // Safe index transition
        if (currentStoryIndex >= updatedUserStories.length) {
          setCurrentStoryIndex(updatedUserStories.length - 1);
        }
        setProgress(0);
        setLocalGrouped(updatedGrouped);
      }

      if (onStoryDeleted) {
        onStoryDeleted(storyId);
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
            <Avatar
              src={activeUser.user.profilePic}
              alt={activeUser.user.username}
              className="w-8 h-8 border border-white/40"
              textClassName="text-[10px] font-extrabold"
            />
            <span className="font-semibold text-sm drop-shadow">{activeUser.user.username}</span>
            <span className="text-xs text-white/60 drop-shadow flex items-center gap-1.5">
              <span>
                {activeStory?.createdAt
                  ? new Date(activeStory.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : ''}
              </span>
              {activeStory?.expiresAt && (
                <>
                  <span className="text-white/40">•</span>
                  <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded-full font-bold border border-white/10">
                    {getRemainingTime(activeStory.expiresAt)}
                  </span>
                </>
              )}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {activeStory?.songUrl && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsStoryMuted(!isStoryMuted);
                }}
                className="p-1 text-white/80 hover:text-white transition-colors z-45"
                title={isStoryMuted ? 'Unmute' : 'Mute'}
              >
                {isStoryMuted ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5 animate-pulse" />
                )}
              </button>
            )}

            {/* Delete Option for Story Owner */}
            {currentUser?._id === activeUser.user._id && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDeleteConfirm(true);
                }}
                className="p-1 text-white/70 hover:text-red-500 transition-colors z-45"
                title="Delete Story"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
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
        <div className="absolute top-20 bottom-20 left-0 right-0 flex justify-between z-30">
          <div onClick={handlePrevStory} className="w-1/3 h-full cursor-pointer"></div>
          <div onClick={handleNextStory} className="w-2/3 h-full cursor-pointer"></div>
        </div>

        {/* Background Music player */}
        {activeStory?.songUrl && (
          <audio
            key={activeStory._id}
            src={activeStory.songUrl}
            autoPlay
            loop
            muted={isStoryMuted}
          />
        )}

        {/* Beautiful Animated Music Sticker Overlay */}
        {activeStory?.songUrl && (
          <div className="absolute bottom-20 left-4 right-4 flex justify-center z-40 pointer-events-none">
            <div className="bg-black/50 backdrop-blur-lg border border-white/20 px-4 py-2 rounded-full flex items-center gap-3 shadow-2xl text-white pointer-events-auto select-none max-w-[280px]">
              <div className={`w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-400 flex items-center justify-center shadow-inner ${
                !isStoryMuted ? 'animate-spin [animation-duration:4s]' : ''
              }`}>
                <Music className="w-4 h-4 text-white" />
              </div>
              
              <div className="flex flex-col text-left max-w-[180px] overflow-hidden">
                <span className="text-[11px] font-extrabold tracking-wide truncate">
                  {activeStory.songTitle || 'Internet Song'}
                </span>
                <span className="text-[9px] text-white/75 font-semibold tracking-wider uppercase truncate">
                  Background Music
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Story Viewers list toggle (Story Owner only) */}
        {isOpen && activeStory && (currentUser?._id === activeUser.user._id || currentUser?.id === activeUser.user.id) && (
          <button
            onClick={() => setIsViewersOpen(true)}
            className="absolute bottom-5 left-4 z-40 bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs text-white/90 font-semibold transition-all pointer-events-auto shadow-md"
          >
            <span className="text-sm">👁️</span>
            <span>{viewers.length} Viewers</span>
          </button>
        )}

        {/* Viewers List Modal Overlay */}
        {isViewersOpen && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col justify-end pointer-events-auto">
            <div className="bg-white rounded-t-3xl p-6 flex flex-col gap-4 max-h-[70%] overflow-y-auto text-gray-900 relative">
              <button
                onClick={() => setIsViewersOpen(false)}
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
              >
                <X className="w-6 h-6" />
              </button>
              
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">
                Seen by ({viewers.length})
              </h3>
              
              <div className="flex flex-col gap-3.5 overflow-y-auto pr-1">
                {viewers.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">No viewers yet.</p>
                ) : (
                  viewers.map((viewer) => (
                    <Link
                      key={viewer._id}
                      to={`/profile/${viewer.username}`}
                      onClick={() => {
                        setIsViewersOpen(false);
                        onClose();
                      }}
                      className="flex items-center gap-3 p-1 rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      <Avatar
                        src={viewer.profilePic}
                        alt={viewer.username}
                        className="w-9 h-9 border border-gray-200"
                        textClassName="text-xs font-bold"
                      />
                      <span className="font-semibold text-xs text-gray-900">{viewer.username}</span>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Custom Delete Confirmation Overlay */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center pointer-events-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 w-full max-w-[280px] flex flex-col gap-4 text-center shadow-2xl animate-scale-in text-white">
              <h4 className="font-bold text-sm">Delete Story?</h4>
              <p className="text-[11px] text-neutral-400 leading-relaxed">This will permanently delete your story. You cannot undo this action.</p>
              <div className="flex flex-col gap-2 mt-2">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    handleDeleteStory(activeStory?._id || activeStory?.id);
                  }}
                  className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all shadow"
                >
                  Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

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
