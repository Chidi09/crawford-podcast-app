// frontend/src/components/PodcastPlayer.tsx

import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { Podcast } from '../types';
import { motion } from 'framer-motion';
import {
  FaPlay,
  FaPause,
  FaVolumeUp,
  FaVolumeMute,
} from 'react-icons/fa';
import { MdSkipPrevious, MdSkipNext } from 'react-icons/md';
import { useAuth } from '../context/AuthContext';

interface PodcastPlayerProps {
  podcast: Podcast;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function PodcastPlayer({ podcast, onNext, onPrevious }: PodcastPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const [userInteracted, setUserInteracted] = useState(false);

  const { token, isAuthenticated } = useAuth();
  // Define API_BASE_URL based on environment variable
  const API_BASE_URL = import.meta.env.VITE_APP_API_BASE_URL || 'http://localhost:8000';

  const handleLoadedData = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
      console.log('PodcastPlayer: Loaded data. Duration:', audioRef.current.duration);
    }
  }, []);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isSeeking) {
      setCurrentTime(audioRef.current.currentTime);
      setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100);
    }
  }, [isSeeking]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    console.log('PodcastPlayer: Playback ended.');
    if (onNext) {
      console.log('PodcastPlayer: Calling onNext due to playback end.');
      onNext();
    }
  }, [onNext]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
      setIsMuted(newVolume === 0);
      console.log('PodcastPlayer: Volume changed to:', newVolume);
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.muted = !audioRef.current.muted;
      setIsMuted(audioRef.current.muted);
      console.log('PodcastPlayer: Mute toggled. Muted:', audioRef.current.muted);
    }
  }, []);

  const handleProgressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    if (audioRef.current) {
      audioRef.current.currentTime = (newProgress / 100) * audioRef.current.duration;
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleSeekStart = useCallback(() => {
    setIsSeeking(true);
    console.log('PodcastPlayer: Seeking started.');
  }, []);

  const handleSeekEnd = useCallback(() => {
    setIsSeeking(false);
    console.log('PodcastPlayer: Seeking ended.');
  }, []);

  const togglePlayPause = useCallback(async () => {
    if (audioRef.current) {
      setUserInteracted(true);
      if (isPlaying) {
        audioRef.current.pause();
        console.log('PodcastPlayer: Paused.');
      } else {
        try {
          await audioRef.current.play();
          console.log('PodcastPlayer: Playing.');
          if (isAuthenticated && token && podcast.id) {
            console.log(`PodcastPlayer: Attempting to increment play count for podcast ID: ${podcast.id}`);
            // Use API_BASE_URL and explicitly add /api/podcasts
            const response = await fetch(`${API_BASE_URL}/api/podcasts/${podcast.id}/play`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            });
            if (!response.ok) {
              const errorData = await response.json();
              console.error('PodcastPlayer: Failed to increment play count:', errorData.detail || response.statusText);
            } else {
              console.log('PodcastPlayer: Play count incremented successfully.');
            }
          }
        } catch (error) {
          console.error('PodcastPlayer: Error playing audio or incrementing play count:', error);
          if (error instanceof DOMException && error.name === "NotAllowedError") {
            console.warn("Autoplay was prevented. User interaction required to play audio.");
          }
        }
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, isAuthenticated, token, podcast.id, API_BASE_URL]);

  const playNext = useCallback(() => {
    console.log('PodcastPlayer: Next button clicked.');
    if (onNext) {
      setIsPlaying(false);
      onNext();
    }
  }, [onNext]);

  const playPrevious = useCallback(() => {
    console.log('PodcastPlayer: Previous button clicked.');
    if (onPrevious) {
      setIsPlaying(false);
      onPrevious();
    }
  }, [onPrevious]);

  useEffect(() => {
    console.log('PodcastPlayer: Podcast prop changed. New podcast:', podcast.title);
    if (audioRef.current) {
      // Construct the full URL for the audio file
      const fullAudioUrl = podcast.audio_file_url.startsWith('http')
        ? podcast.audio_file_url
        : `${API_BASE_URL}${podcast.audio_file_url}`;

      audioRef.current.src = fullAudioUrl;
      audioRef.current.load();

      if (userInteracted) {
        audioRef.current.play()
          .then(() => {
            setIsPlaying(true);
            console.log('PodcastPlayer: Auto-playing new podcast after user interaction.');
            if (isAuthenticated && token && podcast.id) {
              console.log(`PodcastPlayer: Attempting to increment play count for new podcast ID: ${podcast.id}`);
              fetch(`${API_BASE_URL}/api/podcasts/${podcast.id}/play`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                },
              })
              .then(response => {
                if (!response.ok) {
                  return response.json().then(errorData => { throw new Error(errorData.detail || response.statusText); });
                }
                console.log('PodcastPlayer: Play count incremented for new podcast.');
              })
              .catch(error => console.error('PodcastPlayer: Failed to increment play count for new podcast:', error));
            }
          })
          .catch(error => {
            setIsPlaying(false);
            console.error('PodcastPlayer: Autoplay failed for new podcast:', error);
          });
      } else {
        setIsPlaying(false);
      }
      setVolume(audioRef.current.volume);
      setIsMuted(audioRef.current.muted);
    }
  }, [podcast, userInteracted, isAuthenticated, token, API_BASE_URL]);

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('ended', handleEnded);

      return () => {
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
        audio.removeEventListener('ended', handleEnded);
      };
    }
  }, [handleLoadedData, handleTimeUpdate, handleEnded]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 14 }}
      className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 shadow-lg z-50 flex flex-col md:flex-row items-center justify-between rounded-t-lg"
    >
      <audio ref={audioRef} />

      <div className="flex items-center flex-grow mb-3 md:mb-0 md:mr-4 w-full md:w-1/3">
        <img
          src={podcast.cover_art_url || '/images/default-podcast-cover.jpeg'}
          alt={podcast.title}
          className="w-16 h-16 object-cover rounded-md mr-4 shadow-md"
        />
        <div className="flex flex-col overflow-hidden">
          <h3 className="text-lg font-semibold truncate">{podcast.title}</h3>
          <p className="text-sm text-gray-400 truncate">{podcast.author || 'Unknown Artist'}</p>
        </div>
      </div>

      <div className="flex flex-col items-center flex-grow w-full md:w-1/3 px-4">
        <div className="flex items-center space-x-4 mb-2">
          {onPrevious && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              onClick={playPrevious}
              className="text-2xl text-gray-300 hover:text-white transition-colors duration-200"
              aria-label="Play previous podcast"
            >
              <MdSkipPrevious />
            </motion.button>
          )}
          <motion.button
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.1 }}
            onClick={togglePlayPause}
            className="text-4xl text-crawfordGold hover:text-yellow-500 transition-colors duration-200"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <FaPause /> : <FaPlay />}
          </motion.button>
          {onNext && (
            <motion.button
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.1 }}
              onClick={playNext}
              className="text-2xl text-gray-300 hover:text-white transition-colors duration-200"
              aria-label="Play next podcast"
            >
              <MdSkipNext />
            </motion.button>
          )}
        </div>
        <div className="flex items-center w-full">
          <span className="text-xs text-gray-400 min-w-[35px] text-right mr-2">{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleProgressChange}
            onMouseDown={handleSeekStart}
            onMouseUp={handleSeekEnd}
            onTouchStart={handleSeekStart}
            onTouchEnd={handleSeekEnd}
            className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-crawfordGold-500
                       [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-crawfordGold
                       [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-125 focus:[&::-webkit-slider-thumb]:outline-none transition-all duration-150"
          />
          <span className="text-xs text-gray-400 min-w-[35px] text-left ml-2">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="flex items-center space-x-3 flex-shrink-0 md:w-1/3 justify-end mt-2 md:mt-0">
        <motion.button
          whileTap={{ scale: 0.9 }}
          whileHover={{ scale: 1.1 }}
          onClick={toggleMute}
          className="text-lg md:text-xl text-gray-300 hover:text-white transition-colors duration-200"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          {isMuted || volume === 0 ? <FaVolumeMute /> : <FaVolumeUp />}
        </motion.button>
        <input
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-crawfordGold-500 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-crawfordGold [&::-webkit-slider-thumb]:shadow-lg hover:[&::-webkit-slider-thumb]:scale-125 focus:[&::-webkit-slider-thumb]:outline-none transition-all duration-150"
        />
      </div>
    </motion.div>
  );
}
