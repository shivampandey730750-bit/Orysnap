import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import PostCard from '../components/PostCard';
import StoryViewerModal from '../components/StoryViewerModal';
import { Plus, Compass, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeedPage = () => {
  const { user: currentUser } = useAuth();
  const [posts, setPosts] = useState([]);
  const [stories, setStories] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Story modal state
  const [isStoryOpen, setIsStoryOpen] = useState(false);
  const [activeStoryUserIdx, setActiveStoryUserIdx] = useState(0);

  // Fetch feed stories
  const fetchStories = async () => {
    try {
      const { data } = await api.get('/api/stories/feed');
      setStories(data);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
    }
  };

  // Fetch feed posts
  const fetchPosts = useCallback(async (pageNum) => {
    if (loading) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/api/posts/feed?page=${pageNum}&limit=5`);
      if (data.length === 0) {
        setHasMore(false);
      } else {
        setPosts((prev) => (pageNum === 1 ? data : [...prev, ...data]));
      }
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchStories();
    fetchPosts(1);
  }, []);

  // Scroll event handler for infinite scrolling
  const handleScroll = useCallback(() => {
    if (!hasMore || loading) return;
    
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    // Check if within 200px of bottom
    if (documentHeight - scrollTop - windowHeight < 200) {
      setPage((prev) => {
        const nextPage = prev + 1;
        fetchPosts(nextPage);
        return nextPage;
      });
    }
  }, [hasMore, loading, fetchPosts]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handlePostDeleted = (deletedPostId) => {
    setPosts((prev) => prev.filter((p) => p._id !== deletedPostId));
  };

  const handleStoryCircleClick = (index) => {
    setActiveStoryUserIdx(index);
    setIsStoryOpen(true);
  };

  const handleStoryViewerClose = () => {
    setIsStoryOpen(false);
    fetchStories(); // Refetch to update seen status borders
  };

  // Add story upload helper
  const handleStoryUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('media', file);

    try {
      await api.post('/api/stories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      fetchStories();
      alert('Story shared successfully!');
    } catch (error) {
      console.error('Story upload failed:', error);
      alert('Story upload failed. Please try again.');
    }
  };

  return (
    <div className="w-full flex justify-center py-6 px-4 md:px-0">
      <div className="w-full max-w-4xl flex gap-8">
        {/* Left Side: Stories and Posts */}
        <div className="w-full md:w-3/5 flex flex-col gap-6">
          {/* Stories list */}
          <div className="bg-white border border-instagram-border rounded-xl p-4 flex gap-4 overflow-x-auto shadow-sm min-h-[110px] items-center">
            {/* Create Story Button */}
            <div className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer relative">
              <label className="cursor-pointer">
                <div className="w-16 h-16 rounded-full border border-gray-200 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors relative overflow-hidden">
                  {currentUser?.profilePic ? (
                    <img
                      src={currentUser.profilePic}
                      alt="your avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Plus className="w-6 h-6 text-gray-500" />
                  )}
                  <div className="absolute bottom-0 right-0 bg-instagram-blue p-0.5 rounded-full border-2 border-white text-white">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleStoryUpload}
                  className="hidden"
                />
              </label>
              <span className="text-xs text-gray-500 font-semibold truncate max-w-[70px]">Your story</span>
            </div>

            {/* List of active stories */}
            {stories.map((storyGroup, idx) => (
              <div
                key={storyGroup.user._id}
                onClick={() => handleStoryCircleClick(idx)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer"
              >
                <div
                  className={`w-16 h-16 rounded-full p-[2px] ${
                    storyGroup.hasUnseen
                      ? 'bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600'
                      : 'border border-gray-300'
                  }`}
                >
                  <div className="w-full h-full rounded-full bg-white p-[2px]">
                    <img
                      src={storyGroup.user.profilePic}
                      alt={storyGroup.user.username}
                      className="w-full h-full rounded-full object-cover border"
                    />
                  </div>
                </div>
                <span className="text-xs text-gray-700 font-semibold truncate max-w-[70px]">
                  {storyGroup.user.username}
                </span>
              </div>
            ))}
          </div>

          {/* Posts list */}
          <div className="flex flex-col">
            {posts.length === 0 && !loading ? (
              <div className="bg-white border border-instagram-border rounded-xl p-8 text-center flex flex-col items-center gap-3 shadow-sm">
                <Compass className="w-12 h-12 text-gray-400 stroke-[1.2]" />
                <h3 className="font-semibold text-gray-800">Welcome to your Feed</h3>
                <p className="text-sm text-gray-500 max-w-xs">
                  Follow some users or explore trending posts to fill your feed with updates!
                </p>
                <Link
                  to="/explore"
                  className="mt-2 px-4 py-2 bg-instagram-blue hover:bg-instagram-hoverblue text-white rounded-xl text-xs font-semibold shadow"
                >
                  Explore Posts
                </Link>
              </div>
            ) : (
              posts.map((post) => (
                <PostCard key={post._id} post={post} onPostDeleted={handlePostDeleted} />
              ))
            )}

            {/* Loading / End markers */}
            {loading && (
              <div className="text-center py-4 text-sm text-gray-500">Loading more posts...</div>
            )}
            {!hasMore && posts.length > 0 && (
              <div className="text-center py-6 text-sm text-gray-400 font-semibold">
                You've seen all posts! 🎉
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Suggestions & User Panel (Hidden on Mobile) */}
        <div className="hidden md:flex flex-col gap-4 w-2/5 p-2">
          {/* User profile details */}
          {currentUser && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={currentUser.profilePic}
                  alt={currentUser.username}
                  className="w-14 h-14 rounded-full object-cover border"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-gray-900 leading-tight">{currentUser.username}</span>
                  <span className="text-xs text-gray-500 mt-0.5">{currentUser.bio || 'OrySnap User'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Suggestions Header */}
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm font-bold text-gray-500">Suggestions For You</span>
            <span className="text-xs font-bold text-gray-900 hover:text-gray-500 cursor-pointer">See All</span>
          </div>

          {/* Seed User suggestions list */}
          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3.5">
                <img
                  src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"
                  alt="sophie"
                  className="w-8 h-8 rounded-full object-cover border"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-gray-900 leading-none">sophie_codes</span>
                  <span className="text-[10px] text-gray-400 mt-1">Suggested for you</span>
                </div>
              </div>
              <span className="text-xs font-bold text-instagram-blue hover:text-instagram-hoverblue cursor-pointer">
                Follow
              </span>
            </div>

            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3.5">
                <img
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
                  alt="nature"
                  className="w-8 h-8 rounded-full object-cover border"
                />
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-gray-900 leading-none">nature_seeker</span>
                  <span className="text-[10px] text-gray-400 mt-1">Suggested for you</span>
                </div>
              </div>
              <span className="text-xs font-bold text-instagram-blue hover:text-instagram-hoverblue cursor-pointer">
                Follow
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Viewer Modal */}
      <StoryViewerModal
        isOpen={isStoryOpen}
        onClose={handleStoryViewerClose}
        groupedStories={stories}
        initialUserIndex={activeStoryUserIdx}
        onStoryDeleted={fetchStories}
      />
    </div>
  );
};

export default FeedPage;
