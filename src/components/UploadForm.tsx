/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion } from "motion/react";
import { 
  UploadCloud, 
  FileAudio, 
  Image as ImageIcon, 
  CheckCircle2, 
  AlertCircle, 
  Lock,
  ArrowRight,
  Disc,
  Loader2
} from "lucide-react";
import { UserProfile } from "../types";
import { 
  db, 
  storage, 
  collection, 
  addDoc, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL,
  serverTimestamp 
} from "../firebase";

interface UploadFormProps {
  user: UserProfile | null;
  onOpenAuth: () => void;
  onUploadSuccess: () => void;
}

export default function UploadForm({ user, onOpenAuth, onUploadSuccess }: UploadFormProps) {
  // Form State
  const [songTitle, setSongTitle] = useState("");
  const [artistName, setArtistName] = useState("");
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  // Image Preview State
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Upload States
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState<"idle" | "artwork" | "audio" | "database" | "success">("idle");
  const [artworkProgress, setArtworkProgress] = useState(0);
  const [audioProgress, setAudioProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // File Input Refs
  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Drag and Drop State
  const [isAudioDragOver, setIsAudioDragOver] = useState(false);
  const [isImageDragOver, setIsImageDragOver] = useState(false);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md bg-zinc-900/40 backdrop-blur-md border border-white/5 p-8 rounded-2xl shadow-2xl flex flex-col items-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 bg-emerald-500/10 blur-2xl rounded-full"></div>
          <div className="h-16 w-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20 relative">
            <Lock className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Upload Disabled</h2>
          <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
            You must be signed in to upload your custom tracks and share them with the VibeStream community.
          </p>
          <button
            id="btn-upload-login"
            onClick={onOpenAuth}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold py-3 px-6 rounded-xl text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            Sign In with VibeStream
            <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>
      </div>
    );
  }

  // Handle Drag & Drop Events
  const handleDragOver = (e: React.DragEvent, type: "audio" | "image") => {
    e.preventDefault();
    if (type === "audio") setIsAudioDragOver(true);
    else setIsImageDragOver(true);
  };

  const handleDragLeave = (type: "audio" | "image") => {
    if (type === "audio") setIsAudioDragOver(false);
    else setIsImageDragOver(false);
  };

  const handleDrop = (e: React.DragEvent, type: "audio" | "image") => {
    e.preventDefault();
    if (type === "audio") {
      setIsAudioDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("audio/")) {
        setAudioFile(file);
      } else {
        setError("Please drop a valid audio file (e.g., .mp3)");
      }
    } else {
      setIsImageDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setError("Please drop a valid image file (e.g., .jpg or .png)");
      }
    }
  };

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setAudioFile(file);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!songTitle.trim() || !artistName.trim() || !audioFile) {
      setError("Please fill out all required fields and select an audio file.");
      return;
    }

    setUploading(true);
    setError(null);
    setCurrentStep("artwork");

    let artworkUrl = "";
    let finalAudioUrl = "";

    try {
      // 1. Upload Artwork (if provided)
      if (imageFile) {
        const uniqueArtName = `artwork/${user.uid}_${Date.now()}_${imageFile.name}`;
        const artworkRef = ref(storage, uniqueArtName);
        const artUploadTask = uploadBytesResumable(artworkRef, imageFile);

        artworkUrl = await new Promise<string>((resolve, reject) => {
          artUploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
              setArtworkProgress(progress);
            },
            (err) => reject(err),
            async () => {
              const url = await getDownloadURL(artUploadTask.snapshot.ref);
              resolve(url);
            }
          );
        });
      } else {
        // Fallback placeholder image URL
        artworkUrl = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&h=300&fit=crop";
        setArtworkProgress(100);
      }

      // 2. Upload Audio File
      setCurrentStep("audio");
      const uniqueAudioName = `audio/${user.uid}_${Date.now()}_${audioFile.name}`;
      const audioRef = ref(storage, uniqueAudioName);
      const audioUploadTask = uploadBytesResumable(audioRef, audioFile);

      finalAudioUrl = await new Promise<string>((resolve, reject) => {
        audioUploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            setAudioProgress(progress);
          },
          (err) => reject(err),
          async () => {
            const url = await getDownloadURL(audioUploadTask.snapshot.ref);
            resolve(url);
          }
        );
      });

      // 3. Create Firestore record
      setCurrentStep("database");
      await addDoc(collection(db, "songs"), {
        songTitle: songTitle.trim(),
        artistName: artistName.trim(),
        audioUrl: finalAudioUrl,
        imageUrl: artworkUrl,
        uploadedBy: user.uid,
        uploadedByName: user.displayName || "Community Artist",
        uploadedByEmail: user.email || "unknown@vibestream.com",
        timestamp: serverTimestamp(),
        plays: 0,
        likes: []
      });

      // 4. Finished
      setCurrentStep("success");
      setTimeout(() => {
        // Reset states
        setSongTitle("");
        setArtistName("");
        setAudioFile(null);
        setImageFile(null);
        setImagePreview(null);
        setArtworkProgress(0);
        setAudioProgress(0);
        setUploading(false);
        setCurrentStep("idle");
        onUploadSuccess();
      }, 2000);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during upload. Please try again.");
      setUploading(false);
      setCurrentStep("idle");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* Title Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <UploadCloud className="h-8 w-8 text-emerald-400" />
          Share Your Creative Sound
        </h1>
        <p className="text-sm text-zinc-400 mt-2">
          Upload lossless audio with stunning cover art directly to your cloud catalog.
        </p>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-300">Upload Issue Detected</h4>
            <p className="mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {uploading ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#181818] border border-neutral-800 p-8 rounded-2xl text-center space-y-8"
        >
          <div className="flex flex-col items-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-green-500/10 text-green-500 mb-4">
              <Disc className="h-12 w-12 animate-spin" style={{ animationDuration: '3s' }} />
              {currentStep === "database" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full">
                  <Loader2 className="h-10 w-10 text-green-400 animate-spin" />
                </div>
              )}
            </div>
            
            <h3 className="text-xl font-bold text-white">
              {currentStep === "artwork" && "Syncing Album Artwork..."}
              {currentStep === "audio" && "Streaming Track to Server..."}
              {currentStep === "database" && "Securing High-Fi Metadata..."}
              {currentStep === "success" && "Transmission Complete!"}
            </h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm">
              {currentStep === "artwork" && "Compressing and uploading cover graphic for dynamic caching."}
              {currentStep === "audio" && "Uploading audio packets securely. Please remain on this screen."}
              {currentStep === "database" && "Saving collection indexes to primary real-time database."}
              {currentStep === "success" && "Your track is officially live and available for listening."}
            </p>
          </div>

          {/* Progress Indicators */}
          <div className="space-y-4 max-w-md mx-auto">
            {/* Artwork Progress */}
            {imageFile && (
              <div className="space-y-1.5 text-left">
                <div className="flex justify-between text-xs font-semibold">
                  <span className={artworkProgress === 100 ? "text-green-400 flex items-center gap-1" : "text-neutral-400"}>
                    {artworkProgress === 100 && <CheckCircle2 className="h-3 w-3" />}
                    Artwork File
                  </span>
                  <span className="text-neutral-500">{artworkProgress}%</span>
                </div>
                <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-green-500 h-1.5 transition-all duration-300 rounded-full" 
                    style={{ width: `${artworkProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Audio Progress */}
            <div className="space-y-1.5 text-left">
              <div className="flex justify-between text-xs font-semibold">
                <span className={audioProgress === 100 ? "text-green-400 flex items-center gap-1" : "text-neutral-400"}>
                  {audioProgress === 100 && <CheckCircle2 className="h-3 w-3" />}
                  Audio (.mp3) File
                </span>
                <span className="text-neutral-500">{audioProgress}%</span>
              </div>
              <div className="w-full bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-green-500 h-1.5 transition-all duration-300 rounded-full" 
                  style={{ width: `${audioProgress}%` }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Metadata Fields */}
            <div className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-6 rounded-2xl space-y-5 shadow-xl">
              <h3 className="text-md font-bold text-zinc-300 border-b border-white/5 pb-2.5">
                Track Details
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Song Title <span className="text-red-500">*</span>
                </label>
                <input
                  id="upload-song-title"
                  type="text"
                  required
                  value={songTitle}
                  onChange={(e) => setSongTitle(e.target.value)}
                  placeholder="e.g., Starlight Dreams"
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  Artist / Producer Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="upload-artist-name"
                  type="text"
                  required
                  value={artistName}
                  onChange={(e) => setArtistName(e.target.value)}
                  placeholder="e.g., DJ Luminary"
                  className="w-full bg-zinc-950 border border-white/5 rounded-xl py-3 px-4 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
                />
              </div>

              {/* Cover Art selection placeholder display */}
              <div className="pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">
                  Uploaded Artwork Preview
                </label>
                {imagePreview ? (
                  <div className="relative group w-32 h-32 rounded-lg overflow-hidden border border-white/5">
                    <img 
                      src={imagePreview} 
                      alt="Artwork Preview" 
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all text-xs font-semibold text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-lg bg-zinc-950 border border-dashed border-white/10 flex flex-col items-center justify-center text-center p-2 text-zinc-500 text-xs">
                    <ImageIcon className="h-6 w-6 mb-1 text-zinc-600" />
                    No Artwork Chosen
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: File Drops */}
            <div className="space-y-6">
              {/* Audio File Box */}
              <div 
                onDragOver={(e) => handleDragOver(e, "audio")}
                onDragLeave={() => handleDragLeave("audio")}
                onDrop={(e) => handleDrop(e, "audio")}
                className={`bg-zinc-900/40 backdrop-blur-md border rounded-2xl p-6 text-center transition-all shadow-xl ${
                  isAudioDragOver 
                    ? "border-emerald-400 bg-emerald-500/5" 
                    : audioFile 
                      ? "border-emerald-500/30 bg-zinc-900/50" 
                      : "border-white/5 hover:border-white/10"
                }`}
              >
                <input
                  type="file"
                  ref={audioInputRef}
                  onChange={handleAudioSelect}
                  accept="audio/mp3,audio/mpeg,audio/*"
                  className="hidden"
                />
                
                <div className="flex flex-col items-center py-4 cursor-pointer" onClick={() => audioInputRef.current?.click()}>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 border ${
                    audioFile ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-950 text-zinc-500 border-white/5"
                  }`}>
                    <FileAudio className="h-6 w-6" />
                  </div>
                  {audioFile ? (
                    <div className="max-w-xs">
                      <p className="text-sm font-bold text-white truncate px-2">
                        {audioFile.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {(audioFile.size / (1024 * 1024)).toFixed(2)} MB • Audio Selected
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-white">
                        Choose Audio Track <span className="text-red-500">*</span>
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Drag & Drop or click to browse files
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                        Lossless FLAC, MP3, WAV or M4A accepted
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Artwork Image Box */}
              <div 
                onDragOver={(e) => handleDragOver(e, "image")}
                onDragLeave={() => handleDragLeave("image")}
                onDrop={(e) => handleDrop(e, "image")}
                className={`bg-zinc-900/40 backdrop-blur-md border rounded-2xl p-6 text-center transition-all shadow-xl ${
                  isImageDragOver 
                    ? "border-emerald-400 bg-emerald-500/5" 
                    : imageFile 
                      ? "border-emerald-500/30 bg-zinc-900/50" 
                      : "border-white/5 hover:border-white/10"
                }`}
              >
                <input
                  type="file"
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/jpeg,image/png,image/*"
                  className="hidden"
                />
                
                <div className="flex flex-col items-center py-4 cursor-pointer" onClick={() => imageInputRef.current?.click()}>
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center mb-3 border ${
                    imageFile ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-950 text-zinc-500 border-white/5"
                  }`}>
                    <ImageIcon className="h-6 w-6" />
                  </div>
                  {imageFile ? (
                    <div className="max-w-xs">
                      <p className="text-sm font-bold text-white truncate px-2">
                        {imageFile.name}
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {(imageFile.size / (1024 * 1024)).toFixed(2)} MB • Artwork Selected
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-bold text-white">
                        Choose Album Cover Art
                      </p>
                      <p className="text-xs text-zinc-400 mt-1">
                        Drag & Drop or click to browse files
                      </p>
                      <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                        Optional (Defaults to high-contrast fluid wave cover)
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Trigger Button */}
          <div className="flex justify-end pt-2">
            <button
              id="btn-upload-submit"
              type="submit"
              className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold px-8 py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 text-sm tracking-wide"
            >
              Broadcast Track
              <ArrowRight className="h-4.5 w-4.5" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
