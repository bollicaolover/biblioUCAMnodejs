'use client';

import { useState, useEffect } from 'react';
import { LibraryMap } from '@/components/map/LibraryMap';
import { AuthHeader } from '@/components/auth/AuthNavBar';
import { SidebarUserPanel } from '@/components/auth/AuthNavBar';
import { MyBookingsPanel } from '@/components/booking/MyBookingsPanel';

function AlternatingColorText({ text }: { text: string }) {
  return (
    <span className="font-medium">
      {text.split('').map((char, i) => (
        <span
          key={`${i}-${char}`}
          className="ucam-alternating-char inline-block"
          style={{ animationDelay: `-${(i * 0.18) % 4}s` }}
        >
          {char === ' ' ? '\u00A0' : char}
        </span>
      ))}
    </span>
  );
}

function MadeByCredit({ className = '' }: { className?: string }) {
  return (
    <p className={className}>
      Hecho por <span className="font-semibold">G1904</span>
    </p>
  );
}

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [bookingsRefreshTrigger, setBookingsRefreshTrigger] = useState(0);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.ok) {
            setIsLoggedIn(true);
            setUserEmail(data.email);
          }
        }
      } catch (error) {
        console.error('Error checking session', error);
      } finally {
        setIsInitializing(false);
      }
    }
    checkSession();
  }, []);

  function handleLoginSuccess(email: string) {
    setIsLoggedIn(true);
    setUserEmail(email);
  }

  async function handleLogout() {
    await fetch('/api/auth/login', { method: 'DELETE' });
    setIsLoggedIn(false);
    setUserEmail(null);
  }

  function handleSessionExpired() {
    setIsLoggedIn(false);
    setUserEmail(null);
  }

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F2F5F9] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#002855]">
          <span className="animate-spin h-5 w-5 border-2 border-[#002855]/30 border-t-[#002855] rounded-full" />
          <span className="text-sm font-medium text-[#64748B]">Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2F5F9] text-[#1E2940] flex flex-col lg:flex-row relative">
      {/* Top Navbar for Mobile */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#002855] px-4 py-3 flex items-center justify-center lg:hidden shadow-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white rounded flex items-center justify-center">
            <span className="text-[#002855] font-bold text-[10px] leading-none">67</span>
          </div>
          <h1 className="text-base font-semibold text-white tracking-wide">TakiSpot</h1>
        </div>
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <AuthHeader
            isLoggedIn={isLoggedIn}
            userEmail={userEmail}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />
        </div>
      </header>

      {/* Sidebar — desktop only */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 bg-[#002855] flex-shrink-0 h-screen sticky top-0 shadow-xl overflow-y-auto">
        <div className="p-6 flex flex-col gap-5 h-full">
          {/* Logo */}
          <div className="border-b border-white/10 pb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                <span className="text-[#002855] font-bold text-sm leading-none">67</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">TakiSpot</h1>
                <p className="text-white/50 text-xs font-medium">Biblioteca · TakeASpot</p>
              </div>
            </div>
          </div>

          {/* User panel (login form or user info) */}
          <SidebarUserPanel
            isLoggedIn={isLoggedIn}
            userEmail={userEmail}
            onLoginSuccess={handleLoginSuccess}
            onLogout={handleLogout}
          />

          {/* System limits */}
          <div className="bg-white/5 rounded-xl border border-white/10 p-4 text-sm text-white/70 flex flex-col gap-2 mt-auto">
            <p className="text-white font-semibold text-xs uppercase tracking-wider mb-1">Límites del sistema</p>
            <ul className="flex flex-col gap-1.5 list-none font-normal">
              <li className="flex items-start gap-2">
                <span className="text-white/40 mt-0.5">•</span>
                Máximo 6 reservas por día
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/40 mt-0.5">•</span>
                Nota: si eres el francés no tienes derecho a reservar en esta app. aprende a usar la normal primero y deja de tocar las bolas.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-white/40 mt-0.5">•</span>
                Si queréis alguna funcionalidad nueva, decidmelo, la cosa es saber quien soy.
              </li>
            </ul>
            <div className="border-t border-white/10 mt-2 pt-2 text-white/30 text-xs flex flex-col gap-1.5">
              <MadeByCredit className="text-white/40" />
              <AlternatingColorText text="v6.7" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <div className="p-4 lg:p-6 lg:pt-6">
          <div className="max-w-6xl mx-auto">
            {/* Main panels */}
            <div key={userEmail || 'anonymous'}>
              <div className="mb-8 w-full xl:max-w-2xl">
                <MyBookingsPanel
                  isLoggedIn={isLoggedIn}
                  onSessionExpired={handleSessionExpired}
                  refreshTrigger={bookingsRefreshTrigger}
                />
              </div>

              <LibraryMap
                isLoggedIn={isLoggedIn}
                onSessionExpired={handleSessionExpired}
                onBookingSuccess={() => setBookingsRefreshTrigger((n) => n + 1)}
              />

              <footer className="lg:hidden mt-10 pb-2 text-center text-xs text-[#94A3B8]">
                <MadeByCredit />
              </footer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
