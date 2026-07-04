/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { 
  auth, 
  db, 
  onSnapshot, 
  collection, 
  query, 
  orderBy, 
  onAuthStateChanged,
  addDoc,
  serverTimestamp
} from "./firebase";
import { Song, UserProfile } from "./types";
import Sidebar from "./components/Sidebar";
import MainContent from "./components/MainContent";
import MusicPlayer from "./components/MusicPlayer";
import AuthModal from "./components/AuthModal";
import { Disc, Music, Sparkles } from "lucide-react";

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState("home");
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Authenticated User State
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Music Catalog State
  const [songs, setSongs] = useState<Song[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(true);

  // Playback Control States
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playQueue, setPlayQueue] = useState<Song[]>([]);

  // 1. Real-time Authentication Sync
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          photoURL: firebaseUser.photoURL
        });
      } else {
        setUser(null);
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Firestore Tracks Sync
  useEffect(() => {
    const songsQuery = query(collection(db, "songs"), orderBy("timestamp", "desc"));
    
    const unsubscribe = onSnapshot(songsQuery, (snapshot) => {
      const fetchedSongs: Song[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedSongs.push({
          id: doc.id,
          songTitle: data.songTitle || "Untitled Track",
          artistName: data.artistName || "Unknown Artist",
          audioUrl: data.audioUrl || "",
          imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&h=300&fit=crop",
          uploadedBy: data.uploadedBy || "",
          uploadedByName: data.uploadedByName || "Community Artist",
          uploadedByEmail: data.uploadedByEmail || "",
          timestamp: data.timestamp,
          plays: data.plays || 0,
          likes: data.likes || []
        });
      });
      setSongs(fetchedSongs);
      setLoadingSongs(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      setLoadingSongs(false);
    });

    return () => unsubscribe();
  }, []);

  // 3. Selection of Song & Setting of Play Queue Context
  const handleSelectSong = (song: Song, contextSongs: Song[]) => {
    setCurrentSong(song);
    setPlayQueue(contextSongs);
    setIsPlaying(true);
  };

  // 4. Queue Navigations (Next/Prev)
  const handleNextSong = () => {
    if (playQueue.length === 0 || !currentSong) return;
    const currentIndex = playQueue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex === -1) return;

    // Wrap around to the start
    const nextIndex = (currentIndex + 1) % playQueue.length;
    setCurrentSong(playQueue[nextIndex]);
    setIsPlaying(true);
  };

  const handlePrevSong = () => {
    if (playQueue.length === 0 || !currentSong) return;
    const currentIndex = playQueue.findIndex((s) => s.id === currentSong.id);
    if (currentIndex === -1) return;

    // Wrap around to the end
    const prevIndex = (currentIndex - 1 + playQueue.length) % playQueue.length;
    setCurrentSong(playQueue[prevIndex]);
    setIsPlaying(true);
  };

  // 5. Seed Demo Tracks Helper (Optional, but amazing for immediate play/test)
  const seedDemoTracks = async () => {
    const demoTracks = [
      {
        songTitle: "Midnight City Lights",
        artistName: "Tokyo Retro Wave",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
        imageUrl: "https://images.unsplash.com/photo-1515462277126-270d878326e5?q=80&w=300&h=300&fit=crop",
        uploadedBy: "system_demo",
        uploadedByName: "System Host",
        uploadedByEmail: "info@vibestream.com"
      },
      {
        songTitle: "Coastal Horizon Breeze",
        artistName: "Acoustic Horizon",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
        imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=300&h=300&fit=crop",
        uploadedBy: "system_demo",
        uploadedByName: "System Host",
        uploadedByEmail: "info@vibestream.com"
      },
      {
        songTitle: "Digital Sunset Chillout",
        artistName: "Synth Wanderer",
        audioUrl: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
        imageUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300&h=300&fit=crop",
        uploadedBy: "system_demo",
        uploadedByName: "System Host",
        uploadedByEmail: "info@vibestream.com"
      }
    ];

    try {
      for (const track of demoTracks) {
        await addDoc(collection(db, "songs"), {
          ...track,
          timestamp: serverTimestamp(),
          plays: 0,
          likes: []
        });
      }
    } catch (err) {
      console.error("Demo seeding failed:", err);
      alert("Failed to seed demo tracks. Please check Firestore permissions.");
    }
  };

  return (
    <div id="vibestream-app-wrapper" className="min-h-screen bg-[#0B0B0B] text-white font-sans flex flex-col md:flex-row relative overflow-x-hidden">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-0 translate-x-1/3 -translate-y-1/3"></div>
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none z-0 -translate-x-1/3 translate-y-1/3"></div>
      {/* Sidebar (Left) */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        user={user} 
        onOpenAuth={() => setIsAuthOpen(true)} 
      />

      {/* Main Panel Content (Right) */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 border-b border-neutral-900 bg-black/90 sticky top-0 z-30 select-none">
          <div className="flex items-center gap-2">
            <Disc className="h-6 w-6 text-green-500 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="text-md font-bold tracking-tight text-white">VibeStream</span>
          </div>

          <div>
            {user ? (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-400">
                  {user.displayName?.split(" ")[0]}
                </span>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt="User" 
                    className="h-7 w-7 rounded-full border border-neutral-800 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-neutral-800 text-neutral-400 flex items-center justify-center font-bold text-xs">
                    {user.displayName?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            ) : (
              <button
                id="btn-mobile-login"
                onClick={() => setIsAuthOpen(true)}
                className="bg-green-500 hover:bg-green-400 text-black text-[10px] font-bold px-3 py-1.5 rounded-lg cursor-pointer"
              >
                Login
              </button>
            )}
          </div>
        </header>

        {loadingSongs ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[70vh]">
            <Disc className="h-10 w-10 text-green-500 animate-spin mb-4" />
            <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase">
              Loading hi-fi frequencies...
            </span>
          </div>
        ) : (
          <MainContent
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            songs={songs}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onSelectSong={handleSelectSong}
            user={user}
            onOpenAuth={() => setIsAuthOpen(true)}
          />
        )}
      </div>

      {/* Floating Demo Seeder Button (if empty catalog) */}
      {!loadingSongs && songs.length === 0 && (
        <div className="fixed top-4 right-4 z-40 hidden md:block">
          <button
            id="btn-quick-seed-demo"
            onClick={seedDemoTracks}
            className="flex items-center gap-2 bg-[#1c1c1e] hover:bg-neutral-800 border border-neutral-800 rounded-xl px-4 py-2 text-xs font-semibold text-green-400 cursor-pointer transition-colors shadow-xl"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Load Demo Hi-Fi tracks
          </button>
        </div>
      )}

      {/* Sticky Bottom Music Player */}
      <MusicPlayer
        currentSong={currentSong}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onNext={handleNextSong}
        onPrev={handlePrevSong}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Global Auth Modal */}
      <AuthModal 
        isOpen={isAuthOpen} 
        onClose={() => setIsAuthOpen(false)} 
      />
    </div>
  );
}
