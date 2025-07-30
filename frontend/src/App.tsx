// frontend/src/App.tsx - FINAL MODIFIED

import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from "./components/Navbar";
import Login from './pages/Login';
import Register from './pages/Register';
import LiveStream from "./pages/LiveStream";
import Dashboard from "./pages/Dashboard";
import UploadPodcast from "./pages/UploadPodcast";
import AdminPanel from "./pages/AdminPanel";
import ProtectedRoute from './components/ProtectedRoute';
import PodcastPlayer from './components/PodcastPlayer';
import PodcastList from './components/PodcastList';
import type { Podcast } from './types/index';

function App() {
  const [selectedPodcast, setSelectedPodcast] = useState<Podcast | null>(null);
  const [currentPodcastList, setCurrentPodcastList] = useState<Podcast[]>([]);

  // Callback to receive the full list of podcasts from PodcastList
  const handlePodcastsFetched = useCallback((podcasts: Podcast[]) => {
    setCurrentPodcastList(podcasts);
    console.log("App: Received full podcast list from PodcastList.");
  }, []);

  const handleSelectPodcast = useCallback((podcast: Podcast) => {
    console.log(
      'App: Received selected podcast:',
      podcast.title,
      'with URL:',
      podcast.audio_file_url
    );
    setSelectedPodcast(podcast);
  }, []);

  const playNextPodcast = useCallback(() => {
    if (!selectedPodcast || currentPodcastList.length === 0) return;
    const currentIndex = currentPodcastList.findIndex(p => p.id === selectedPodcast.id);
    if (currentIndex === -1) {
      console.warn("App: Current podcast not found in list for 'next' operation.");
      return;
    }
    const nextIndex = (currentIndex + 1) % currentPodcastList.length;
    const nextPodcast = currentPodcastList[nextIndex];
    console.log("App: Playing next podcast:", nextPodcast.title);
    setSelectedPodcast(nextPodcast);
  }, [selectedPodcast, currentPodcastList]);

  const playPreviousPodcast = useCallback(() => {
    if (!selectedPodcast || currentPodcastList.length === 0) return;
    const currentIndex = currentPodcastList.findIndex(p => p.id === selectedPodcast.id);
    if (currentIndex === -1) {
      console.warn("App: Current podcast not found in list for 'previous' operation.");
      return;
    }
    const previousIndex = (currentIndex - 1 + currentPodcastList.length) % currentPodcastList.length;
    const previousPodcast = currentPodcastList[previousIndex];
    console.log("App: Playing previous podcast:", previousPodcast.title);
    setSelectedPodcast(previousPodcast);
  }, [selectedPodcast, currentPodcastList]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={
            <PodcastList
              onSelectPodcast={handleSelectPodcast}
              onPodcastsFetched={handlePodcastsFetched}
            />
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/live" element={<LiveStream />} />

          {/* PROTECTED FOR ANY LOGGED-IN USER */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/podcasts" element={
              <PodcastList
                onSelectPodcast={handleSelectPodcast}
                onPodcastsFetched={handlePodcastsFetched}
              />
            } />
          </Route>

          {/* PROTECTED FOR ADMIN USERS ONLY */}
          <Route element={<ProtectedRoute requiredAdmin={true} />}>
            <Route path="/upload" element={<UploadPodcast />} />
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          {/* Fallback for unmatched routes */}
          <Route path="*" element={<p className="text-center mt-20 text-gray-700 dark:text-gray-300">Page Not Found</p>} />
        </Routes>
      </main>

      {/* PodcastPlayer fixed at the bottom, only if a podcast is selected */}
      {selectedPodcast && (
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <PodcastPlayer
            podcast={selectedPodcast}
            onNext={currentPodcastList.length > 1 ? playNextPodcast : undefined}
            onPrevious={currentPodcastList.length > 1 ? playPreviousPodcast : undefined}
          />
        </div>
      )}
    </div>
  );
}

export default App;