'use client';

import { useState, useRef, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { trackAccountSwitch } from '@/lib/analytics/events';

interface AuthNavBarProps {
    isLoggedIn: boolean;
    userEmail: string | null;
    onLoginSuccess: (email: string) => void;
    onLogout: () => void;
}

export function AuthNavBar(_props: AuthNavBarProps) {
    return <div style={{ display: 'none' }} />;
}

const btnMatteNavy =
    'text-xs font-semibold rounded-lg py-2 transition-colors border bg-white/5';
const btnMatteNavyPrimary = `${btnMatteNavy} text-white border-white/50 hover:bg-white hover:text-[#002855]`;
const btnMatteNavyDanger = `${btnMatteNavy} text-red-300 border-red-400/60 hover:bg-[#DC2626] hover:text-white hover:border-[#DC2626]`;
const btnMatteNavySm =
    'text-xs font-semibold rounded-md px-2 py-0.5 transition-colors border bg-white/5';
const btnMatteNavySmPrimary = `${btnMatteNavySm} text-white/80 border-white/40 hover:bg-white hover:text-[#002855]`;
const btnMatteNavySmDanger = `${btnMatteNavySm} text-red-300 border-red-400/50 hover:bg-[#DC2626] hover:text-white hover:border-[#DC2626]`;

// ─── Panel lateral (desktop sidebar) ───────────────────────────────────────
export function SidebarUserPanel({ isLoggedIn, userEmail, onLoginSuccess, onLogout }: AuthNavBarProps) {
    const [accounts, setAccounts] = useState<string[]>([]);
    const [isAdding, setIsAdding] = useState(false);

    useEffect(() => {
        if (isLoggedIn) fetchAccounts();
    }, [isLoggedIn, userEmail]);

    async function fetchAccounts() {
        try {
            const res = await fetch('/api/auth/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch { /* silent */ }
    }

    async function switchAccount(email: string) {
        try {
            const res = await fetch('/api/auth/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'switch', email }),
            });
            if (res.ok) {
                trackAccountSwitch();
                onLoginSuccess(email);
            }
        } catch { /* silent */ }
    }

    async function removeAccount(email: string) {
        try {
            const res = await fetch('/api/auth/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove', email }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.activeEmail) {
                    trackAccountSwitch();
                    onLoginSuccess(data.activeEmail);
                } else {
                    onLogout();
                }
            }
        } catch { /* silent */ }
    }

    const initial = userEmail ? userEmail[0].toUpperCase() : '?';
    const otherAccounts = accounts.filter(acc => acc !== userEmail);

    if (!isLoggedIn) {
        return (
            <div className="bg-white/10 rounded-xl border border-white/15 p-4 flex flex-col gap-3">
                <p className="text-white font-semibold text-sm">Iniciar sesión</p>
                <p className="text-white/50 text-xs -mt-1">Accede con tu cuenta UCAM</p>
                <LoginForm onLoginSuccess={onLoginSuccess} theme="dark" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Active account chip */}
            <div className="bg-white/10 rounded-xl border border-white/15 p-3 flex items-center gap-3">
                <span className="h-9 w-9 bg-white rounded-full flex items-center flex-shrink-0 justify-center text-sm font-bold text-[#002855]">
                    {initial}
                </span>
                <div className="overflow-hidden flex-1">
                    <p className="text-white text-sm font-semibold truncate" title={userEmail || ''}>{userEmail}</p>
                    <p className="text-white/50 text-xs flex items-center gap-1 mt-0.5">
                        <span className="w-1.5 h-1.5 bg-[#4ADE80] rounded-full inline-block" />
                        Sesión activa
                    </p>
                </div>
            </div>

            {/* Other accounts */}
            {otherAccounts.length > 0 && (
                <div className="flex flex-col gap-1">
                    {otherAccounts.map(acc => (
                        <div key={acc} className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors">
                            <span className="text-white/70 text-xs truncate max-w-[120px]">{acc}</span>
                            <div className="flex gap-2 flex-shrink-0">
                                <button type="button" onClick={() => switchAccount(acc)} className={btnMatteNavySmPrimary}>Usar</button>
                                <button type="button" onClick={() => removeAccount(acc)} className={btnMatteNavySmDanger} aria-label="Eliminar cuenta">×</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add account / logout */}
            {isAdding ? (
                <div className="bg-white/10 rounded-xl border border-white/15 p-3 flex flex-col gap-2">
                    <p className="text-white/80 text-xs font-semibold uppercase tracking-wider">Nueva cuenta</p>
                    <LoginForm
                        theme="dark"
                        onLoginSuccess={(email) => { fetchAccounts(); setIsAdding(false); onLoginSuccess(email); }}
                    />
                    <button type="button" onClick={() => setIsAdding(false)} className={`w-full ${btnMatteNavyPrimary}`}>Cancelar</button>
                </div>
            ) : (
                <div className="flex gap-2">
                    {accounts.length < 4 && (
                        <button
                            type="button"
                            onClick={() => setIsAdding(true)}
                            className={`flex-1 ${btnMatteNavyPrimary}`}
                        >
                            + Añadir cuenta
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onLogout}
                        className={`flex-1 ${btnMatteNavyDanger}`}
                    >
                        Cerrar sesión
                    </button>
                </div>
            )}
        </div>
    );
}

// ─── Botón flotante para mobile (header) ────────────────────────────────────
export function AuthHeader({ isLoggedIn, userEmail, onLoginSuccess, onLogout }: AuthNavBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [accounts, setAccounts] = useState<string[]>([]);

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

    useEffect(() => {
        if (isOpen && isLoggedIn) fetchAccounts();
        else setIsAdding(false);
    }, [isOpen, isLoggedIn, userEmail]);

    async function fetchAccounts() {
        try {
            const res = await fetch('/api/auth/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch { /* silent */ }
    }

    async function switchAccount(email: string) {
        try {
            const res = await fetch('/api/auth/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'switch', email }),
            });
            if (res.ok) {
                trackAccountSwitch();
                onLoginSuccess(email);
                setIsOpen(false);
            }
        } catch { /* silent */ }
    }

    async function removeAccount(email: string) {
        try {
            const res = await fetch('/api/auth/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove', email }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data.activeEmail) {
                    trackAccountSwitch();
                    onLoginSuccess(data.activeEmail);
                    fetchAccounts();
                } else {
                    onLogout();
                    setIsOpen(false);
                }
            }
        } catch { /* silent */ }
    }

    const initial = userEmail ? userEmail[0].toUpperCase() : null;
    const otherAccounts = accounts.filter(acc => acc !== userEmail);

    return (
        <div className="relative" ref={popoverRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-9 h-9 rounded-full overflow-hidden border-2 border-white/30 hover:border-white focus:outline-none transition-colors"
                aria-label="Perfil de usuario"
            >
                {isLoggedIn && initial ? (
                    <span className="h-full w-full bg-white flex items-center justify-center text-sm font-bold text-[#002855]">
                        {initial}
                    </span>
                ) : (
                    <span className="h-full w-full bg-white/15 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl border border-[#E2E8F0] shadow-xl p-4 z-50">
                    {isLoggedIn ? (
                        <div className="flex flex-col gap-3">
                            {/* Active account */}
                            <div className="flex items-center gap-3 border-b border-[#E2E8F0] pb-3">
                                <span className="h-10 w-10 bg-[#002855] rounded-full flex items-center flex-shrink-0 justify-center font-bold text-white">
                                    {initial}
                                </span>
                                <div className="overflow-hidden">
                                    <p className="text-[#1E2940] text-sm font-semibold truncate">{userEmail}</p>
                                    <p className="text-[#16A34A] text-xs font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-[#16A34A] rounded-full inline-block" />
                                        Sesión activa
                                    </p>
                                </div>
                            </div>

                            {/* Other accounts */}
                            {otherAccounts.length > 0 && (
                                <div className="flex flex-col gap-1.5 border-b border-[#E2E8F0] pb-3">
                                    <span className="text-[#64748B] text-xs font-semibold uppercase tracking-wider">Otras cuentas</span>
                                    {otherAccounts.map(acc => (
                                        <div key={acc} className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC]">
                                            <span className="text-[#1E2940] text-xs truncate max-w-[150px]">{acc}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => switchAccount(acc)} className="text-[#002855] hover:underline text-xs font-semibold">Usar</button>
                                                <button onClick={() => removeAccount(acc)} className="text-[#DC2626] hover:underline text-xs font-semibold">×</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Actions */}
                            {isAdding ? (
                                <div className="border border-[#E2E8F0] rounded-xl p-3 bg-[#F8FAFC]">
                                    <p className="text-xs font-semibold text-[#002855] mb-3 uppercase tracking-wider">Nueva cuenta</p>
                                    <LoginForm onLoginSuccess={(email) => {
                                        fetchAccounts();
                                        setIsAdding(false);
                                        onLoginSuccess(email);
                                    }} />
                                    <button onClick={() => setIsAdding(false)} className="mt-2 text-xs text-[#64748B] hover:text-[#DC2626] w-full text-center py-1">Cancelar</button>
                                </div>
                            ) : (
                                <>
                                    {accounts.length < 4 && (
                                        <button onClick={() => setIsAdding(true)} className="w-full text-xs text-[#002855] font-semibold border border-[#002855] bg-white hover:bg-[#002855] hover:text-white rounded-lg py-2 transition-colors">
                                            + Añadir cuenta
                                        </button>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={() => removeAccount(userEmail!)} className="flex-1 text-xs text-[#DC2626] font-semibold bg-white hover:bg-[#DC2626] hover:text-white border border-[#DC2626] rounded-lg py-2 transition-colors">
                                            Cerrar esta sesión
                                        </button>
                                        <button onClick={() => { onLogout(); setIsOpen(false); }} className="flex-1 text-xs text-white font-semibold bg-[#DC2626] hover:bg-[#B91C1C] border border-[#DC2626] rounded-lg py-2 transition-colors">
                                            Cerrar todas
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div>
                            <h2 className="text-[#002855] font-bold text-sm mb-4">Iniciar sesión</h2>
                            <LoginForm onLoginSuccess={(email) => { onLoginSuccess(email); setIsOpen(false); }} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
