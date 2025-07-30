// frontend/src/pages/UploadPodcast.tsx

import { useNavigate } from 'react-router-dom';
import React, { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import type { Podcast } from "../types";
import { useAuth } from '../context/AuthContext';

export default function UploadPodcast() {
  const [file, setFile] = useState<File | null>(null); // Audio file
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState(''); // New state for author
  const [durationMinutes, setDurationMinutes] = useState<string>(''); // New state for duration
  const [coverArtFile, setCoverArtFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [uploadedPodcastData, setUploadedPodcastData] = useState<Podcast | null>(null);

  const { token, loading, isAuthenticated, isLecturer } = useAuth();
  const navigate = useNavigate();

  // Define API_BASE_URL based on environment variable
  // It should be http://localhost:8000 for local development
  const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCoverArtFile(e.target.files[0]);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      if (e.dataTransfer.files[0].type.startsWith('audio/')) {
        setFile(e.dataTransfer.files[0]);
      } else {
        setMessage('Please drop an audio file (e.g., MP3, WAV).');
      }
    }
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setIsLoading(true);

    if (!file) {
      setMessage('Please select an audio file to upload.');
      setIsLoading(false);
      return;
    }

    if (!isAuthenticated || !isLecturer || !token) {
      setMessage('You must be logged in as a lecturer or admin to upload podcasts.');
      setIsLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('audio_file', file);
    if (description) {
      formData.append('description', description);
    }
    if (coverArtFile) {
      formData.append('cover_art', coverArtFile);
    }
    if (author) {
      formData.append('author', author);
    }
    if (durationMinutes !== '') {
      formData.append('duration_minutes', String(durationMinutes));
    }

    try {
      // Use API_BASE_URL and explicitly add /api/podcasts
      const response = await fetch(`${API_BASE_URL}/api/podcasts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data: Podcast = await response.json();
        setUploadedPodcastData(data);
        setMessage(`Podcast "${data.title}" uploaded successfully!`);
        setFile(null);
        setTitle('');
        setDescription('');
        setCoverArtFile(null);
        setAuthor('');
        setDurationMinutes('');
        setTimeout(() => navigate('/podcasts'), 2000);
      } else {
        const errorData = await response.json();
        setMessage(`Upload failed: ${errorData.detail || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessage('An error occurred during upload. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [file, title, description, coverArtFile, author, durationMinutes, isAuthenticated, isLecturer, token, navigate, API_BASE_URL]); // Added API_BASE_URL to dependencies

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p className="text-xl">Loading authentication status...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isLecturer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <h1 className="text-4xl font-extrabold text-red-600 dark:text-red-400 mb-4 text-center">Access Denied</h1>
        <p className="text-xl text-center max-w-2xl">
          You do not have the necessary privileges to upload podcasts.
        </p>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
          Only users with 'lecturer' or 'admin' roles can upload content.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
      <h1 className="text-4xl font-extrabold text-crawfordBlue dark:text-crawfordGold mb-8 text-center">
        Upload New Podcast
      </h1>

      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Message Display */}
          {message && (
            <div className={`p-3 rounded-md text-sm ${message.includes('successfully') ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
              {message}
            </div>
          )}

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Podcast Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-crawfordBlue"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-crawfordBlue"
            ></textarea>
          </div>

          {/* NEW: Author */}
          <div>
            <label htmlFor="author" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Author (Optional)</label>
            <input
              type="text"
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-crawfordBlue"
            />
          </div>

          {/* NEW: Duration in Minutes */}
          <div>
            <label htmlFor="duration" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Duration (Minutes, Optional)</label>
            <input
              type="number"
              id="duration"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value === '' ? '' : String(parseInt(e.target.value)))} // Ensure it's a string for state
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-crawfordBlue"
              min="0"
            />
          </div>

          {/* Audio File Input with Drag and Drop */}
          <div>
            <label htmlFor="audio-file" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Audio File (MP3, WAV, etc.)</label>
            <div
              className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer
                          ${isDragging ? 'border-crawfordBlue bg-gray-200 dark:bg-gray-600' : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700'}`}
              onDragEnter={handleDragEnter}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className="space-y-1 text-center">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L40 32"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <label
                    htmlFor="audio-file-input"
                    className="relative cursor-pointer rounded-md font-medium text-crawfordBlue hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-crawfordBlue"
                  >
                    <span>Upload a file</span>
                    <input
                      id="audio-file-input"
                      name="audio-file"
                      type="file"
                      className="sr-only"
                      onChange={handleFileChange}
                      accept="audio/*"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">MP3, WAV, OGG up to 50MB</p>
              </div>
            </div>
            {file && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Selected audio: <span className="font-bold">{file.name}</span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="ml-4 text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </p>
            )}
          </div>

          {/* Cover Art Input */}
          <div>
            <label htmlFor="cover-art" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Cover Art (Optional)</label>
            <input
              type="file"
              id="cover-art"
              name="cover-art"
              onChange={handleCoverArtChange}
              className="w-full text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-md p-3 border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-crawfordBlue"
              accept="image/*"
            />
             {coverArtFile && (
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Selected image: <span className="font-bold">{coverArtFile.name}</span>
                <button
                  type="button"
                  onClick={() => setCoverArtFile(null)}
                  className="ml-4 text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-crawfordBlue text-white p-3 rounded-md font-semibold text-lg
                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75
                       transition duration-200 ease-in-out transform hover:scale-105"
            disabled={isLoading}
          >
            {isLoading ? 'Uploading...' : 'Upload Podcast'}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
