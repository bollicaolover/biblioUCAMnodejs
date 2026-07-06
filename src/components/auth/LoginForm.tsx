'use client';

import { useState, useRef, useEffect } from 'react';

const TAKEASPOT_RESET_URL = 'https://app.takeaspot.net/password/reset';

function PasswordHelpButton() {
    const [open, setOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    return (
        <div className="relative shrink-0" ref={containerRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="password-help-btn flex h-4 w-4 items-center justify-center rounded-full border border-[#94A3B8] text-[10px] font-bold leading-none text-[#64748B] hover:border-[#0057A8] hover:text-[#0057A8] transition-colors"
                aria-label="Ayuda sobre la contraseña TakeASpot"
                aria-expanded={open}
            >
                ?
            </button>
            {open && (
                <div
                    role="dialog"
                    className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-[#E2E8F0] bg-white p-3 text-xs leading-relaxed text-[#1E2940] shadow-lg"
                >
                    <p>
                        Si no tienes contraseña TakeASpot, ve a{' '}
                        <a
                            href={TAKEASPOT_RESET_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#0057A8] font-semibold hover:underline"
                        >
                            este enlace
                        </a>
                        {' '}para crear una.
                    </p>
                </div>
            )}
        </div>
    );
}

interface LoginFormProps {
    onLoginSuccess: (email: string) => void;
}

export function LoginForm({ onLoginSuccess }: LoginFormProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email || !password) return;

        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await res.json() as { ok: boolean; error?: string; email?: string };

            if (data.ok && data.email) {
                onLoginSuccess(data.email);
            } else {
                setError(data.error ?? 'Error al iniciar sesión.');
            }
        } catch {
            setError('Error de red. Verifica tu conexión.');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#002855] mb-1.5 uppercase tracking-wider">
                    Correo UCAM
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ucam.edu"
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-sm text-[#1E2940] placeholder-[#94A3B8] focus:outline-none focus:border-[#0057A8] focus:ring-2 focus:ring-[#0057A8]/20 transition-colors"
                    required
                />
            </div>
            <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <PasswordHelpButton />
                    <label htmlFor="password" className="text-xs font-semibold text-[#002855] uppercase tracking-wider">
                        Contraseña TakeASpot
                    </label>
                </div>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white border border-[#CBD5E1] rounded-lg px-3 py-2.5 text-sm text-[#1E2940] placeholder-[#94A3B8] focus:outline-none focus:border-[#0057A8] focus:ring-2 focus:ring-[#0057A8]/20 transition-colors"
                    required
                />
            </div>

            {error && (
                <p className="text-[#DC2626] text-xs bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2.5">
                    {error}
                </p>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0057A8] hover:bg-[#004A8F] disabled:bg-[#94A3B8] text-white font-semibold px-4 py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
            >
                {isLoading ? (
                    <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                        Iniciando sesión...
                    </>
                ) : (
                    'Iniciar sesión'
                )}
            </button>
        </form>
    );
}
