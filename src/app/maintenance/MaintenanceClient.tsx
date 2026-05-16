'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

const ACCESS_CODE = '516278';

function setCookie(name: string, value: string, days: number) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

export default function MaintenanceClient() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim() === ACCESS_CODE) {
      setCookie('aq_access', '1', 30);
      router.push('/');
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  if (showLogin) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#FAFAF8] flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <Image
            src="/aquador.webp"
            alt="Aquad'or"
            width={200}
            height={60}
            className="mx-auto mb-10 h-16 w-auto"
          />
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter access code"
              className={`w-full px-5 py-3 text-center text-lg tracking-[0.3em] bg-white border rounded-xl outline-none transition-all duration-300 font-[family-name:var(--font-poppins)] ${
                error
                  ? 'border-red-400 text-red-500'
                  : 'border-gray-200 focus:border-[#D4AF37] text-black'
              }`}
              autoFocus
            />
            <button
              type="submit"
              className="w-full py-3 bg-black text-white text-sm uppercase tracking-[0.15em] rounded-xl hover:bg-gray-900 transition-colors font-[family-name:var(--font-poppins)]"
            >
              Enter
            </button>
          </form>
          <button
            onClick={() => setShowLogin(false)}
            className="mt-6 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-[#FAFAF8] flex flex-col items-center justify-center px-6 text-center overflow-y-auto">
      {/* Background bottle image — full cover */}
      <Image
        src="/images/aquadour1.jpg"
        alt="Aquad'or signature perfume bottle softly faded into the page background"
        fill
        className="object-cover opacity-[0.07] pointer-events-none select-none"
        priority
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center">

      {/* Logo — 2× size */}
      <Image
        src="/aquador.webp"
        alt="Aquad'or"
        width={640}
        height={192}
        className="h-36 sm:h-44 w-auto mb-12"
        priority
      />

      {/* Decorative line */}
      <div className="w-16 h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mb-10" />

      {/* Heading */}
      <h1
        className="text-3xl sm:text-4xl md:text-5xl tracking-tight mb-5 text-black"
        style={{ fontFamily: 'var(--font-playfair), Georgia, serif' }}
      >
        Something Beautiful
        <br />
        Is On Its Way
      </h1>

      {/* Subtext */}
      <p className="text-gray-500 text-sm sm:text-base max-w-md leading-relaxed mb-10 font-[family-name:var(--font-poppins)]">
        We are crafting a new digital experience to match the luxury of our fragrances.
        Stay connected for the grand reveal.
      </p>

      {/* Instagram CTA */}
      <a
        href="https://www.instagram.com/aquadorfragrances/"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-3 px-8 py-4 bg-black text-white text-xs sm:text-sm uppercase tracking-[0.2em] rounded-xl hover:bg-gray-900 transition-all duration-300 shadow-lg shadow-black/10 hover:shadow-xl font-[family-name:var(--font-poppins)]"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
        </svg>
        Follow Us on Instagram
      </a>

      {/* Login link */}
      <button
        onClick={() => setShowLogin(true)}
        className="mt-16 text-[10px] text-gray-300 hover:text-gray-500 transition-colors tracking-[0.1em] uppercase font-[family-name:var(--font-poppins)]"
      >
        Login with code
      </button>

      {/* Qualia credit */}
      <p className="mt-8 text-[11px] text-gray-400 font-[family-name:var(--font-poppins)]">
        This website is being developed and designed by{' '}
        <a
          href="https://qualiasolutions.net"
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium transition-colors hover:opacity-80"
          style={{ color: '#0D9488' }}
        >
          Qualia Solutions
        </a>
      </p>

      </div>{/* end relative z-10 content wrapper */}
    </div>
  );
}
