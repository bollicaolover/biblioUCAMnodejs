import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reservas Biblioteca UCAM',
  description: 'Sistema de reserva de mesas para la Biblioteca de la UCAM. Visualiza la disponibilidad en tiempo real y reserva tu mesa.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#050505] text-[#E0E0E0]">
        {children}
      </body>
    </html>
  );
}
