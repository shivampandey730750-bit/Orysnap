import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, X } from 'lucide-react';
import api from '../services/api';
import PostCard from '../components/PostCard';

const ExplorePage = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  const fetchExplorePosts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/api/posts/explore?page=1&limit=24');
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch explore posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExplorePosts();
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-xl font-bold mb-6 text-gray-900 px-1">Explore</h2>

      {loading && posts.length === 0 ? (
        <div className="text-center py-12 text-sm text-gray-500 font-semibold">
          Discovering posts for you...
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-sm text-gray-400 bg-white border border-instagram-border rounded-xl p-8 shadow-sm">
          No new posts to explore right now.
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-6">
          {posts.map((post) => (
            <div
              key={post._id}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square cursor-pointer group bg-black overflow-hidden rounded-md md:rounded-xl border border-gray-100"
            >
              {/* Media element (images/videos) */}
              {post.mediaUrls[0]?.includes('.mp4') || post.mediaUrls[0]?.includes('.webm') ? (
                <video
                  src={post.mediaUrls[0]}
                  className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={post.mediaUrls[0]}
                  alt="post preview"
                  className="w-full h-full object-cover group-hover:opacity-75 transition-opacity"
                />
              )}

              {/* Hover overlay with likes/comments counts */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 text-white font-bold transition-opacity z-10">
                <span className="flex items-center gap-1.5 text-sm md:text-base">
                  <Heart className="w-5 h-5 fill-white" />
                  {post.likes?.length || 0}
                </span>
                <span className="flex items-center gap-1.5 text-sm md:text-base">
                  <MessageCircle className="w-5 h-5 fill-white" />
                  {post.commentsCount || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post Detail Modal */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 transition-all">
          <button
            onClick={() => setSelectedPost(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <X className="w-8 h-8" />
          </button>
          
          <div className="w-full max-w-xl">
            <PostCard post={selectedPost} onPostDeleted={() => setSelectedPost(null)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
