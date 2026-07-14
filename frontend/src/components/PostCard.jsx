import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Send, MapPin, ChevronLeft, ChevronRight, MessageSquare, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const PostCard = ({ post, onPostDeleted }) => {
  const { user: currentUser } = useAuth();
  const [likes, setLikes] = useState(post.likes || []);
  const [isLiked, setIsLiked] = useState(post.likes?.includes(currentUser?._id));
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [replyTo, setReplyTo] = useState(null); // stores { commentId, username }
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    setIsLiked(likes.includes(currentUser?._id));
  }, [likes, currentUser]);

  const handleLikeToggle = async () => {
    try {
      if (isLiked) {
        const { data } = await api.post(`/api/posts/${post._id}/unlike`);
        setLikes(data.likes);
      } else {
        const { data } = await api.post(`/api/posts/${post._id}/like`);
        setLikes(data.likes);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const fetchComments = async () => {
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/api/comments/post/${post._id}`);
      setComments(data);
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const payload = {
        postId: post._id,
        text: commentText,
      };
      if (replyTo) {
        payload.parentCommentId = replyTo.commentId;
      }

      const { data } = await api.post('/api/comments', payload);
      
      // Refresh comments
      fetchComments();
      setCommentText('');
      setReplyTo(null);
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const handleCommentLike = async (commentId, isCommentLiked) => {
    try {
      if (isCommentLiked) {
        await api.post(`/api/comments/${commentId}/unlike`);
      } else {
        await api.post(`/api/comments/${commentId}/like`);
      }
      fetchComments();
    } catch (error) {
      console.error('Failed to like comment:', error);
    }
  };

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/api/posts/${post._id}`);
      if (onPostDeleted) onPostDeleted(post._id);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === post.mediaUrls.length - 1 ? 0 : prev + 1));
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? post.mediaUrls.length - 1 : prev - 1));
  };

  const formatPostTime = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);

    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours} hours ago`;
    return `${days} days ago`;
  };

  return (
    <div className="bg-white border border-instagram-border rounded-xl w-full max-w-xl mx-auto shadow-sm overflow-hidden mb-5">
      {/* Header */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.user.username}`}>
            <img
              src={post.user.profilePic}
              alt={post.user.username}
              className="w-9 h-9 rounded-full object-cover border border-gray-100"
            />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <Link to={`/profile/${post.user.username}`} className="font-bold text-sm text-gray-900 hover:underline">
                {post.user.username}
              </Link>
              <span className="text-gray-400 text-xs">•</span>
              <span className="text-gray-400 text-xs font-semibold">{formatPostTime(post.createdAt)}</span>
            </div>
            {post.location && (
              <span className="text-xs text-gray-500 flex items-center gap-0.5">
                <MapPin className="w-3 h-3 text-gray-400" />
                {post.location}
              </span>
            )}
          </div>
        </div>

        {/* Delete Post option for post owner */}
        {currentUser?._id === post.user._id && (
          <button onClick={handleDeletePost} className="text-gray-400 hover:text-red-500 p-1">
            <Trash2 className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Media Carousel */}
      <div className="relative aspect-square bg-neutral-900 flex items-center justify-center overflow-hidden">
        {post.mediaUrls[currentSlide]?.includes('.mp4') || post.mediaUrls[currentSlide]?.includes('.webm') ? (
          <video
            src={post.mediaUrls[currentSlide]}
            className="w-full h-full object-contain"
            controls
            loop
            muted
          />
        ) : (
          <img
            src={post.mediaUrls[currentSlide]}
            alt="post media"
            className="w-full h-full object-contain"
          />
        )}

        {/* Slide controls */}
        {post.mediaUrls.length > 1 && (
          <>
            <button
              onClick={handlePrevSlide}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/70 hover:bg-white text-gray-800 shadow"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextSlide}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/70 hover:bg-white text-gray-800 shadow"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Slide indicator dots */}
        {post.mediaUrls.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1">
            {post.mediaUrls.map((_, idx) => (
              <div
                key={idx}
                className={`w-1.5 h-1.5 rounded-full ${idx === currentSlide ? 'bg-instagram-blue' : 'bg-white/60'}`}
              ></div>
            ))}
          </div>
        )}
      </div>

      {/* Actions toolbar */}
      <div className="flex justify-between items-center px-3 pt-3">
        <div className="flex gap-4">
          <button onClick={handleLikeToggle} className="transition-transform active:scale-125">
            <Heart
              className={`w-6 h-6 ${
                isLiked ? 'text-instagram-red fill-instagram-red stroke-instagram-red' : 'text-gray-800 hover:text-gray-600'
              }`}
            />
          </button>
          <button
            onClick={() => {
              setShowComments(!showComments);
              if (!showComments) fetchComments();
            }}
          >
            <MessageCircle className="w-6 h-6 text-gray-800 hover:text-gray-600" />
          </button>
          <button>
            <Send className="w-6 h-6 text-gray-800 hover:text-gray-600" />
          </button>
        </div>
      </div>

      {/* Caption & Comments summary */}
      <div className="px-3 py-2 flex flex-col gap-1.5">
        {/* Likes Count */}
        <span className="font-bold text-sm text-gray-900">
          {likes.length} {likes.length === 1 ? 'like' : 'likes'}
        </span>

        {/* Caption */}
        {post.caption && (
          <p className="text-sm text-gray-900">
            <Link to={`/profile/${post.user.username}`} className="font-bold hover:underline mr-1.5">
              {post.user.username}
            </Link>
            {post.caption}
          </p>
        )}

        {/* View all comments action */}
        {post.commentsCount > 0 && !showComments && (
          <button
            onClick={() => {
              setShowComments(true);
              fetchComments();
            }}
            className="text-gray-500 text-sm hover:underline text-left"
          >
            View all {post.commentsCount} comments
          </button>
        )}
      </div>

      {/* Expanded comments & list */}
      {showComments && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-3 flex flex-col gap-3 max-h-[300px] overflow-y-auto">
          {loadingComments ? (
            <p className="text-xs text-gray-400 text-center py-2">Loading comments...</p>
          ) : comments.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-2">No comments yet. Be the first to comment!</p>
          ) : (
            comments.map((comment) => {
              const isCommentLiked = comment.likes?.includes(currentUser?._id);
              return (
                <div key={comment._id} className="flex flex-col gap-1">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-2">
                      <img
                        src={comment.user.profilePic}
                        alt={comment.user.username}
                        className="w-7 h-7 rounded-full object-cover border"
                      />
                      <div className="flex flex-col text-xs md:text-sm">
                        <span className="text-gray-900">
                          <Link to={`/profile/${comment.user.username}`} className="font-bold hover:underline mr-1.5">
                            {comment.user.username}
                          </Link>
                          {comment.text}
                        </span>
                        <div className="flex gap-3 text-xs text-gray-400 font-semibold mt-1">
                          <span>{formatPostTime(comment.createdAt)}</span>
                          {comment.likes?.length > 0 && (
                            <span>{comment.likes.length} {comment.likes.length === 1 ? 'like' : 'likes'}</span>
                          )}
                          <button
                            onClick={() => setReplyTo({ commentId: comment._id, username: comment.user.username })}
                            className="hover:underline text-gray-500"
                          >
                            Reply
                          </button>
                        </div>
                      </div>
                    </div>

                    <button onClick={() => handleCommentLike(comment._id, isCommentLiked)}>
                      <Heart
                        className={`w-3.5 h-3.5 ${
                          isCommentLiked ? 'text-instagram-red fill-instagram-red' : 'text-gray-400'
                        }`}
                      />
                    </button>
                  </div>

                  {/* Render nested replies */}
                  {comment.replies?.map((reply) => {
                    const isReplyLiked = reply.likes?.includes(currentUser?._id);
                    return (
                      <div key={reply._id} className="ml-9 flex items-start justify-between">
                        <div className="flex gap-2">
                          <img
                            src={reply.user.profilePic}
                            alt={reply.user.username}
                            className="w-6 h-6 rounded-full object-cover border"
                          />
                          <div className="flex flex-col text-xs">
                            <span className="text-gray-900">
                              <Link to={`/profile/${reply.user.username}`} className="font-bold hover:underline mr-1.5">
                                {reply.user.username}
                              </Link>
                              {reply.text}
                            </span>
                            <div className="flex gap-3 text-xs text-gray-400 font-semibold mt-1">
                              <span>{formatPostTime(reply.createdAt)}</span>
                              {reply.likes?.length > 0 && (
                                <span>{reply.likes.length} likes</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <button onClick={() => handleCommentLike(reply._id, isReplyLiked)}>
                          <Heart
                            className={`w-3 h-3 ${isReplyLiked ? 'text-instagram-red fill-instagram-red' : 'text-gray-400'}`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Comment Input Form */}
      <form onSubmit={handleCommentSubmit} className="border-t border-instagram-border p-3 flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center bg-gray-50 rounded-xl border border-gray-200 px-3 py-2">
          {replyTo && (
            <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full mr-2 flex items-center gap-1 font-semibold">
              @{replyTo.username}
              <button type="button" onClick={() => setReplyTo(null)} className="hover:text-blue-900 font-bold">×</button>
            </span>
          )}
          <input
            type="text"
            placeholder="Add a comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="w-full bg-transparent text-sm focus:outline-none"
          />
        </div>
        <button
          type="submit"
          disabled={!commentText.trim()}
          className="text-instagram-blue hover:text-instagram-hoverblue font-bold text-sm px-2 disabled:opacity-50"
        >
          Post
        </button>
      </form>
    </div>
  );
};

export default PostCard;
