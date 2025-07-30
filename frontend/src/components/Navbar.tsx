// frontend/src/components/Navbar.tsx

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { isAuthenticated, logout, user, isLecturer, isAdmin } = useAuth(); // Destructure isLecturer and isAdmin

  return (
    <nav className="bg-crawfordBlue dark:bg-gray-800 p-4 shadow-md fixed top-0 left-0 w-full z-10">
      <div className="container mx-auto flex justify-between items-center">
        <NavLink
          to="/"
          className="text-white text-2xl font-bold hover:text-crawfordGold transition-colors duration-300"
        >
          Crawford Podcast
        </NavLink>

        <div className="flex space-x-6 items-center">
          {isAuthenticated && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  `text-white text-lg font-medium hover:text-crawfordGold transition-colors duration-300 ${
                    isActive ? 'text-crawfordGold' : ''
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/podcasts"
                className={({ isActive }) =>
                  `text-white text-lg font-medium hover:text-crawfordGold transition-colors duration-300 ${
                    isActive ? 'text-crawfordGold' : ''
                  }`
                }
              >
                Podcasts
              </NavLink>
              {isLecturer && ( // Show Upload Podcast link only if user is a lecturer or admin
                <NavLink
                  to="/upload"
                  className={({ isActive }) =>
                    `text-white text-lg font-medium hover:text-crawfordGold transition-colors duration-300 ${
                      isActive ? 'text-crawfordGold' : ''
                    }`
                  }
                >
                  Upload
                </NavLink>
              )}
              {isAdmin && ( // Show Admin link only if user is an admin
                <NavLink
                  to="/admin"
                  className={({ isActive }) =>
                    `text-white text-lg font-medium hover:text-crawfordGold transition-colors duration-300 ${
                      isActive ? 'text-crawfordGold' : ''
                    }`
                  }
                >
                  Admin
                </NavLink>
              )}
            </>
          )}

          {isAuthenticated ? (
            <>
              <span className="text-crawfordGold text-lg font-medium">
                Hello, {user?.username || 'User'}!
              </span>
              <button
                onClick={logout}
                className="text-white text-lg font-medium hover:text-crawfordGold transition-colors duration-300"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  `text-white text-lg font-medium hover:text-crawfordGold transition-colors duration-300 ${
                    isActive ? 'text-crawfordGold' : ''
                  }`
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) =>
                  `text-white text-lg font-medium hover:text-crawfordGold transition-colors duration-300 ${
                    isActive ? 'text-crawfordGold' : ''
                  }`
                }
              >
                Register
              </NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
