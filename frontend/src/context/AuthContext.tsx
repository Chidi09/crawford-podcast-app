// frontend/src/context/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect, useCallback, type ReactNode } from 'react'; // ADDED useCallback
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // Import jwtDecode
import type { User } from '../types'; // Import the User interface from your types.ts

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null; // User object now includes role and is_admin
  isAdmin: boolean; // Derived from user.role
  isLecturer: boolean; // NEW: Derived from user.role
  loading: boolean;
  login: (accessToken: string) => void;
  token: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLecturer, setIsLecturer] = useState<boolean>(false); // NEW: State for lecturer role
  const [loading, setLoading] = useState<boolean>(true); // Start as true

  const navigate = useNavigate();

  // Function to decode token and set user/role states
  const decodeAndSetUser = useCallback((accessToken: string): User | null => {
    try {
      const decoded: any = jwtDecode(accessToken);
      console.log("AuthContext: Decoded JWT:", decoded);

      // Ensure role is a string and default to 'user' if not, for robust checking.
      const role = typeof decoded.role === 'string' ? decoded.role : 'user';

      // Map decoded payload to User interface, handling potential missing fields
      const decodedUser: User = {
        id: decoded.user_id || decoded.id, // Backend might use user_id or id
        username: decoded.sub || decoded.username || 'Guest',
        email: decoded.email || 'N/A',
        role: role,
        is_active: decoded.is_active === true, // Explicitly check for true
        is_admin: role === 'admin', // Derive from role for consistency
      };

      setUser(decodedUser);
      setIsAdmin(decodedUser.is_admin);
      setIsLecturer(decodedUser.role === 'lecturer' || decodedUser.is_admin); // Admin is also a lecturer for permissions
      return decodedUser;
    } catch (error) {
      console.error("AuthContext: Failed to decode token or invalid token:", error);
      return null;
    }
  }, []);

  // Effect to check for token on initial load
  useEffect(() => {
    console.log("AuthContext: useEffect (initial load) triggered.");
    const storedToken = localStorage.getItem('access_token');
    if (storedToken) {
      setToken(storedToken);
      const decodedUser = decodeAndSetUser(storedToken);
      if (decodedUser) {
        setIsAuthenticated(true);
      } else {
        // If decoding failed, ensure user is logged out
        logout();
      }
    }
    setLoading(false);
  }, [decodeAndSetUser]); // Depend on decodeAndSetUser

  const login = useCallback((accessToken: string) => {
    console.log("AuthContext: Login function called with new token.");
    localStorage.setItem('access_token', accessToken);
    setToken(accessToken);
    const decodedUser = decodeAndSetUser(accessToken);
    if (decodedUser) {
      setIsAuthenticated(true);
      // Navigate based on role, e.g., admin to admin panel, others to dashboard
      if (decodedUser.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      // Handle case where token is invalid right after login attempt
      logout();
    }
  }, [decodeAndSetUser, navigate]);

  const logout = useCallback(() => {
    console.log("AuthContext: Logout function called.");
    localStorage.removeItem('access_token');
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
    setIsAdmin(false);
    setIsLecturer(false); // Clear lecturer state on logout
    navigate('/login');
  }, [navigate]);

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, isAdmin, isLecturer, loading, login, logout, token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
