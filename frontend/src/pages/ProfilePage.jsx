import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, MessageCircle, Settings, Edit, X, Globe, UserCheck, UserPlus, Image } from 'lucide-react';
import api from '../services/api';
import PostCard from '../components/PostCard';

const ProfilePage = () => {
  const { username } = useParams();
  const { user: currentUser, updateUser } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);

  // Edit fields
  const [editBio, setEditBio] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editUsername, setEditUsername] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get(`/api/users/profile/${username}`);
      setProfile(data.user);
      setPosts(data.posts);
      
      // Seed edit fields if self
      if (currentUser?.username === data.user.username) {
        setEditUsername(data.user.username);
        setEditBio(data.user.bio || '');
        setEditWebsite(data.user.website || '');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username, currentUser]);

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      const { data } = await api.post(`/api/follows/toggle/${profile._id}`);
      setProfile((prev) => ({
        ...prev,
        isFollowing: data.isFollowing,
        followersCount: data.isFollowing ? prev.followersCount + 1 : prev.followersCount - 1,
      }));
    } catch (err) {
      console.error('Failed to toggle follow status:', err);
    }
  };

  const handleEditFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditFile(file);
      setEditFilePreview(URL.createObjectURL(file));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);

    const formData = new FormData();
    formData.append('username', editUsername);
    formData.append('bio', editBio);
    formData.append('website', editWebsite);
    if (editFile) {
      formData.append('profilePic', editFile);
    }

    try {
      const { data } = await api.put('/api/users/profile', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update contexts
      updateUser({
        username: data.username,
        profilePic: data.profilePic,
        bio: data.bio,
        website: data.website,
      });

      // Refresh layout and close
      setIsEditOpen(false);
      setEditFile(null);
      setEditFilePreview('');
      fetchProfile();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setEditLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-sm text-gray-500 font-semibold">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="text-center py-16 px-4">
        <h3 className="text-lg font-bold text-gray-800">Account Not Found</h3>
        <p className="text-sm text-gray-400 mt-1">The link you followed may be broken, or the page may have been removed.</p>
        <Link to="/" className="text-instagram-blue font-bold text-sm hover:underline mt-4 inline-block">Go back to Home</Link>
      </div>
    );
  }

  const isSelf = currentUser?.username === profile?.username;

  return (
    <div className="w-full max-w-4xl mx-auto py-8 px-4 md:px-6">
      {/* Profile Header */}
      <div className="flex flex-col md:flex-row gap-6 md:gap-12 items-center md:items-start pb-8 border-b border-instagram-border mb-8">
        {/* Avatar */}
        <div className="w-24 h-24 md:w-36 md:h-36 rounded-full overflow-hidden flex-shrink-0 border border-gray-200">
          <img
            src={profile.profilePic}
            alt={profile.username}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex-1 flex flex-col gap-4 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <h1 className="text-xl md:text-2xl font-semibold text-gray-900">{profile.username}</h1>
            
            <div className="flex justify-center md:justify-start gap-2.5">
              {isSelf ? (
                <>
                  <button
                    onClick={() => setIsEditOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs md:text-sm font-semibold transition-colors"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                  <button className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                    <Settings className="w-4 h-4 text-gray-700" />
                  </button>
                </>
              ) : (
                <button
                  onClick={handleFollowToggle}
                  className={`flex items-center gap-1.5 px-6 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shadow ${
                    profile.isFollowing
                      ? 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      : 'bg-instagram-blue hover:bg-instagram-hoverblue text-white'
                  }`}
                >
                  {profile.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Counts */}
          <div className="flex justify-around md:justify-start md:gap-10 border-y md:border-y-0 py-2.5 md:py-0 border-instagram-border text-sm">
            <span className="text-gray-500 md:text-black">
              <strong className="text-gray-900 mr-0.5">{profile.postsCount}</strong> posts
            </span>
            <span className="text-gray-500 md:text-black">
              <strong className="text-gray-900 mr-0.5">{profile.followersCount}</strong> followers
            </span>
            <span className="text-gray-500 md:text-black">
              <strong className="text-gray-900 mr-0.5">{profile.followingCount}</strong> following
            </span>
          </div>

          {/* Bio & Links */}
          <div className="flex flex-col text-xs md:text-sm gap-1">
            <p className="font-bold text-gray-900">{profile.username}</p>
            {profile.bio && <p className="text-gray-800 whitespace-pre-line leading-relaxed">{profile.bio}</p>}
            {profile.website && (
              <a
                href={`https://${profile.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-900 font-bold hover:underline flex items-center gap-1 self-center md:self-start mt-1 text-[11px] md:text-xs"
              >
                <Globe className="w-3.5 h-3.5" />
                {profile.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Grid of Posts */}
      {posts.length === 0 ? (
        <div className="text-center py-20 bg-white border border-instagram-border rounded-xl p-8 shadow-sm flex flex-col items-center gap-3">
          <Image className="w-16 h-16 text-gray-400 stroke-[1]" />
          <h3 className="font-semibold text-gray-800">No Posts Yet</h3>
          <p className="text-sm text-gray-500 max-w-xs">
            {isSelf ? 'Share your first photo or video now!' : `@${profile.username} has not posted anything yet.`}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-6">
          {posts.map((post) => (
            <div
              key={post._id}
              onClick={() => setSelectedPost(post)}
              className="relative aspect-square cursor-pointer group bg-black overflow-hidden rounded-md md:rounded-xl border border-gray-100"
            >
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

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-6 text-white font-bold transition-opacity z-10">
                <span className="flex items-center gap-1 text-sm md:text-base">
                  <Heart className="w-5 h-5 fill-white" />
                  {post.likes?.length || 0}
                </span>
                <span className="flex items-center gap-1 text-sm md:text-base">
                  <MessageCircle className="w-5 h-5 fill-white" />
                  {post.commentsCount || 0}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Post details viewer modal */}
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

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl p-6 flex flex-col gap-4 relative">
            <button
              onClick={() => {
                setIsEditOpen(false);
                setEditFile(null);
                setEditFilePreview('');
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X className="w-6 h-6" />
            </button>

            <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-2">Edit Profile</h3>

            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              {/* Picture Edit */}
              <div className="flex flex-col items-center gap-2">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-20 h-20 rounded-full overflow-hidden border border-gray-300 cursor-pointer relative group"
                >
                  <img
                    src={editFilePreview || profile.profilePic}
                    alt="preview"
                    className="w-full h-full object-cover group-hover:opacity-75"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-bold transition-all">
                    Change
                  </div>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleEditFileChange}
                  className="hidden"
                />
              </div>

              {/* Username Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                <input
                  type="text"
                  required
                  placeholder="Username"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-instagram-blue text-sm"
                />
              </div>

              {/* Bio Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Bio</label>
                <textarea
                  placeholder="Bio"
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  maxLength={150}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-instagram-blue text-sm resize-none"
                ></textarea>
              </div>

              {/* Website Input */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Website</label>
                <input
                  type="text"
                  placeholder="Website url (e.g. myspace.com)"
                  value={editWebsite}
                  onChange={(e) => setEditWebsite(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-instagram-blue text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="w-full bg-instagram-blue hover:bg-instagram-hoverblue text-white py-2.5 rounded-xl font-semibold mt-2 text-sm shadow transition-colors disabled:opacity-50"
              >
                {editLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
