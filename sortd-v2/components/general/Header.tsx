"use client";

import Image from "next/image";
import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { ChevronDown, LogOut, Menu, PanelLeftOpen, Settings2, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";

type Props = {
  user?: User | null;
  onUserChange?: (user: User | null) => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
  onOpenSettings?: () => void;
};

export default function Header({ user, onUserChange, onToggleSidebar, sidebarOpen, onOpenSettings }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [error, setError] = useState("");
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    setError("");
    const { error: signOutError } = await supabase.auth.signOut();
    setSigningOut(false);
    if (signOutError) { setError(signOutError.message); return; }
    setMenuOpen(false);
    onUserChange?.(null);
  }

  return (
    <header className="relative z-30 border-b border-[#25445b] bg-[#102a43] text-white shadow-[0_6px_22px_rgba(16,42,67,0.12)]">
      <div className="mx-auto flex h-[76px] w-full max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        {user && onToggleSidebar && (
          <button type="button" onClick={onToggleSidebar} aria-label={sidebarOpen ? "Hide navigation" : "Show navigation"} aria-expanded={sidebarOpen}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/20 text-white/85 transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#5de0d1]">
            {sidebarOpen ? <Menu size={20} /> : <PanelLeftOpen size={20} />}
          </button>
        )}
        <div className="rounded-xl px-3 py-1.5 shadow-sm">
          <Image src="/logo3.png" alt="Sort'd" width={140} height={50} priority className="h-9 w-auto" />
        </div>
        <div className="flex-1" />
        {user && (
          <div className="relative">
            <button type="button" aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen(v => !v)}
              className="flex max-w-[220px] items-center gap-2 rounded-xl border border-white/20 px-2 py-1.5 text-sm transition hover:bg-white/10 sm:px-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1c706e] text-white"><UserRound size={17}/></span>
              <span className="hidden max-w-[130px] truncate text-white/90 sm:block">{user.email?.split("@")[0] || "Account"}</span>
              <ChevronDown size={15} className="text-white/70" />
            </button>
            {menuOpen && (
              <div role="menu" className="absolute right-0 top-[calc(100%+10px)] z-50 w-64 rounded-2xl border border-[#d7dfdd] bg-white p-2 text-[#102a43] shadow-xl">
                <p className="truncate border-b border-[#e2e8e6] px-3 py-3 text-xs text-[#64748b]">{user.email}</p>
                {onOpenSettings && <button role="menuitem" type="button" onClick={() => { setMenuOpen(false); onOpenSettings(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm hover:bg-[#eef2f1]"><Settings2 size={17}/> Settings</button>}
                <button role="menuitem" type="button" disabled={signingOut} onClick={signOut} className="flex w-full items-center gap-2 rounded-lg px-3 py-3 text-left text-sm hover:bg-[#eef2f1] disabled:opacity-50"><LogOut size={17}/> {signingOut ? "Signing out…" : "Log out"}</button>
                {error && <p role="alert" className="px-3 py-2 text-xs text-red-600">{error}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
