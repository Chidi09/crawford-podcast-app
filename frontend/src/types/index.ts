// frontend/src/types/index.ts

export interface User {
  id: number; // Changed from user_id to id to match backend User model
  username: string;
  email: string;
  role: 'user' | 'lecturer' | 'admin'; // Specific roles
  is_active: boolean; // Added from backend User model
  is_admin: boolean; // Added from backend User model
}

export interface Podcast {
  id: number;
  title: string;
  description: string;
  audio_file_url: string;
  cover_art_url: string | null;
  owner_id: number; // Matches backend owner_id
  uploaded_at: string; // ISO 8601 string
  author: string | null; // Added from backend
  duration_minutes: number | null; // Added from backend
  views: number; // NEW: Podcast views count
  plays: number; // NEW: Podcast plays count
}

// NEW: Interface for LiveStream
export interface LiveStream {
  id: number;
  title: string;
  description: string | null;
  stream_url: string | null; // URL for the actual live stream content
  status: 'live' | 'offline' | 'scheduled'; // Possible statuses
  start_time: string | null; // ISO 8601 string, when stream went live
  end_time: string | null; // ISO 8601 string, when stream went offline
  current_viewers: number; // Current live viewers
  total_views: number; // Total views across all sessions
  host_id: number; // ID of the user hosting the stream
}
