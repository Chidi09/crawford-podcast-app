// frontend/src/components/PodcastList.tsx

import React, { useEffect, useState } from 'react';
import type { Podcast } from '../types';
import PodcastCard from './PodcastCard';
import { useAuth } from '../context/AuthContext';

interface PodcastListProps {
  onSelectPodcast: (podcast: Podcast) => void;
  onPodcastsFetched?: (podcasts: Podcast[]) => void;
}

export default function PodcastList({ onSelectPodcast, onPodcastsFetched }: PodcastListProps) {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, token } = useAuth();

  // Define API_BASE_URL based on environment variable
  const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000';

  useEffect(() => {
    const fetchPodcasts = async () => {
      if (!isAuthenticated || !token) {
        setError('Please log in to view podcasts.');
        setLoading(false);
        return;
      }
      try {
        // Use the API_BASE_URL for the fetch request, explicitly adding /api/podcasts
        const response = await fetch(`${API_BASE_URL}/api/podcasts/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
        }
        const data: Podcast[] = await response.json();
        setPodcasts(data);
        console.log('PodcastList: Fetched podcasts:', data);
        if (onPodcastsFetched) {
          onPodcastsFetched(data);
        }
      } catch (e) {
        if (e instanceof Error) {
          setError(e.message);
        } else {
          setError('An unknown error occurred.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPodcasts();
  }, [onPodcastsFetched, isAuthenticated, token, API_BASE_URL]);

  const handlePodcastSelect = (podcast: Podcast) => {
    // Ensure the audio_file_url is a full URL before passing to player
    // It should now be constructed using API_BASE_URL and the /uploads prefix
    const podcastWithFullUrl: Podcast = {
      ...podcast,
      audio_file_url: podcast.audio_file_url.startsWith('http')
        ? podcast.audio_file_url
        : `${API_BASE_URL}${podcast.audio_file_url}`,
      cover_art_url: podcast.cover_art_url && !podcast.cover_art_url.startsWith('http')
        ? `${API_BASE_URL}${podcast.cover_art_url}`
        : podcast.cover_art_url,
    };

    console.log(
      'PodcastList: Attempting to select podcast:',
      podcastWithFullUrl.title,
      'with URL:',
      podcastWithFullUrl.audio_file_url
    );

    onSelectPodcast(podcastWithFullUrl);
  };

  if (loading) {
    return <div className="text-center text-lg text-gray-600 dark:text-gray-300">Loading podcasts...</div>;
  }

  if (error) {
    return <div className="text-center text-lg text-red-600 dark:text-red-400">Error: {error}</div>;
  }

  if (podcasts.length === 0) {
    return <div className="text-center text-lg text-gray-600 dark:text-gray-300">No podcasts found. Start uploading!</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6 text-center">Explore Our Podcasts</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {podcasts.map((podcast) => (
          <PodcastCard
            key={podcast.id}
            podcast={podcast}
            onPlay={() => handlePodcastSelect(podcast)}
          />
        ))}
      </div>
    </div>
  );
}
