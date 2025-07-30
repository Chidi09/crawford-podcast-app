// frontend/src/types.ts

// Define the type for a Podcast object based on your backend schema
export interface Podcast {
  id: number;
  title: string;
  description: string;
  audio_file_url: string;
  cover_art_url: string | null;
  owner_id: number;
  uploaded_at: string; // ISO 8601 string
  author?: string; // Optional, as per backend schema
  duration_minutes?: number; // Optional, as per backend schema
  views: number; // Added views
  plays: number; // Added plays
}

// Define the type for a LiveStream object based on your backend schema
export interface LiveStream {
  id: number;
  title: string;
  description: string | null;
  status: string; // e.g., "live", "offline", "scheduled"
  stream_url: string | null;
  start_time: string | null; // ISO 8601 string
  end_time: string | null; // ISO 8601 string
  current_viewers: number;
  total_views: number;
  host_id: number;
  // host: UserResponse; // If you want to embed host details, you'd need UserResponse type here
}

// Define the type for a User object (simplified for frontend use if needed)
export interface User {
  id: number;
  username: string;
  email: string;
  is_active: boolean;
  is_admin: boolean;
  role: string; // "user", "lecturer", "admin"
}
