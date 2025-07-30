// frontend/src/pages/LiveStream.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import type { LiveStream, User } from '../types';
import { FaPlayCircle, FaUsers, FaEye } from 'react-icons/fa';

export default function LiveStream() {
  const { isAuthenticated, token, user, isLecturer } = useAuth();
  const [activeStreams, setActiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [selectedStream, setSelectedStream] = useState<LiveStream | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);

  // Define API_BASE_URL based on environment variable
  const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000';

  const fetchActiveStreams = useCallback(async () => {
    if (!isAuthenticated || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Use the API_BASE_URL for the fetch request, explicitly adding /api/live
      const response = await fetch(`${API_BASE_URL}/api/live/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to fetch live streams.');
      }
      const data: LiveStream[] = await response.json();
      setActiveStreams(data);
      console.log("LiveStream: Fetched active streams:", data);

      if (user && user.id) {
        const userHostedStream = data.find(stream => stream.host_id === user.id && stream.status === 'live');
        setIsStreaming(!!userHostedStream);
        if (userHostedStream) {
          setSelectedStream(userHostedStream);
        }
      }

    } catch (err) {
      console.error('Error fetching live streams:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching live streams.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, user, API_BASE_URL]);

  useEffect(() => {
    fetchActiveStreams();
    const interval = setInterval(fetchActiveStreams, 15000);
    return () => clearInterval(interval);
  }, [fetchActiveStreams]);

  const handleJoinStream = useCallback(async (stream: LiveStream) => {
    if (!isAuthenticated || !token) {
      setMessage('Please log in to join a stream.');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      // Use API_BASE_URL and explicitly add /api/live
      const response = await fetch(`${API_BASE_URL}/api/live/${stream.id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to join stream.');
      }
      setMessage(`Joined "${stream.title}"!`);
      setSelectedStream(stream);
      fetchActiveStreams();
    } catch (err) {
      console.error('Error joining stream:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while joining stream.');
      }
    }
  }, [isAuthenticated, token, fetchActiveStreams, API_BASE_URL]);

  const handleLeaveStream = useCallback(async (streamId: number) => {
    if (!isAuthenticated || !token) {
      setMessage('You must be logged in to leave a stream.');
      return;
    }
    setError(null);
    setMessage(null);
    try {
      // Use API_BASE_URL and explicitly add /api/live
      const response = await fetch(`${API_BASE_URL}/api/live/${streamId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to leave stream.');
      }
      setMessage('Left stream.');
      setSelectedStream(null);
      fetchActiveStreams();
    } catch (err) {
      console.error('Error leaving stream:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while leaving stream.');
      }
    }
  }, [isAuthenticated, token, fetchActiveStreams, API_BASE_URL]);

  const handleStartStream = useCallback(async () => {
    if (!isAuthenticated || !isLecturer || !token || !user) {
      setError('You must be a lecturer or admin to start a stream.');
      return;
    }
    setError(null);
    setMessage(null);
    const streamTitle = prompt("Enter stream title:");
    if (!streamTitle) {
      setMessage("Stream creation cancelled.");
      return;
    }
    const streamDescription = prompt("Enter stream description (optional):");
    const streamUrl = prompt("Enter stream URL (e.g., YouTube Live embed URL):");
    if (!streamUrl) {
      setMessage("Stream URL is required.");
      return;
    }

    try {
      // Use API_BASE_URL and explicitly add /api/live
      const response = await fetch(`${API_BASE_URL}/api/live/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: streamTitle,
          description: streamDescription,
          stream_url: streamUrl,
          status: "live"
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to start stream.');
      }
      const newStream: LiveStream = await response.json();
      setMessage(`Live stream "${newStream.title}" started successfully!`);
      setIsStreaming(true);
      setSelectedStream(newStream);
      fetchActiveStreams();
    } catch (err) {
      console.error('Error starting stream:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while starting stream.');
      }
    }
  }, [isAuthenticated, isLecturer, token, user, fetchActiveStreams, API_BASE_URL]);

  const handleStopStream = useCallback(async () => {
    if (!isAuthenticated || !isLecturer || !token || !selectedStream) {
      setError('You must be a lecturer/admin and have an active stream selected to stop it.');
      return;
    }
    if (!window.confirm(`Are you sure you want to stop the stream "${selectedStream.title}"?`)) {
      return;
    }
    setError(null);
    setMessage(null);
    try {
      // Use API_BASE_URL and explicitly add /api/live
      const response = await fetch(`${API_BASE_URL}/api/live/${selectedStream.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: "offline" })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to stop stream.');
      }
      setMessage(`Live stream "${selectedStream.title}" stopped.`);
      setIsStreaming(false);
      setSelectedStream(null);
      fetchActiveStreams();
    } catch (err) {
      console.error('Error stopping stream:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while stopping stream.');
      }
    }
  }, [isAuthenticated, isLecturer, token, selectedStream, fetchActiveStreams, API_BASE_URL]);


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p className="text-xl">Loading live streams...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <h1 className="text-4xl font-extrabold text-crawfordBlue dark:text-crawfordGold mb-4 text-center">Live Stream</h1>
        <p className="text-xl text-center max-w-2xl">
          Please log in to view and interact with live streams.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100"
    >
      <h1 className="text-4xl font-extrabold text-crawfordBlue dark:text-crawfordGold mb-6 text-center">
        Live Stream
      </h1>
      <p className="text-xl text-center max-w-2xl mb-8">
        Welcome to the live streaming section!
        <br />
        Watch active streams or start your own.
      </p>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-100 dark:bg-green-800 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-200 px-4 py-3 rounded relative mb-4 w-full max-w-4xl"
          role="alert"
        >
          <span className="block sm:inline">{message}</span>
        </motion.div>
      )}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-100 dark:bg-red-800 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-200 px-4 py-3 rounded relative mb-4 w-full max-w-4xl"
          role="alert"
        >
          <span className="block sm:inline">{error}</span>
        </motion.div>
      )}

      {/* Lecturer/Admin Controls: Start/Stop Stream */}
      {isLecturer && (
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8 flex flex-col items-center">
          <h2 className="text-2xl font-bold text-crawfordBlue dark:text-crawfordGold mb-4">Your Live Stream</h2>
          {isStreaming && selectedStream && user && selectedStream.host_id === user.id ? (
            <div className="text-center">
              <p className="text-lg text-gray-700 dark:text-gray-300 mb-2">
                You are currently streaming: <span className="font-semibold">{selectedStream.title}</span>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Viewers: {selectedStream.current_viewers} | Total Views: {selectedStream.total_views}
              </p>
              <button
                onClick={handleStopStream}
                className="btn-danger py-2 px-6"
              >
                Stop Stream
              </button>
            </div>
          ) : (
            <button
              onClick={handleStartStream}
              className="btn-primary py-2 px-6"
            >
              Start New Stream
            </button>
          )}
        </div>
      )}

      {/* Live Stream Video Player Section */}
      {selectedStream && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-4xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mb-8"
        >
          <h2 className="text-2xl font-bold text-crawfordBlue dark:text-crawfordGold mb-4">
            Now Watching: {selectedStream.title}
          </h2>
          {selectedStream.stream_url ? (
            <div className="relative" style={{ paddingBottom: '56.25%', height: 0 }}>
              <iframe
                src={selectedStream.stream_url.startsWith('http') ? selectedStream.stream_url : `${API_BASE_URL}${selectedStream.stream_url}`}
                title={selectedStream.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full rounded-md"
              ></iframe>
            </div>
          ) : (
            <div className="bg-gray-200 dark:bg-gray-700 h-64 flex items-center justify-center rounded-md">
              <p className="text-gray-500 dark:text-gray-400">No stream URL available.</p>
            </div>
          )}
          <div className="mt-4 text-gray-700 dark:text-gray-300">
            <p className="mb-2">{selectedStream.description || 'No description provided.'}</p>
            <div className="flex items-center text-sm">
              <FaUsers className="mr-2 text-crawfordGold" /> Current Viewers: {selectedStream.current_viewers}
              <FaEye className="ml-4 mr-2 text-crawfordGold" /> Total Views: {selectedStream.total_views}
            </div>
            {user && selectedStream.host_id !== user.id && (
              <button
                onClick={() => handleLeaveStream(selectedStream.id)}
                className="btn-secondary mt-4"
              >
                Leave Stream
              </button>
            )}
          </div>
        </motion.div>
      )}

      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-crawfordBlue dark:text-crawfordGold mb-4">Active Streams</h2>
        {activeStreams.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeStreams.map((stream) => (
              <motion.div
                key={stream.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-gray-100 dark:bg-gray-700 p-4 rounded-md shadow flex items-center justify-between"
              >
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{stream.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Status: <span className={`font-medium ${
                      stream.status === 'live' ? 'text-green-600' :
                      stream.status === 'scheduled' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>{stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}</span>
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Viewers: {stream.current_viewers} / Total: {stream.total_views}
                  </p>
                </div>
                {selectedStream?.id === stream.id ? (
                  <button
                    onClick={() => handleLeaveStream(stream.id)}
                    className="btn-secondary text-sm"
                  >
                    Leave
                  </button>
                ) : (
                  <button
                    onClick={() => handleJoinStream(stream)}
                    className="btn-primary text-sm"
                    disabled={stream.status !== 'live'}
                  >
                    {stream.status === 'live' ? 'Join Stream' : 'Not Live'}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No active streams at the moment.</p>
        )}
      </div>

      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md mt-8">
        <h2 className="text-2xl font-bold text-crawfordBlue dark:text-crawfordGold mb-4">Live Chat</h2>
        <div className="h-48 bg-gray-100 dark:bg-gray-700 rounded-md p-4 overflow-y-auto mb-4">
          <p className="text-gray-800 dark:text-gray-200 mb-1">
            <span className="font-semibold text-blue-600">User123:</span> Great session!
          </p>
          <p className="text-gray-800 dark:text-gray-200 mb-1">
            <span className="font-semibold text-green-600">ModBot:</span> Welcome everyone!
          </p>
          <p className="text-gray-800 dark:text-gray-200 mb-1">
            <span className="font-semibold text-purple-600">ViewerPro:</span> Can you discuss AI ethics next week?
          </p>
        </div>
        <input
          type="text"
          placeholder="Type your message..."
          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md
                     focus:outline-none focus:ring-2 focus:ring-crawfordBlue dark:bg-gray-700 dark:text-white"
        />
      </div>
    </motion.div>
  );
}
