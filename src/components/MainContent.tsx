/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  Disc, 
  Heart, 
  UploadCloud, 
  Music, 
  ListMusic, 
  TrendingUp, 
  Sparkles,
  ArrowRight,
  Lock
} from "lucide-react";
import { Song, UserProfile } from "../types";
import SongCard from "./SongCard";
import UploadForm from "./UploadForm";

interface MainContentProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  songs: Song[];
  currentSong: Song | null;
  isPlaying: boolean;
  onSelectSong: (song: Song, contextSongs: Song[]) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export default function MainContent({
  currentTab,
  setCurrentTab,
  songs,
  currentSong,
  isPlaying,
  onSelectSong,
  user,
  onOpenAuth
}: MainContentProps) {
  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  
  // Library State
  const [libraryTab, setLibraryTab] = useState<"uploads" | "likes">("uploads");

  // Get localized greeting based on local hours
  const greeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 12) return "Good Morning";
    if (hours < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  // Filtered songs based on search query
  const searchedSongs = useMemo(() => {
    if (!searchQuery.trim()) return songs;
    const q = searchQuery.toLowerCase();
    return songs.filter(
      (song) => 
        song.songTitle.toLowerCase().includes(q) || 
        song.artistName.toLowerCase().includes(q)
    );
  }, [songs, searchQuery]);

  // Library Uploaded Songs
  const userUploadedSongs = useMemo(() => {
    if (!user) return [];
    return songs.filter((song) => song.uploadedBy === user.uid);
  }, [songs, user]);

  // Library Liked Songs
  const userLikedSongs = useMemo(() => {
    if (!user) return [];
    return songs.filter((song) => (song.likes || []).includes(user.uid));
  }, [songs, user]);

  return (
    <main className="flex-1 min-h-screen bg-transparent pb-36 text-white overflow-y-auto px-4 md:px-8 py-6 relative z-10">
      <AnimatePresence mode="wait">
        {/* HOME TAB */}
        {currentTab === "home" && (
          <motion.div
            key="home"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-8"
          >
            {/* Header Banner */}
            <div className="relative rounded-2xl overflow-hidden bg-zinc-900/40 backdrop-blur-md border border-white/5 p-8 md:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-4 max-w-xl text-center md:text-left z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                  Premium Acoustics Live
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-none">
                  {greeting}, {user ? user.displayName?.split(" ")[0] : "Listener"}
                </h1>
                <p className="text-sm md:text-md text-zinc-400 leading-relaxed max-w-md">
                  Welcome to VibeStream. Listen, save, and broadcast lossless audio with zero limits.
                </p>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                  <button
                    id="btn-banner-upload"
                    onClick={() => setCurrentTab("upload")}
                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-5 py-2.5 rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20"
                  >
                    <UploadCloud className="h-4 w-4" />
                    Upload My Beat
                  </button>
                  {!user && (
                    <button
                      id="btn-banner-login"
                      onClick={onOpenAuth}
                      className="border border-white/10 hover:border-white text-zinc-300 hover:text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-all cursor-pointer bg-white/5"
                    >
                      Create Account
                    </button>
                  )}
                </div>
              </div>
              <div className="relative h-48 w-48 hidden lg:flex items-center justify-center bg-zinc-900/40 border border-white/5 rounded-full shadow-2xl shrink-0">
                <Disc className="h-32 w-32 text-emerald-500/20 animate-spin" style={{ animationDuration: '10s' }} />
                <Music className="absolute h-12 w-12 text-emerald-400" />
              </div>
            </div>

            {/* Trending Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <TrendingUp className="h-5 w-5 text-emerald-400" />
                  <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                    Trending Tracks
                  </h2>
                </div>
                <span className="text-xs text-zinc-500 font-semibold uppercase tracking-wider font-mono">
                  {songs.length} Tracks Live
                </span>
              </div>

              {songs.length === 0 ? (
                <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full"></div>
                  <Disc className="h-12 w-12 text-zinc-700 mx-auto mb-4 animate-spin" style={{ animationDuration: '8s' }} />
                  <h3 className="text-md font-bold text-white">Your Streaming Catalog is Empty</h3>
                  <p className="text-xs text-zinc-400 mt-1 max-w-xs mx-auto">
                    Be the pioneering artist to broadcast a track on the database cloud storage!
                  </p>
                  <button
                    id="btn-empty-upload"
                    onClick={() => setCurrentTab("upload")}
                    className="mt-5 inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                  >
                    <UploadCloud className="h-3.5 w-3.5" />
                    Upload a Track (.mp3)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {songs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      isPlaying={isPlaying}
                      isCurrent={currentSong?.id === song.id}
                      onSelect={() => onSelectSong(song, songs)}
                      user={user}
                      onOpenAuth={onOpenAuth}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* SEARCH TAB */}
        {currentTab === "search" && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Search Input Bar */}
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Search</h1>
              <p className="text-xs text-neutral-400">Discover incredible sounds uploaded by global musicians.</p>
            </div>

            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
              <input
                id="search-input-field"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="What song or artist do you want to play?"
                className="w-full bg-zinc-900/40 hover:bg-zinc-800/50 backdrop-blur-md border border-white/5 rounded-2xl py-4 pl-12 pr-5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 transition-all focus:ring-1 focus:ring-emerald-400 shadow-xl"
              />
            </div>

            {/* Results */}
            <div className="space-y-4 pt-4">
              <h2 className="text-lg font-bold text-neutral-300">
                {searchQuery ? `Search results for "${searchQuery}"` : "All Beats"}
              </h2>

              {searchedSongs.length === 0 ? (
                <div className="py-16 text-center max-w-sm mx-auto bg-zinc-900/20 border border-white/5 rounded-2xl p-6">
                  <ListMusic className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-zinc-300">No match found</p>
                  <p className="text-xs text-zinc-500 mt-1">Make sure you checked the spelling or try searching for another artist.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {searchedSongs.map((song) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      isPlaying={isPlaying}
                      isCurrent={currentSong?.id === song.id}
                      onSelect={() => onSelectSong(song, searchedSongs)}
                      user={user}
                      onOpenAuth={onOpenAuth}
                    />
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* UPLOAD TAB */}
        {currentTab === "upload" && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
          >
            <UploadForm 
              user={user} 
              onOpenAuth={onOpenAuth} 
              onUploadSuccess={() => setCurrentTab("home")} 
            />
          </motion.div>
        )}

        {/* LIBRARY TAB */}
        {currentTab === "library" && (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Your Library</h1>
              <p className="text-xs text-zinc-400 mt-1">Manage your uploaded tracks and view files you have saved.</p>
            </div>

            {/* Segment control tabs */}
            <div className="flex border-b border-white/5 gap-6">
              <button
                id="btn-lib-tab-uploads"
                onClick={() => setLibraryTab("uploads")}
                className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
                  libraryTab === "uploads" 
                    ? "border-emerald-400 text-white" 
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Your Uploads ({userUploadedSongs.length})
              </button>
              <button
                id="btn-lib-tab-likes"
                onClick={() => setLibraryTab("likes")}
                className={`pb-3 text-sm font-bold tracking-tight border-b-2 transition-all cursor-pointer ${
                  libraryTab === "likes" 
                    ? "border-emerald-400 text-white" 
                    : "border-transparent text-zinc-400 hover:text-white"
                }`}
              >
                Liked Beats ({userLikedSongs.length})
              </button>
            </div>

            {/* Custom List Display depending on Login Status */}
            {!user ? (
              <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 rounded-2xl p-12 text-center max-w-md mx-auto shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full"></div>
                <Lock className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-md font-bold text-white">Sign In Required</h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Authenticate to check your personalized streaming uploads and liked favorites.
                </p>
                <button
                  id="btn-lib-auth-trigger"
                  onClick={onOpenAuth}
                  className="mt-5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-4 py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-md"
                >
                  Log In Now
                </button>
              </div>
            ) : (
              <div>
                {libraryTab === "uploads" ? (
                  userUploadedSongs.length === 0 ? (
                    <div className="text-center py-16 max-w-sm mx-auto bg-zinc-900/20 border border-white/5 rounded-2xl p-6">
                      <Music className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-zinc-300">No tracks published</p>
                      <p className="text-xs text-zinc-500 mt-1">You haven't uploaded any songs yet. Go to the Upload tab to add your first track.</p>
                      <button
                        id="btn-lib-go-upload"
                        onClick={() => setCurrentTab("upload")}
                        className="mt-4 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 text-xs font-semibold py-2 px-4 rounded-lg cursor-pointer"
                      >
                        Upload Now
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {userUploadedSongs.map((song) => (
                        <SongCard
                          key={song.id}
                          song={song}
                          isPlaying={isPlaying}
                          isCurrent={currentSong?.id === song.id}
                          onSelect={() => onSelectSong(song, userUploadedSongs)}
                          user={user}
                          onOpenAuth={onOpenAuth}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  userLikedSongs.length === 0 ? (
                    <div className="text-center py-16 max-w-sm mx-auto bg-zinc-900/20 border border-white/5 rounded-2xl p-6">
                      <Heart className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-zinc-300">No liked beats</p>
                      <p className="text-xs text-zinc-500 mt-1">Songs you like will appear here. Click the heart icon on any song to save it.</p>
                      <button
                        id="btn-lib-explore"
                        onClick={() => setCurrentTab("home")}
                        className="mt-4 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold py-2.5 px-4 rounded-lg cursor-pointer"
                      >
                        Discover Music
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                      {userLikedSongs.map((song) => (
                        <SongCard
                          key={song.id}
                          song={song}
                          isPlaying={isPlaying}
                          isCurrent={currentSong?.id === song.id}
                          onSelect={() => onSelectSong(song, userLikedSongs)}
                          user={user}
                          onOpenAuth={onOpenAuth}
                        />
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
