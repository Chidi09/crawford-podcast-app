// frontend/src/pages/AdminPanel.tsx

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import UserManagement from '../components/Admin/UserManagement';
import ContentModeration from '../components/Admin/ContentModeration';
import { useAuth } from '../context/AuthContext'; // Import useAuth

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<'users' | 'content'>('users');
  const { loading, isAdmin } = useAuth(); // Get isAdmin status

  const tabClasses = (tabName: 'users' | 'content') =>
    `px-4 py-2 text-sm font-medium rounded-t-lg transition-colors duration-200 ` +
    (activeTab === tabName
      ? 'bg-crawfordBlue text-white shadow-md'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600');

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <p className="text-xl">Loading admin panel...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <h1 className="text-4xl font-extrabold text-red-600 dark:text-red-400 mb-4 text-center">Access Denied</h1>
        <p className="text-xl text-center max-w-2xl">
          You do not have the necessary administrative privileges to access this page.
        </p>
        <p className="mt-4 text-lg text-gray-700 dark:text-gray-300">
          Please log in with an administrator account.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center min-h-screen-content py-12 px-4 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-full"
    >
      <h1 className="text-4xl font-extrabold text-crawfordBlue dark:text-crawfordGold mb-8 text-center">
        Admin Panel
      </h1>

      <div className="w-full max-w-6xl bg-white dark:bg-gray-800 shadow-xl rounded-lg p-6">
        {/* Tab Navigation */}
        <div className="flex justify-center border-b border-gray-200 dark:border-gray-700 mb-6">
          <button
            className={tabClasses('users')}
            onClick={() => setActiveTab('users')}
          >
            User Management
          </button>
          <button
            className={tabClasses('content')}
            onClick={() => setActiveTab('content')}
          >
            Content Moderation
          </button>
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'users' && <UserManagement />}
          {activeTab === 'content' && <ContentModeration />}
        </div>
      </div>
    </motion.div>
  );
}
