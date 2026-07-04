/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Home, 
  Search, 
  UploadCloud, 
  Music, 
  User, 
  LogOut, 
  Disc,
  Library
} from "lucide-react";
import { UserProfile } from "../types";
import { auth, signOut } from "../firebase";

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  user: UserProfile | null;
  onOpenAuth: () => void;
}

export default function Sidebar({ currentTab, setCurrentTab, user, onOpenAuth }: SidebarProps) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    { id: "home", label: "Home", icon: Home },
    { id: "search", label: "Search", icon: Search },
    { id: "upload", label: "Upload Song", icon: UploadCloud },
    { id: "library", label: "Your Library", icon: Library },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside 
        id="desktop-sidebar"
        className="hidden md:flex flex-col w-64 bg-[#000000] border-r border-white/5 p-6 h-screen sticky top-0 shrink-0 select-none text-white justify-between z-10"
      >
        <div className="space-y-8">
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => setCurrentTab("home")}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-emerald-400 text-white shadow-lg shadow-emerald-500/10">
              <Disc className="h-6 w-6 animate-spin" style={{ animationDuration: '4s' }} />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tighter italic bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent">
                VibeStream
              </span>
              <div className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase font-bold -mt-1 glow-green">
                FLAC Hi-Fi
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 px-3 mb-3">
              Menu
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => setCurrentTab(item.id)}
                  className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group cursor-pointer border ${
                    isActive 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm" 
                      : "text-zinc-400 border-transparent hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Icon className={`h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${isActive ? "text-emerald-400" : "text-zinc-400 group-hover:text-white"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Feature box and profile */}
        <div className="space-y-6">
          {/* Static New Features Box */}
          <div className="bg-zinc-900/60 rounded-xl p-4 border border-white/5 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-16 h-16 bg-emerald-500/10 blur-xl rounded-full"></div>
            <p className="text-xs font-bold text-white mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
              New Features
            </p>
            <p className="text-[11px] text-zinc-400 leading-normal mb-3">
              Drag & drop audio files for instant upload to Cloud storage.
            </p>
            <button 
              onClick={() => setCurrentTab("upload")}
              className="w-full py-1.5 bg-white hover:bg-zinc-200 text-black rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
            >
              Upload Song
            </button>
          </div>

          {/* User Profile / Auth Status */}
          <div className="border-t border-white/5 pt-4">
            {user ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 px-2">
                  {user.photoURL ? (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || "User"} 
                      className="h-9 w-9 rounded-full border border-white/10 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-900 text-neutral-300 font-semibold border border-white/5">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : <User className="h-4 w-4" />}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate text-white">
                      {user.displayName || "User"}
                    </p>
                    <p className="text-[11px] text-zinc-500 truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <button
                  id="btn-sidebar-logout"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 border border-white/5 hover:border-red-500/10 transition-all cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-b from-zinc-900 to-black border border-white/5 rounded-xl space-y-3">
                <p className="text-xs font-semibold text-zinc-300 leading-normal">
                  Sign in to share songs and build your playlist library!
                </p>
                <button
                  id="btn-sidebar-login"
                  onClick={onOpenAuth}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-2 px-4 rounded-lg text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="h-3.5 w-3.5" />
                  Sign In / Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav 
        id="mobile-navigation"
        className="md:hidden fixed bottom-20 left-4 right-4 z-40 bg-[#050505]/95 backdrop-blur-md border border-white/5 rounded-2xl flex justify-around p-3 shadow-2xl"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`mobile-nav-${item.id}`}
              onClick={() => setCurrentTab(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-150 cursor-pointer ${
                isActive ? "text-emerald-400" : "text-zinc-500"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="text-[10px] font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
