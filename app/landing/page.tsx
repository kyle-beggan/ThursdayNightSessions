'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary selection:text-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 relative">
              <Image 
                src="/logo.png" 
                alt="Sleepy Hollows logo" 
                fill 
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold tracking-tighter uppercase">Sleepy Hollows</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
            <Link href="#about" className="hover:text-white transition-colors">About</Link>
            <Link href="#studio" className="hover:text-white transition-colors">The Studio</Link>
            <Link href="#contact" className="hover:text-white transition-colors">Contact</Link>
            <Link 
              href="https://tns.sleepyhollows.com" 
              className="px-5 py-2.5 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-all active:scale-95"
            >
              Portal Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <Image
            src="/images/landing-hero.png"
            alt="Sleepy Hollows Recording Studio"
            fill
            className="object-cover opacity-60 scale-105 animate-slow-zoom"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-4xl">
          <h1 className="text-5xl md:text-8xl font-black tracking-tightest uppercase mb-6 leading-[0.9]">
            Sleepy <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-neutral-200 to-neutral-500">
              Hollows
            </span>
          </h1>
          <p className="text-lg md:text-2xl text-white/70 mb-10 max-w-2xl mx-auto font-light leading-relaxed">
            A premium sanctuary for creativity, precision, and soul. Located in the heart of the valley.
          </p>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4">
            <Link 
              href="#contact" 
              className="w-full md:w-auto px-8 py-4 bg-white text-black rounded-full font-bold text-lg hover:bg-neutral-200 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all active:scale-95"
            >
              Book a Session
            </Link>
            <Link 
              href="https://tns.sleepyhollows.com" 
              className="w-full md:w-auto px-8 py-4 bg-black/40 backdrop-blur-md border border-white/20 text-white rounded-full font-bold text-lg hover:bg-white/10 transition-all active:scale-95"
            >
              Thursday Night Sessions
            </Link>
          </div>
        </div>
        
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-40">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </header>

      {/* Stats/About Section */}
      <section id="about" className="py-32 px-6 bg-black relative">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-8">Crafting your sound with obsession.</h2>
              <p className="text-white/60 text-lg leading-relaxed mb-6">
                Established in 2024, Sleepy Hollows Studios provides world-class recording, mixing, and mastering services for artists who demand nothing but excellence.
              </p>
              <div className="grid grid-cols-2 gap-8 mt-12">
                <div>
                  <h3 className="text-3xl font-black text-white">48+</h3>
                  <p className="text-white/40 uppercase text-xs tracking-widest font-bold">Channels of Analog</p>
                </div>
                <div>
                  <h3 className="text-3xl font-black text-white">100%</h3>
                  <p className="text-white/40 uppercase text-xs tracking-widest font-bold">Vibration Control</p>
                </div>
              </div>
            </div>
            <div className="relative aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
              <div className="absolute inset-0 bg-neutral-900 animate-pulse" />
              <Image
                src="/images/landing-hero.png"
                alt="Equipment"
                fill
                className="object-cover grayscale hover:grayscale-0 transition-all duration-700 hover:scale-110"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-32 px-6 border-t border-white/10">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-5xl font-black mb-6 uppercase">Ready to create?</h2>
          <p className="text-white/60 mb-12 text-xl font-light">
            Contact us today for rates and availability.
          </p>
          <a 
            href="mailto:contact@sleepyhollows.com" 
            className="text-2xl md:text-4xl font-bold border-b-4 border-white pb-2 hover:text-white/70 hover:border-white/50 transition-all"
          >
            hello@sleepyhollows.com
          </a>
        </div>
      </section>

      <footer className="py-20 px-6 border-t border-white/5 text-white/30 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3 grayscale opacity-50">
             <Image src="/logo.png" alt="Logo" width={30} height={30} />
             <span className="font-bold uppercase tracking-widest text-[10px]">Sleepy Hollows Studios</span>
          </div>
          <p>© 2024 Sleepy Hollows Studios. All Rights Reserved.</p>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s infinite alternate ease-in-out;
        }
      `}</style>
    </div>
  );
}
