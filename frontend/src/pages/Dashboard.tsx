// frontend/src/pages/Dashboard.tsx

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const [backendStatus, setBackendStatus] = useState<string>("Fetching backend status...");
  const [dbStatus, setDbStatus] = useState<string>("Checking database...");

  useEffect(() => {
    const fetchBackendStatus = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/health'); // Corrected endpoint
        if (response.ok) {
          const data = await response.json();
          setBackendStatus(data.status === "healthy" ? "Online" : "Degraded");
          setDbStatus(data.database === "connected" ? "Connected" : "Disconnected");
        } else {
          setBackendStatus(`Error: ${response.status}`);
          setDbStatus("Unknown");
        }
      } catch (error) {
        console.error("Error fetching backend status:", error);
        setBackendStatus("Offline");
        setDbStatus("Unknown");
      }
    };

    fetchBackendStatus();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="container mx-auto p-8 pt-24 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center"
    >
      <h1 className="text-5xl font-extrabold text-crawfordBlue dark:text-crawfordGold mb-6 text-center">
        Welcome to the Crawford Podcast System!
      </h1>
      <p className="text-lg text-gray-700 dark:text-gray-300 mb-10 text-center max-w-2xl">
        Your central hub for all things Crawford Podcasts. From live streams to archived episodes, it's all here.
      </p>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-3xl mb-10">
        <div className={`p-6 rounded-lg shadow-lg text-center ${
          backendStatus === "Online" 
            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" 
            : backendStatus === "Degraded" 
              ? "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
              : "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
        }`}>
          <p className="text-lg font-semibold">Backend Status</p>
          <p className="text-2xl font-bold mt-2">{backendStatus}</p>
        </div>
        
        <div className={`p-6 rounded-lg shadow-lg text-center ${
          dbStatus === "Connected" 
            ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200" 
            : dbStatus === "Disconnected"
              ? "bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200"
              : "bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200"
        }`}>
          <p className="text-lg font-semibold">Database Status</p>
          <p className="text-2xl font-bold mt-2">{dbStatus}</p>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-3xl">
        {/* Go Live Card */}
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: "0 15px 25px rgba(0,0,0,0.15)" }}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl flex flex-col items-center text-center"
        >
          <h2 className="text-3xl font-bold text-crawfordBlue dark:text-crawfordGold mb-4">Go Live!</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Join our live sessions and interact in real-time.
          </p>
          <Link to="/live" className="btn-primary">
            Watch Live
          </Link>
        </motion.div>

        {/* Dive Into Podcasts Card */}
        <motion.div
          whileHover={{ scale: 1.02, boxShadow: "0 15px 25px rgba(0,0,0,0.15)" }}
          className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl flex flex-col items-center text-center"
        >
          <h2 className="text-3xl font-bold text-crawfordBlue dark:text-crawfordGold mb-4">Dive Into Podcasts</h2>
          <p className="text-gray-700 dark:text-gray-300 mb-6">
            Explore our extensive library of past episodes.
          </p>
          <Link to="/podcasts" className="btn-primary">
            Browse Podcasts
          </Link>
        </motion.div>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-3xl font-bold text-crawfordBlue dark:text-crawfordGold mb-4">Recent Activity</h2>
        <p className="text-gray-600 dark:text-gray-400">No recent activity to show yet. Start exploring!</p>
      </div>
    </motion.div>
  );
}