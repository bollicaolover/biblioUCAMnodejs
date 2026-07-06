'use client';

import { useState, useRef, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

interface AuthNavBarProps {
    isLoggedIn: boolean;
    userEmail: string | null;
    onLoginSuccess: (email: string) => void;
    onLogout: () => void;
}

export function AuthNavBar({ isLoggedIn, userEmail, onLoginSuccess, onLogout }: AuthNavBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initial = userEmail ? userEmail[0].toUpperCase() : '?';

    return (
        <div className="flex items-center justify-end w-full relative z-40 bg-[#0a0a0a] border-b border-[#00FF41]/30 px-4 py-3 lg:hidden sm:flex" style={{ display: 'none' }}>
        </div>
    );
}

// AuthHeader for floating/inline usage
export function AuthHeader({ isLoggedIn, userEmail, onLoginSuccess, onLogout }: AuthNavBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const popoverRef = useRef<HTMLDivElement>(null);

    const toggleOpen = () => setIsOpen(!isOpen);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const initial = userEmail ? userEmail[0].toUpperCase() : '?';

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={toggleOpen}
                className="flex items-center justify-center w-10 h-10 border border-[#00FF41]/40 hover:border-[#00FF41] bg-[#0a0a0a] hover:bg-[#00FF41]/10 focus:outline-none"
                aria-label="Perfil de usuario"
            >
                {isLoggedIn ? (
                    <span className="h-full w-full bg-[#00FF41] flex items-center justify-center text-sm font-bold text-[#050505]">
                        {initial}
                    </span>
                ) : (
                    <span className="text-[#00FF41] text-lg">⊡</span>
                )}
            </button>

            {/* Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-[#0a0a0a] border border-[#00FF41] p-4 origin-top-right z-50">
                    {isLoggedIn ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 border-b border-[#00FF41]/30 pb-3">
                                <span className="h-10 w-10 bg-[#00FF41] flex items-center flex-shrink-0 justify-center text-lg font-bold text-[#050505]">
                                    {initial}
                                </span>
                                <div className="overflow-hidden">
                                    <p className="text-[#00FF41] text-sm font-bold truncate" title={userEmail || ''}>{userEmail}</p>
                                    <p className="text-[#00FF41]/60 text-xs font-semibold flex items-center gap-1">[OK] SESIÓN ACTIVA</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    onLogout();
                                    setIsOpen(false);
                                }}
                                className="w-full text-sm text-[#FF003C] font-medium bg-transparent hover:bg-[#FF003C] hover:text-[#050505] border border-[#FF003C] py-2 text-center"
                            >
                                [ CERRAR_SESIÓN ]
                            </button>
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-[#00FF41] font-bold text-sm mb-3">&gt; INICIAR_SESIÓN</h2>
                            <LoginForm
                                onLoginSuccess={(email) => {
                                    onLoginSuccess(email);
                                    setIsOpen(false);
                                }}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
