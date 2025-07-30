// frontend/src/components/Admin/ContentModeration.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Podcast, LiveStream } from '../../types'; // Import Podcast and LiveStream types
import { motion } from 'framer-motion';

export default function ContentModeration() {
  const { isAuthenticated, isAdmin, token } = useAuth();
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // Define API_BASE_URL based on environment variable
  const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000';

  const fetchContent = useCallback(async () => {
    if (!isAuthenticated || !isAdmin || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // Fetch Podcasts
      // Use API_BASE_URL and explicitly add /api/admin/podcasts
      const podcastsResponse = await fetch(`${API_BASE_URL}/api/admin/podcasts`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!podcastsResponse.ok) {
        const errorData = await podcastsResponse.json();
        throw new Error(errorData.detail || 'Failed to fetch podcasts.');
      }
      const podcastsData: Podcast[] = await podcastsResponse.json();
      setPodcasts(podcastsData);
      console.log("ContentModeration: Fetched podcasts:", podcastsData);

      // Fetch Live Streams
      // Use API_BASE_URL and explicitly add /api/admin/live-streams
      const liveStreamsResponse = await fetch(`${API_BASE_URL}/api/admin/live-streams`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!liveStreamsResponse.ok) {
        const errorData = await liveStreamsResponse.json();
        throw new Error(errorData.detail || 'Failed to fetch live streams.');
      }
      const liveStreamsData: LiveStream[] = await liveStreamsResponse.json();
      setLiveStreams(liveStreamsData);
      console.log("ContentModeration: Fetched live streams:", liveStreamsData);

    } catch (err) {
      console.error("Error fetching content:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching content.');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isAdmin, token, API_BASE_URL]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleDeletePodcast = async (podcastId: number, title: string) => {
    if (!isAuthenticated || !isAdmin || !token) {
      setMessage('You are not authorized to perform this action.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete podcast "${title}"? This action cannot be undone.`)) {
      return;
    }
    setMessage(null);
    try {
      // Use API_BASE_URL and explicitly add /api/admin/podcasts
      const response = await fetch(`${API_BASE_URL}/api/admin/podcasts/${podcastId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete podcast.');
      }
      setMessage(`Podcast "${title}" deleted successfully!`);
      fetchContent();
    } catch (err) {
      console.error("Error deleting podcast:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while deleting podcast.');
      }
    }
  };

  const handleUpdateLiveStreamStatus = async (streamId: number, currentTitle: string, newStatus: string) => {
    if (!isAuthenticated || !isAdmin || !token) {
      setMessage('You are not authorized to perform this action.');
      return;
    }
    setMessage(null);
    try {
      // Use API_BASE_URL and explicitly add /api/admin/live-streams
      const response = await fetch(`${API_BASE_URL}/api/admin/live-streams/${streamId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newStatus), // Send just the string
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update live stream status.');
      }
      setMessage(`Live stream "${currentTitle}" status updated to ${newStatus}!`);
      fetchContent();
    } catch (err) {
      console.error("Error updating live stream status:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while updating live stream status.');
      }
    }
  };


  const handleDeleteLiveStream = async (streamId: number, title: string) => {
    if (!isAuthenticated || !isAdmin || !token) {
      setMessage('You are not authorized to perform this action.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete live stream "${title}"? This action cannot be undone.`)) {
      return;
    }
    setMessage(null);
    try {
      // Use API_BASE_URL and explicitly add /api/admin/live-streams
      const response = await fetch(`${API_BASE_URL}/api/admin/live-streams/${streamId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete live stream.');
      }
      setMessage(`Live stream "${title}" deleted successfully!`);
      fetchContent();
    } catch (err) {
      console.error("Error deleting live stream:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while deleting live stream.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p className="text-xl">Loading content for moderation...</p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <h1 className="text-4xl font-extrabold text-red-600 dark:text-red-400 mb-4 text-center">Access Denied</h1>
        <p className="text-xl text-center max-w-2xl">
          You do not have administrative privileges to view this page.
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
        Content Moderation
      </h1>

      <div className="w-full max-w-4xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6 mb-8">
        {message && (
          <div className={`p-3 rounded-md text-sm mb-4 ${message.includes('successfully') ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
            {message}
          </div>
        )}
        {error && (
          <div className="p-3 rounded-md text-sm mb-4 bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
            {error}
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Podcasts</h2>
        {podcasts.length > 0 ? (
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Owner ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Views
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Plays
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {podcasts.map((podcast) => (
                  <tr key={podcast.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {podcast.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {podcast.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {podcast.owner_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {podcast.views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {podcast.plays}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeletePodcast(podcast.id, podcast.title)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No podcasts found.</p>
        )}

        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Live Streams</h2>
        {liveStreams.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Host ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Viewers
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {liveStreams.map((stream) => (
                  <tr key={stream.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {stream.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {stream.title}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {stream.host_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <select
                        value={stream.status}
                        onChange={(e) => handleUpdateLiveStreamStatus(stream.id, stream.title, e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-crawfordBlue focus:border-crawfordBlue sm:text-sm rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      >
                        <option value="offline">Offline</option>
                        <option value="scheduled">Scheduled</option>
                        <option value="live">Live</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {stream.current_viewers} / {stream.total_views}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteLiveStream(stream.id, stream.title)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-600 dark:text-gray-400">No live streams found.</p>
        )}
      </div>
    </motion.div>
  );
}
