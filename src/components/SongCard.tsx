/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { 
  Play, 
  Pause, 
  Download, 
  Heart, 
  Trash2, 
  Music,
  Share2,
  Check,
  Disc,
  Loader2
} from "lucide-react";
import { Song, UserProfile } from "../types";
import { db, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from "../firebase";

interface SongCardProps {
  key?: React.Key;
  song: Song;
  isPlaying: boolean;
  isCurrent: boolean;
  onSelect: () => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export default function SongCard({ 
  song, 
  isPlaying, 
  isCurrent, 
  onSelect, 
  user,
  onOpenAuth
}: SongCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Check if liked
  const isLiked = user ? (song.likes || []).includes(user.uid) : false;

  // Handle Like/Unlike
  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      onOpenAuth();
      return;
    }

    try {
      const songRef = doc(db, "songs", song.id);
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
      console.error("Error updating likes:", err);
    }
  };

  // Safe Audio Download Fetcher
  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloading(true);

    try {
      // Fetch audio URL directly as a Blob
      const response = await fetch(song.audioUrl);
      if (!response.ok) throw new Error("Network response was not ok");
      
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Create temporary anchor to trigger browser native download
      const tempLink = document.createElement("a");
      tempLink.href = blobUrl;
      // Sanitize file name
      const sanitizedTitle = song.songTitle.replace(/[^a-z0-9]/gi, "_").toLowerCase();
      tempLink.setAttribute("download", `${sanitizedTitle}.mp3`);
      document.body.appendChild(tempLink);
      
      tempLink.click();
      
      // Clean up
      document.body.removeChild(tempLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error("Download failed:", err);
      // Fallback simple new tab if blob fetch fails
      window.open(song.audioUrl, "_blank");
    } finally {
      setDownloading(false);
    }
  };

  // Delete uploaded track
  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || user.uid !== song.uploadedBy) return;

    if (!window.confirm(`Are you sure you want to delete "${song.songTitle}"?`)) {
      return;
    }

    setDeleting(true);
    try {
      await deleteDoc(doc(db, "songs", song.id));
    } catch (err) {
      console.error("Failed to delete song:", err);
      alert("Failed to delete track. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(song.audioUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      id={`song-card-${song.id}`}
      onClick={onSelect}
      className={`group relative bg-zinc-900/30 hover:bg-zinc-900/80 backdrop-blur-md p-4 rounded-xl transition-all duration-300 cursor-pointer select-none border border-white/5 hover:border-white/10 hover:translate-y-[-4px] flex flex-col justify-between ${
        isCurrent ? "bg-emerald-500/10 border-emerald-500/20" : ""
      }`}
    >
      <div>
        {/* Cover Art Container */}
        <div className="relative aspect-square w-full rounded-lg overflow-hidden bg-zinc-950 mb-4 shadow-md group-hover:shadow-lg">
          <img 
            src={song.imageUrl} 
            alt={song.songTitle} 
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
          />

          {/* Hover Play Button overlay */}
          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
            <button
              id={`btn-play-overlay-${song.id}`}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400 text-black shadow-lg hover:scale-105 transition-all cursor-pointer"
            >
              {isCurrent && isPlaying ? (
                <Pause className="h-6 w-6 fill-black text-black ml-0" />
              ) : (
                <Play className="h-6 w-6 fill-black text-black ml-0.5" />
              )}
            </button>
          </div>

          {/* Currently playing equalizer micro-animation */}
          {isCurrent && (
            <div className="absolute bottom-2.5 right-2.5 bg-black/60 rounded-full py-1.5 px-2.5 flex items-end gap-0.5 backdrop-blur-sm">
              <span className={`w-0.75 bg-emerald-400 rounded-full ${isPlaying ? "animate-[bounce_0.8s_infinite_100ms]" : "h-3"}`} style={{ height: isPlaying ? undefined : '12px' }} />
              <span className={`w-0.75 bg-emerald-400 rounded-full ${isPlaying ? "animate-[bounce_0.8s_infinite_300ms]" : "h-4"}`} style={{ height: isPlaying ? undefined : '16px' }} />
              <span className={`w-0.75 bg-emerald-400 rounded-full ${isPlaying ? "animate-[bounce_0.8s_infinite_500ms]" : "h-2.5"}`} style={{ height: isPlaying ? undefined : '10px' }} />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 pr-1">
          <h3 className={`font-bold truncate text-sm leading-tight tracking-tight ${isCurrent ? "text-emerald-400" : "text-white"}`}>
            {song.songTitle}
          </h3>
          <p className="text-xs text-zinc-400 truncate mt-1">
            {song.artistName}
          </p>
        </div>
      </div>

      {/* Action Strip (Sticky details + Controls) */}
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <div className="text-[10px] text-zinc-500 truncate max-w-[50%]">
          by {song.uploadedByName || "VibeArtist"}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Like Heart */}
          <button
            id={`btn-like-${song.id}`}
            onClick={handleLike}
            className={`p-1.5 rounded-full transition-all hover:bg-white/5 ${
              isLiked ? "text-emerald-400 scale-105" : "text-zinc-500 hover:text-white"
            }`}
          >
            <Heart className="h-4 w-4" fill={isLiked ? "currentColor" : "none"} />
          </button>

          {/* Share URL */}
          <button
            id={`btn-share-${song.id}`}
            onClick={handleShare}
            title="Copy audio link"
            className="p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
          </button>

          {/* Download */}
          <button
            id={`btn-download-${song.id}`}
            onClick={handleDownload}
            disabled={downloading}
            className="p-1.5 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-40"
          >
            {downloading ? (
              <Loader2 className="h-4 w-4 text-emerald-400 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
          </button>

          {/* Delete (only for owner) */}
          {user && user.uid === song.uploadedBy && (
            <button
              id={`btn-delete-${song.id}`}
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
