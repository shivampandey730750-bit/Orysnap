import React, { useState, useRef } from 'react';
import { X, Image, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../services/api';

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length === 0) return;

    setFiles((prev) => [...prev, ...selectedFiles]);

    const newPreviews = selectedFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
    setCurrentSlide(0);
    setError('');
  };

  const removeFile = (index) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    const updatedPreviews = previews.filter((_, i) => i !== index);
    
    setFiles(updatedFiles);
    setPreviews(updatedPreviews);
    
    if (currentSlide >= updatedPreviews.length) {
      setCurrentSlide(Math.max(0, updatedPreviews.length - 1));
    }
  };

  const handleNextSlide = () => {
    setCurrentSlide((prev) => (prev === previews.length - 1 ? 0 : prev + 1));
  };

  const handlePrevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? previews.length - 1 : prev - 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Please select at least one image or video.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('caption', caption);
    formData.append('location', location);
    files.forEach((file) => {
      formData.append('media', file);
    });

    try {
      const { data } = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (onPostCreated) {
        onPostCreated(data);
      }
      
      // Reset form states
      setFiles([]);
      setPreviews([]);
      setCaption('');
      setLocation('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to share post. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 transition-opacity">
      <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300">
        <X className="w-8 h-8" />
      </button>

      <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row max-h-[90vh]">
        {/* Left Side: Media Upload / Preview */}
        <div className="w-full md:w-3/5 bg-gray-50 flex flex-col justify-center items-center relative aspect-square md:aspect-auto md:min-h-[500px]">
          {previews.length === 0 ? (
            <div className="flex flex-col items-center p-6 text-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <Image className="w-16 h-16 text-gray-400 mb-4" />
              <p className="text-lg font-semibold text-gray-700">Upload photos and videos here</p>
              <p className="text-xs text-gray-400 mt-1">Drag and drop or browse from folder</p>
            </div>
          ) : (
            <div className="w-full h-full relative group flex items-center justify-center bg-black">
              {/* Media Element */}
              {files[currentSlide]?.type.startsWith('video') ? (
                <video
                  src={previews[currentSlide]}
                  className="max-w-full max-h-full object-contain"
                  controls
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <img
                  src={previews[currentSlide]}
                  alt="preview"
                  className="max-w-full max-h-full object-contain"
                />
              )}

              {/* Prev / Next controls */}
              {previews.length > 1 && (
                <>
                  <button
                    onClick={handlePrevSlide}
                    className="absolute left-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleNextSlide}
                    className="absolute right-3 p-1.5 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Slide indicators */}
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                {previews.map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full transition-all ${
                      i === currentSlide ? 'bg-instagram-blue w-3' : 'bg-white/60'
                    }`}
                  ></div>
                ))}
              </div>

              {/* Remove File Button */}
              <button
                onClick={() => removeFile(currentSlide)}
                className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <input
            type="file"
            multiple
            accept="image/*,video/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {/* Right Side: Form Details */}
        <div className="w-full md:w-2/5 flex flex-col justify-between border-t md:border-t-0 md:border-l border-instagram-border bg-white">
          <div className="p-4 border-b border-instagram-border flex justify-between items-center">
            <h3 className="font-semibold text-center w-full">Create New Post</h3>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between p-4 gap-4 overflow-y-auto">
            <div className="flex flex-col gap-4">
              {error && (
                <div className="bg-red-50 text-red-700 text-xs p-2.5 rounded-xl border border-red-100 font-medium">
                  {error}
                </div>
              )}

              {/* Caption field */}
              <textarea
                placeholder="Write a caption... (e.g. #sunset #nature)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                maxLength={2200}
                rows={5}
                className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-instagram-blue resize-none"
              ></textarea>

              {/* Location field */}
              <div className="flex items-center border border-gray-200 rounded-xl p-2.5 bg-gray-50">
                <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Add location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-transparent text-sm focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-4">
              {previews.length > 0 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full text-center py-2 border border-dashed border-gray-300 hover:border-instagram-blue text-sm rounded-xl font-medium text-gray-600 transition-colors"
                >
                  Add More Files
                </button>
              )}

              <button
                type="submit"
                disabled={loading || previews.length === 0}
                className="w-full bg-instagram-blue hover:bg-instagram-hoverblue text-white py-2.5 px-4 rounded-xl font-semibold transition-all disabled:opacity-50 text-sm"
              >
                {loading ? 'Sharing...' : 'Share Post'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
