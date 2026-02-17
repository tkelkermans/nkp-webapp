import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/Providers';
import { Header } from '@/components/Header';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Nutanix RealTime Poll - Sondages en Temps Réel',
  description: 'Créez et partagez des sondages avec des résultats en temps réel. Application de démonstration Kubernetes par Nutanix.',
  keywords: ['nutanix', 'sondage', 'vote', 'temps réel', 'kubernetes', 'demo'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-white min-h-screen`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8">
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <footer className="py-6 text-center text-sm text-charcoal-500 border-t border-charcoal-100 bg-charcoal-50">
              <div className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 bg-nutanix rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">N</span>
                </div>
                <span>Nutanix RealTime Poll — Démonstration Kubernetes</span>
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
