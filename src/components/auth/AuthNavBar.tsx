'use client';

import { useState, useRef, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';

interface AuthNavBarProps {
    isLoggedIn: boolean;
    userEmail: string | null;
    onLoginSuccess: (email: string) => void;
    onLogout: () => void;
}

export function AuthNavBar(_props: AuthNavBarProps) {
    // Hidden component unused but kept for backwards compatibility
    return (
        <div className="flex items-center justify-end w-full relative z-40 bg-[#0a0a0a] border-b border-[#00FF41]/30 px-4 py-3 lg:hidden sm:flex" style={{ display: 'none' }}>
        </div>
    );
}

// AuthHeader for floating/inline usage
export function AuthHeader({ isLoggedIn, userEmail, onLoginSuccess, onLogout }: AuthNavBarProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [isAdding, setIsAdding] = useState(false);
    const [accounts, setAccounts] = useState<string[]>([]);
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false);

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

    useEffect(() => {
        if (isOpen && isLoggedIn) {
            fetchAccounts();
        } else {
            setIsAdding(false);
        }
    }, [isOpen, isLoggedIn, userEmail]);

    async function fetchAccounts() {
        setIsLoadingAccounts(true);
        try {
            const res = await fetch('/api/auth/accounts');
            if (res.ok) {
                const data = await res.json();
                setAccounts(data.accounts || []);
            }
        } catch (e) {
            console.error('Failed to fetch accounts', e);
        } finally {
            setIsLoadingAccounts(false);
        }
    }

    async function switchAccount(email: string) {
        try {
            const res = await fetch('/api/auth/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'switch', email })
            });
            if (res.ok) {
                onLoginSuccess(email); // Update parent state
                setIsOpen(false);
            }
        } catch (e) {
            console.error('Failed to switch account', e);
        }
    }

    async function removeAccount(email: string) {
        try {
            const res = await fetch('/api/auth/accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'remove', email })
            });
            if (res.ok) {
                const data = await res.json();
                if (data.activeEmail) {
                    if (data.activeEmail !== userEmail) {
                        onLoginSuccess(data.activeEmail);
                    } else {
                        fetchAccounts(); // just refresh list if we deleted a non-active
                    }
                } else {
                    onLogout(); // No accounts left
                    setIsOpen(false);
                }
            }
        } catch (e) {
            console.error('Failed to remove account', e);
        }
    }

    async function handleLogoutAll() {
        onLogout();
        setIsOpen(false);
    }

    async function handleLogoutCurrent() {
        if (userEmail) {
            await removeAccount(userEmail);
        }
    }

    const initial = userEmail ? userEmail[0].toUpperCase() : '?';
    const otherAccounts = accounts.filter(acc => acc !== userEmail);

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
                <div className="absolute right-0 mt-2 w-72 bg-[#0a0a0a] border border-[#00FF41] p-4 origin-top-right z-50 overflow-hidden shadow-[0_0_15px_rgba(0,255,65,0.2)]">
                    {isLoggedIn ? (
                        <div className="flex flex-col gap-3">
                            {/* Active Account */}
                            <div className="flex items-center gap-3 border-b border-[#00FF41]/30 pb-3">
                                <span className="h-10 w-10 bg-[#00FF41] flex items-center flex-shrink-0 justify-center text-lg font-bold text-[#050505]">
                                    {initial}
                                </span>
                                <div className="overflow-hidden">
                                    <p className="text-[#00FF41] text-sm font-bold truncate" title={userEmail || ''}>{userEmail}</p>
                                    <p className="text-[#00FF41]/60 text-xs font-semibold flex items-center gap-1">[OK] SESIÓN ACTIVA</p>
                                </div>
                            </div>

                            {/* Other Accounts List */}
                            {!isLoadingAccounts && otherAccounts.length > 0 && (
                                <div className="flex flex-col gap-2 border-b border-[#00FF41]/30 pb-3">
                                    <span className="text-[#00FF41]/60 text-xs font-bold">&gt; OTRAS_CUENTAS</span>
                                    {otherAccounts.map(acc => (
                                        <div key={acc} className="flex items-center justify-between text-sm py-1 px-2 border border-[#00FF41]/10 hover:border-[#00FF41]/40 bg-[#050505]">
                                            <span className="text-[#E0E0E0] text-xs truncate max-w-[130px]" title={acc}>{acc}</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => switchAccount(acc)} className="text-[#00FF41] hover:text-[#00FF41] hover:underline text-[10px] font-bold">SEL</button>
                                                <button onClick={() => removeAccount(acc)} className="text-[#FF003C] hover:text-[#FF003C] hover:underline text-[10px] font-bold">DEL</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add Account / Actions */}
                            {isAdding ? (
                                <div className="border border-[#00FF41]/50 p-3 bg-[#00FF41]/5 mt-1">
                                    <h3 className="text-xs font-bold text-[#00FF41] mb-2 tracking-wider">&gt; NUEVA_CUENTA</h3>
                                    <LoginForm onLoginSuccess={(email) => {
                                        fetchAccounts();
                                        setIsAdding(false);
                                        onLoginSuccess(email);
                                    }} />
                                    <button onClick={() => setIsAdding(false)} className="mt-2 text-xs text-[#FF003C] hover:underline w-full text-center font-bold">
                                        [ CANCELAR ]
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {accounts.length < 4 && (
                                        <button
                                            onClick={() => setIsAdding(true)}
                                            className="w-full text-xs text-[#00FF41] font-bold border border-[#00FF41]/40 py-2 hover:bg-[#00FF41]/10 tracking-widest"
                                        >
                                            + AÑADIR CUENTA
                                        </button>
                                    )}
                                    <div className="flex gap-2 pt-2">
                                        <button
                                            onClick={handleLogoutCurrent}
                                            className="w-1/2 text-[10px] text-[#FF003C] font-bold bg-transparent hover:bg-[#FF003C]/10 border border-[#FF003C]/50 py-2 text-center"
                                            title="Cerrar la cuenta actual"
                                        >
                                            [ LOGOUT CUR. ]
                                        </button>
                                        <button
                                            onClick={handleLogoutAll}
                                            className="w-1/2 text-[10px] text-[#050505] font-bold bg-[#FF003C] hover:bg-transparent hover:text-[#FF003C] border border-[#FF003C] py-2 text-center transition-colors"
                                            title="Cerrar TODAS las cuentas"
                                        >
                                            [ LOGOUT ALL ]
                                        </button>
                                    </div>
                                </>
                            )}
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
