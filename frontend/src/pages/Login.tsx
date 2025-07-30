// frontend/src/pages/Login.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState(''); // For success/general messages
  const [error, setError] = useState<string | null>(null); // For error messages
  const { login } = useAuth(); // Get the login function from context

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    try {
      const response = await fetch('http://localhost:8000/api/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username: username,
          password: password,
        }).toString(),
      });

      if (response.ok) {
        const data = await response.json();
        // AuthContext's login function now expects an object: { access_token: string; role: string }
        // MODIFIED: Pass data.role to the login function
        login(data.access_token); // ✅ Correct: only the access token
        setMessage('Login successful! Redirecting...'); // Optional: message before redirect
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Network error or server unavailable.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="container mx-auto p-8 pt-24 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center"
    > {/* Applied the className from the original file */}
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-crawfordBlue dark:text-crawfordGold mb-8">Login</h2> {/* Adjusted heading to match snippet style */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-crawfordBlue focus:border-crawfordBlue dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-crawfordBlue focus:border-crawfordBlue dark:bg-gray-700 dark:text-white"
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          {message && !error && <p className="text-green-500 text-sm text-center">{message}</p>}
          <button
            type="submit"
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-crawfordBlue bg-crawfordGold hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-crawfordBlue"
          >
            Login
          </button>
        </form>
        <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-crawfordBlue hover:text-blue-700 dark:text-crawfordGold dark:hover:text-yellow-400">
            Register here
          </Link>
        </p>
      </div>
    </motion.div>
  );
}