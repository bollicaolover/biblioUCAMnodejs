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
                className="password-help-btn ucam-help-btn"
                aria-label="Ayuda sobre la contraseña TakeASpot"
                aria-expanded={open}
            >
                ?
            </button>
            {open && (
                <div
                    role="dialog"
                    className="absolute left-0 top-full z-50 mt-2 w-64 rounded-lg border border-[var(--ucam-border-light)] bg-white p-3 text-xs leading-relaxed text-[var(--ucam-text)] shadow-lg"
                >
                    <p>
                        Si no tienes contraseña TakeASpot, ve a{' '}
                        <a
                            href={TAKEASPOT_RESET_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ucam-link"
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
    /** 'dark' para el panel del sidebar navy; 'light' para modal móvil */
    theme?: 'light' | 'dark';
}

export function LoginForm({ onLoginSuccess, theme = 'light' }: LoginFormProps) {
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

    const isDark = theme === 'dark';

    return (
        <form
            onSubmit={handleSubmit}
            className={`flex flex-col gap-4 ${isDark ? 'login-form-dark' : ''}`}
        >
            <div>
                <label htmlFor="email" className="ucam-label block mb-1.5">
                    Correo UCAM
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ucam.edu"
                    className="ucam-input"
                    required
                />
            </div>
            <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                    <PasswordHelpButton />
                    <label htmlFor="password" className="ucam-label">
                        Contraseña TakeASpot
                    </label>
                </div>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="ucam-input"
                    required
                />
            </div>

            {error && (
                <p className="text-[var(--ucam-red)] text-xs bg-[#FEF2F2] border border-[#FECACA] rounded-lg px-3 py-2.5">
                    {error}
                </p>
            )}

            <button type="submit" disabled={isLoading} className="ucam-btn-primary flex items-center justify-center gap-2">
                {isLoading ? (
                    <>
                        <span
                            className={`h-4 w-4 border-2 animate-spin rounded-full ${isDark ? 'border-white/30 border-t-white' : 'border-[var(--ucam-navy)]/30 border-t-[var(--ucam-navy)]'}`}
                        />
                        Iniciando sesión...
                    </>
                ) : (
                    'Iniciar sesión'
                )}
            </button>
        </form>
    );
}
