'use client';

import { useState } from 'react';

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
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#00FF41] mb-1 uppercase tracking-wider">
                    CORREO_UCAM
                </label>
                <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@ucam.edu"
                    className="w-full bg-[#050505] border border-[#00FF41]/40 px-3 py-2 text-sm text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:border-[#00FF41]"
                    required
                />
            </div>
            <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#00FF41] mb-1 uppercase tracking-wider">
                    CONTRASEÑA_TAKEASPOT
                </label>
                <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#050505] border border-[#00FF41]/40 px-3 py-2 text-sm text-[#E0E0E0] placeholder-[#666666] focus:outline-none focus:border-[#00FF41]"
                    required
                />
            </div>

            {error && (
                <p className="text-[#FF003C] text-xs bg-transparent border border-[#FF003C] px-3 py-2">
                    [ERR] {error}
                </p>
            )}

            <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-transparent border border-[#00FF41] hover:bg-[#00FF41] hover:text-[#050505] disabled:border-[#666666] disabled:text-[#666666] text-[#00FF41] font-semibold px-4 py-2.5 text-sm glow-green flex items-center justify-center gap-2"
            >
                {isLoading ? (
                    <>
                        <span className="h-4 w-4 border-2 border-[#00FF41]/30 border-t-[#00FF41] animate-spin" />
                        INICIANDO SESIÓN...
                    </>
                ) : (
                    '[ INICIAR_SESIÓN ]'
                )}
            </button>
        </form>
    );
}
