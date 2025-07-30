// frontend/src/pages/Register.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom'; // Import Link and useNavigate

export default function Register() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState(''); // Add email state
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Hook for navigation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch('http://localhost:8000/api/auth/register', { // Your registration endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json', // Registration typically uses JSON
        },
        body: JSON.stringify({ // Send as JSON
          username,
          email, // Include email
          password,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Registration successful for ${data.username}! You can now log in.`);
        // Optionally, redirect to login page after successful registration
        setTimeout(() => navigate('/login'), 2000); 
      } else {
        const errorData = await response.json();
        setMessage('Registration failed: ' + (errorData.detail || 'Unknown error'));
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage('Network error. Could not connect to backend.');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="container mx-auto p-8 pt-24 min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 flex flex-col items-center justify-center"
    >
      <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md">
        <h1 className="text-4xl font-extrabold text-crawfordBlue dark:text-crawfordGold mb-8 text-center">Register</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-crawfordGold focus:border-crawfordGold"
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <input
              type="email" // Use type="email" for better validation
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-crawfordGold focus:border-crawfordGold"
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
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-crawfordGold focus:border-crawfordGold"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full btn-primary py-3"
          >
            Register
          </button>
        </form>
        {message && (
          <p className={`mt-6 text-center text-lg ${message.startsWith('Registration successful') ? 'text-green-600' : 'text-red-600'} dark:text-gray-300`}>
            {message}
          </p>
        )}
        <p className="mt-4 text-center text-gray-700 dark:text-gray-300">
          Already have an account? <Link to="/login" className="text-crawfordBlue dark:text-crawfordGold hover:underline">Login here</Link>
        </p>
      </div>
    </motion.div>
  );
}