'use client';

import { useState, useEffect } from 'react';
import { LibraryMap } from '@/components/map/LibraryMap';
import { AuthHeader } from '@/components/auth/AuthNavBar';
import { MyBookingsPanel } from '@/components/booking/MyBookingsPanel';

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center font-bold text-[#00FF41] tracking-widest text-sm">
        <span className="animate-spin h-5 w-5 border-2 border-[#00FF41]/30 border-t-[#00FF41] mr-3" />
        &gt; INICIALIZANDO_TRANCE...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] flex flex-col lg:flex-row relative">
      {/* Top Navbar for Mobile */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a0a] border-b border-[#00FF41] px-4 py-3 flex items-center justify-between lg:hidden">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold text-[#00FF41] tracking-wider">&gt; RESERVAS_UCAM</h1>
        </div>
        <AuthHeader
          isLoggedIn={isLoggedIn}
          userEmail={userEmail}
          onLoginSuccess={handleLoginSuccess}
          onLogout={handleLogout}
        />
      </header>

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-72 xl:w-80 bg-[#0a0a0a] border-r border-[#00FF41] flex-shrink-0 h-screen sticky top-0">
        <div className="p-6 flex flex-col gap-6 h-full">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-bold text-[#00FF41] tracking-wider">&gt; RESERVAS_UCAM</h1>
            </div>
            <p className="text-[#00FF41]/60 text-sm font-medium">BIBLIOTECA · TAKEASPOT</p>
          </div>

          {/* Info */}
          <div className="bg-transparent border border-[#00FF41]/40 p-4 text-xs text-[#00FF41] flex flex-col gap-2 mt-auto">
            <p className="text-[#00FF41] font-bold text-xs uppercase tracking-wider">
              &gt; LÍMITES_DEL_SISTEMA
            </p>
            <ul className="flex flex-col gap-1.5 mt-1 list-none font-medium text-[#E0E0E0]/80">
              <li className="flex items-center gap-1.5"><span className="text-[#00FF41]">&gt;</span> Máximo 6 reservas/día</li>
              <li className="flex items-center gap-1.5"><span className="text-[#00FF41]">&gt;</span> Día completo: antes de 10:30</li>
              <li className="flex items-center gap-1.5"><span className="text-[#00FF41]">&gt;</span> Pasa el QR al entrar</li>
            </ul>
            <div className="border-t border-[#00FF41]/30 mt-2 pt-2 text-[#00FF41]/50 font-medium">
              v4.0 · UCAM_TERMINAL
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <div className="p-4 lg:p-6 lg:pt-6">
          <div className="max-w-6xl mx-auto">
            {/* Desktop Top Header */}
            <div className="hidden lg:flex items-center justify-between mb-6 pb-2 border-b border-[#00FF41]/30">
              <h2 className="text-2xl font-bold text-[#00FF41]">&gt; PANEL_PRINCIPAL</h2>
              <AuthHeader
                isLoggedIn={isLoggedIn}
                userEmail={userEmail}
                onLoginSuccess={handleLoginSuccess}
                onLogout={handleLogout}
              />
            </div>

            {/* Mis Reservas Panel (Moved here for mobile visibility) */}
            <div className="mb-8 w-full xl:max-w-2xl">
              <MyBookingsPanel isLoggedIn={isLoggedIn} onSessionExpired={handleSessionExpired} />
            </div>

            <LibraryMap isLoggedIn={isLoggedIn} onSessionExpired={handleSessionExpired} />
          </div>
        </div>
      </main>
    </div>
  );
}
