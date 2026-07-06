import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'TakiSpot',
  description: 'Reserva de mesas de biblioteca. Visualiza la disponibilidad en tiempo real y reserva tu mesa.',
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-[#F2F5F9] text-[#1E2940]">
        {children}
      </body>
    </html>
  );
}
