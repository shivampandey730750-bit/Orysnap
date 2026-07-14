import React, { useState, useEffect } from 'react';
import { X, Music, Check, Link as LinkIcon, Disc } from 'lucide-react';
import api from '../services/api';

const SONG_PRESETS = [
  { title: 'Chill Lo-Fi Lounge', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { title: 'Retro Synthwave Beats', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { title: 'Acoustic Summer Breeze', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
  { title: 'Morning Coffee Acoustic', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
];

const CreateStoryModal = ({ isOpen, onClose, file, onUploadSuccess }) => {
  const [previewUrl, setPreviewUrl] = useState('');
  const [songOption, setSongOption] = useState('none'); // 'none', 'preset', 'custom'
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [customSongUrl, setCustomSongUrl] = useState('');
  const [songTitle, setSongTitle] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  if (!isOpen || !file) return null;

  const isVideo = file.type.startsWith('video');

  const handleShare = async () => {
    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('media', file);

    let targetSongUrl = '';
    let targetSongTitle = '';

    if (songOption === 'preset') {
      targetSongUrl = SONG_PRESETS[selectedPresetIdx].url;
      targetSongTitle = SONG_PRESETS[selectedPresetIdx].title;
    } else if (songOption === 'custom') {
      if (!customSongUrl.trim()) {
        setError('Please paste a valid song MP3 URL');
        setIsUploading(false);
        return;
      }
      targetSongUrl = customSongUrl.trim();
      targetSongTitle = songTitle.trim() || 'Internet Song';
    }

    if (targetSongUrl) {
      formData.append('songUrl', targetSongUrl);
      formData.append('songTitle', targetSongTitle);
    }

    try {
      await api.post('/api/stories', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      onUploadSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to upload story. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-all animate-fade-in">
      <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        {/* Media Preview Column */}
        <div className="w-full md:w-1/2 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[450px]">
          {isVideo ? (
            <video src={previewUrl} controls className="w-full h-full object-contain" />
          ) : (
            <img src={previewUrl} alt="Preview" className="w-full h-full object-contain" />
          )}

          {/* Floating close button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Configurations Column */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Share to Story</h3>
            
            {error && (
              <div className="mb-4 text-xs text-red-500 bg-red-50 border border-red-100 p-2.5 rounded-xl">
                {error}
              </div>
            )}

            {/* Song Options */}
            <div className="mb-5">
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Background Music
              </label>
              
              <div className="grid grid-cols-3 gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => setSongOption('none')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    songOption === 'none'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  None
                </button>
                <button
                  type="button"
                  onClick={() => setSongOption('preset')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                    songOption === 'preset'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  Presets
                </button>
                <button
                  type="button"
                  onClick={() => setSongOption('custom')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 ${
                    songOption === 'custom'
                      ? 'bg-black text-white border-black'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Custom Link
                </button>
              </div>

              {/* Preset selection dropdown */}
              {songOption === 'preset' && (
                <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100 animate-slide-up">
                  {SONG_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.title}
                      type="button"
                      onClick={() => setSelectedPresetIdx(idx)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs flex items-center justify-between border transition-all ${
                        selectedPresetIdx === idx
                          ? 'bg-white border-instagram-blue text-instagram-blue font-bold shadow-sm'
                          : 'bg-transparent border-transparent text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <span className="truncate flex items-center gap-2">
                        <Disc className={`w-4 h-4 text-gray-400 ${selectedPresetIdx === idx ? 'animate-spin' : ''}`} />
                        {preset.title}
                      </span>
                      {selectedPresetIdx === idx && <Check className="w-4 h-4 text-instagram-blue" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Custom Song Inputs */}
              {songOption === 'custom' && (
                <div className="flex flex-col gap-2.5 bg-gray-50 p-3 rounded-2xl border border-gray-100 animate-slide-up">
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 mb-1">MP3 Music URL</label>
                    <input
                      type="url"
                      placeholder="Paste MP3 link (e.g. https://.../song.mp3)"
                      value={customSongUrl}
                      onChange={(e) => setCustomSongUrl(e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-instagram-blue"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[10px] font-bold text-gray-400 mb-1">Song Title (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Starboy - The Weeknd"
                      value={songTitle}
                      onChange={(e) => setSongTitle(e.target.value)}
                      className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-instagram-blue"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="flex-1 py-3 text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleShare}
              disabled={isUploading}
              className="flex-1 py-3 text-sm font-semibold bg-instagram-blue hover:bg-instagram-hoverblue text-white rounded-xl transition-all disabled:opacity-50 shadow-md shadow-instagram-blue/20 flex items-center justify-center gap-1.5"
            >
              {isUploading ? 'Uploading...' : 'Share to Story'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateStoryModal;
