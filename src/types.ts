export interface Song {
  id: string;
  songTitle: string;
  artistName: string;
  audioUrl: string;
  imageUrl: string;
  uploadedBy: string;
  uploadedByName?: string;
  uploadedByEmail?: string;
  timestamp: any; // Firestore Timestamp
  plays?: number;
  likes?: string[]; // Array of userIds who liked the song
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}
