'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function Header() {
  const pathname = usePathname();
  const navLinks = [
    { href: '/', label: 'Accueil' },
    { href: '/create', label: 'Créer un sondage' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-lg border-b border-charcoal-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 text-xl font-bold text-charcoal-900 hover:text-primary-500 transition-colors">
            {/* Nutanix-style logo */}
            <div className="w-8 h-8 bg-nutanix rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">N</span>
            </div>
            <span className="hidden sm:inline">Nutanix RealTime Poll</span>
            <span className="sm:hidden">NTP</span>
          </Link>
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'px-4 py-2 rounded-lg font-medium transition-all duration-200',
                    isActive 
                      ? 'bg-primary-500 text-white' 
                      : 'text-charcoal-700 hover:bg-charcoal-50 hover:text-charcoal-900'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}

export default Header;
