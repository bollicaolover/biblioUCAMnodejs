import { NextRequest, NextResponse } from 'next/server';
import { getAppSession, switchActiveAccount, removeAccount } from '@/lib/takeaspot/session';

export async function GET() {
    try {
        const session = await getAppSession();
        if (!session.accounts || Object.keys(session.accounts).length === 0) {
            return NextResponse.json({ activeEmail: null, accounts: [] });
        }

        const publicEmail = process.env.PUBLIC_UCAM_EMAIL;
        const accountsList = Object.keys(session.accounts).filter(email => email !== publicEmail);

        return NextResponse.json({
            activeEmail: session.activeEmail !== publicEmail ? session.activeEmail : null,
            accounts: accountsList,
        });
    } catch {
        return NextResponse.json({ error: 'Error al obtener cuentas' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json() as { action?: string; email?: string };
        const { action, email } = body;

        if (!email || !action) {
            return NextResponse.json({ error: 'La acción y el correo son obligatorios' }, { status: 400 });
        }

        if (action === 'switch') {
            const success = await switchActiveAccount(email);
            if (!success) {
                return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 });
            }
            return NextResponse.json({ ok: true, activeEmail: email });
        }

        if (action === 'remove') {
            await removeAccount(email);
            const updatedSession = await getAppSession();
            const publicEmail = process.env.PUBLIC_UCAM_EMAIL;
            const remainingAccounts = updatedSession.accounts
                ? Object.keys(updatedSession.accounts).filter(e => e !== publicEmail)
                : [];

            return NextResponse.json({
                ok: true,
                activeEmail: updatedSession.activeEmail !== publicEmail ? updatedSession.activeEmail : null,
                accounts: remainingAccounts
            });
        }

        return NextResponse.json({ error: 'Acción inválida' }, { status: 400 });
    } catch {
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
