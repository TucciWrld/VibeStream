/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from "react";
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Volume1,
  Maximize2,
  Repeat,
  Shuffle,
  Disc,
  Heart
} from "lucide-react";
import { Song, UserProfile } from "../types";
import { db, doc, updateDoc, arrayUnion, arrayRemove } from "../firebase";

interface MusicPlayerProps {
  currentSong: Song | null;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onNext: () => void;
  onPrev: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export default function MusicPlayer({ 
  currentSong, 
  isPlaying, 
  setIsPlaying, 
  onNext, 
  onPrev,
  user,
  onOpenAuth
}: MusicPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Player state
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  // Synchronize play state
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        console.warn("Autoplay blocked or playback error:", err);
        setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, currentSong]);

  // Handle source changes
  useEffect(() => {
    if (!audioRef.current || !currentSong) return;
    audioRef.current.src = currentSong.audioUrl;
    audioRef.current.load();
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
    setCurrentTime(0);
  }, [currentSong]);

  // Save current audio element callbacks
  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration);
  };

  const handleAudioEnded = () => {
    if (isLooping) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => setIsPlaying(false));
      }
    } else {
      onNext();
    }
  };

  const handlePlayPause = () => {
    if (!currentSong) return;
    setIsPlaying(!isPlaying);
  };

  // Scrubber control
  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  // Volume control
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      audioRef.current.muted = newVolume === 0;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    audioRef.current.muted = nextMuted;
  };

  // Format time (e.g. 3:45)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // Like handler for current track
  const isLiked = user && currentSong ? (currentSong.likes || []).includes(user.uid) : false;
  const handleLikeCurrent = async () => {
    if (!currentSong) return;
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      const songRef = doc(db, "songs", currentSong.id);
      if (isLiked) {
        await updateDoc(songRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        await updateDoc(songRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (err) {
      console.error("Error liking current track:", err);
    }
  };

  // Get correct volume icon
  const getVolumeIcon = () => {
    if (isMuted || volume === 0) return <VolumeX className="h-5 w-5" />;
    if (volume < 0.3) return <Volume1 className="h-5 w-5" />;
    return <Volume2 className="h-5 w-5" />;
  };

  if (!currentSong) return null;

  return (
    <div 
      id="bottom-music-player"
      className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-zinc-950/70 backdrop-blur-xl border-t border-white/5 px-4 md:px-6 flex items-center justify-between text-white shadow-2xl"
    >
      {/* Hidden Audio Tag */}
      <audio 
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
      />

      {/* Left Area: Album details */}
      <div className="flex items-center gap-3 w-1/4 min-w-[180px]">
        <div className="relative h-12 w-12 rounded overflow-hidden shrink-0 border border-white/5 bg-zinc-950">
          <img 
            src={currentSong.imageUrl} 
            alt={currentSong.songTitle} 
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
          />
          {isPlaying && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <Disc className="h-5 w-5 text-emerald-400 animate-spin" style={{ animationDuration: '3s' }} />
            </div>
          )}
        </div>
        <div className="min-w-0 pr-1">
          <h4 className="text-xs md:text-sm font-bold truncate text-white hover:underline cursor-pointer">
            {currentSong.songTitle}
          </h4>
          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
            {currentSong.artistName}
          </p>
        </div>
        <button
          id="btn-player-like"
          onClick={handleLikeCurrent}
          className={`p-1.5 rounded-full hover:bg-white/5 shrink-0 transition-all ${
            isLiked ? "text-emerald-400 scale-105" : "text-zinc-500 hover:text-white"
          }`}
        >
          <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      {/* Center Area: Playback controls and progress scrubber */}
      <div className="flex flex-col items-center flex-1 max-w-xl px-2">
        {/* Playback Buttons */}
        <div className="flex items-center gap-5">
          <button
            id="btn-player-shuffle"
            onClick={() => setIsShuffle(!isShuffle)}
            className={`p-1.5 rounded-full transition-colors hidden md:block ${
              isShuffle ? "text-emerald-400 font-bold" : "text-zinc-500 hover:text-white"
            }`}
          >
            <Shuffle className="h-4 w-4" />
          </button>

          <button
            id="btn-player-prev"
            onClick={onPrev}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <SkipBack className="h-5 w-5 fill-current" />
          </button>

          <button
            id="btn-player-play"
            onClick={handlePlayPause}
            className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-full bg-white text-black hover:scale-105 transition-all cursor-pointer shadow-lg"
          >
            {isPlaying ? (
              <Pause className="h-4 w-4 md:h-5 md:w-5 fill-black text-black ml-0" />
            ) : (
              <Play className="h-4 w-4 md:h-5 md:w-5 fill-black text-black ml-0.5" />
            )}
          </button>

          <button
            id="btn-player-next"
            onClick={onNext}
            className="p-1.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <SkipForward className="h-5 w-5 fill-current" />
          </button>

          <button
            id="btn-player-repeat"
            onClick={() => setIsLooping(!isLooping)}
            className={`p-1.5 rounded-full transition-colors hidden md:block ${
              isLooping ? "text-emerald-400 font-bold" : "text-zinc-500 hover:text-white"
            }`}
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Bar Scrubber */}
        <div className="w-full flex items-center gap-2.5 mt-1">
          <span className="text-[10px] font-mono text-zinc-500 w-8 text-right select-none">
            {formatTime(currentTime)}
          </span>
          <div className="flex-1 relative flex items-center group">
            <input
              id="player-scrubber"
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={handleScrub}
              className="w-full accent-emerald-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer group-hover:h-1.5 transition-all"
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-500 w-8 text-left select-none">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right Area: Volume controller */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[120px]">
        <button
          id="btn-player-mute"
          onClick={toggleMute}
          className="text-zinc-400 hover:text-white transition-colors p-1"
        >
          {getVolumeIcon()}
        </button>
        <input
          id="player-volume-slider"
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={isMuted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-20 md:w-24 accent-emerald-400 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
        />
        <button className="text-zinc-400 hover:text-white hidden md:block transition-colors p-1">
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
