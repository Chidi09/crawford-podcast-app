// frontend/src/components/PodcastCard.tsx

import React from 'react';
import type { Podcast } from '../types'; // MODIFIED: Import Podcast type from central types file

interface PodcastCardProps {
  podcast: Podcast;
  onPlay: (podcast: Podcast) => void;
}

export default function PodcastCard({ podcast, onPlay }: PodcastCardProps) {
  // Function to handle playing the podcast
  const handlePlayClick = () => {
    onPlay(podcast); // Pass the entire podcast object to the onPlay handler
  };

  // Helper function to get the full URL for audio/cover art
  // This assumes your backend serves static files from a path like /uploads/audio_files/
  // and that the `audio_file_url` and `cover_art_url` in the podcast object
  // are relative paths from the backend's root (e.g., './backend/uploads/audio.mp3')
  const getFullUrl = (relativePath: string | null | undefined): string => {
    if (!relativePath) {
      // Return a placeholder or empty string if no relative path is provided
      // For images, you might want a default image URL here.
      return '';
    }
    // Remove the './backend' prefix if it exists, then prepend the base URL
    const cleanedPath = relativePath.replace('./backend', '');
    return `http://localhost:8000${cleanedPath}`;
  };

  const coverArtSrc = getFullUrl(podcast.cover_art_url) || '/images/default-podcast-cover.jpeg'; // Fallback to a default image

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden
                 transform transition-transform duration-200 hover:scale-105 cursor-pointer
                 flex flex-col h-full" // Ensure card takes full height of grid cell
      onClick={handlePlayClick} // Make the entire card clickable
    >
      <img
        src={coverArtSrc}
        alt={podcast.title}
        className="w-full h-48 object-cover" // Fixed height for consistency
        onError={(e) => {
          // Fallback for broken image links
          e.currentTarget.src = '/images/default-podcast-cover.jpeg';
          e.currentTarget.onerror = null; // Prevent infinite loop
        }}
      />
      <div className="p-4 flex-grow flex flex-col">
        <h3 className="text-xl font-semibold text-crawfordBlue dark:text-crawfordGold mb-2 line-clamp-2">
          {podcast.title}
        </h3>
        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
          By: {podcast.author || 'Unknown Author'}
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3 flex-grow">
          {podcast.description || 'No description available.'}
        </p>
        <div className="mt-4 flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>
            {podcast.duration_minutes ? `${podcast.duration_minutes} min` : 'N/A'}
          </span>
          <span>
            {podcast.uploaded_at ? new Date(podcast.uploaded_at).toLocaleDateString() : 'N/A'}
          </span>
        </div>
      </div>
    </div>
  );
}
