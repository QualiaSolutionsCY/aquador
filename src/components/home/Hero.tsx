'use client';

import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { ParallaxSection } from '@/components/ui/ParallaxSection';
import { cinematicVariants, revealVariants } from '@/lib/animations/cinematic';
import { useAnimationBudget } from '@/lib/performance/animation-budget';
import { useState, useRef } from 'react';

export default function Hero() {
  const [videoError, setVideoError] = useState(false);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { amount: 0.1 });
  const { shouldUseSimplifiedAnimations } = useAnimationBudget();

  return (
    <motion.section
      className="relative min-h-screen flex flex-col overflow-hidden"
      variants={shouldUseSimplifiedAnimations ? cinematicVariants.simpleFade : cinematicVariants.heroEntry}
      initial="initial"
      animate="animate"
    >
      {/* Main Hero Content */}
      <div ref={sectionRef} className="relative flex-1 flex items-center justify-center pt-24">
        {/* Video Background */}
        <ParallaxSection speed={0.25} className="absolute inset-0 z-0">
          {!videoError ? (
            <video
              autoPlay
              muted
              loop
              playsInline
              poster="/images/aquadour1.jpg"
              className="absolute w-full h-full object-cover"
              style={{ filter: 'brightness(0.25) saturate(0.7) contrast(1.1)' }}
              onError={() => setVideoError(true)}
            >
              <source
                src="https://static1.squarespace.com/static/66901f0f8865462c0ac066ba/t/6899a19131e4b55cddf56fb2/1754898858755/download+%2820%29.mp4"
                type="video/mp4"
              />
            </video>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-black via-[#0d0d0d] to-black" />
          )}

          {/* Multi-layer gradient for cinematic depth */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black" />
          <div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%)',
            }}
          />
        </ParallaxSection>

        {/* Ambient gold glow — slow-breathing center light */}
        <ParallaxSection speed={0.45} className="absolute inset-0 z-0 pointer-events-none gpu-accelerated">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(212,175,55,0.04) 0%, transparent 70%)',
              filter: 'blur(40px)',
            }}
            animate={isInView ? {
              scale: [1, 1.08, 1],
              opacity: [0.6, 1, 0.6],
            } : { scale: 1, opacity: 0.6 }}
            transition={isInView ? {
              duration: 8,
              repeat: Infinity,
              ease: 'easeInOut',
            } : { duration: 0 }}
          />
        </ParallaxSection>

        {/* Content — centered with generous vertical breathing room */}
        <motion.div
          className="relative z-10 text-center container-wide py-20 md:py-32 lg:py-40"
          variants={revealVariants.fadeInSequence}
          initial="initial"
          animate="animate"
        >
          {/* Magazine masthead — running-head replaces the centered wordmark.
              Same voice as the maintenance page: place + year set in
              tracked-out micro-cap, gold-on-bone hierarchy with the brand
              foregrounded and metadata receding. */}
          <motion.h1
            className="flex items-center justify-center gap-3 text-[10px] sm:text-[11px] uppercase tracking-[0.45em] font-light mb-14 md:mb-20 m-0"
            aria-label="Aquad'or, Nicosia, MMXXVI"
            variants={revealVariants.fadeInSequence}
          >
            <span className="text-gold/75">AQUAD&apos;OR</span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span className="text-white/55">Nicosia</span>
            <span className="text-white/20" aria-hidden="true">·</span>
            <span className="text-white/55">MMXXVI</span>
          </motion.h1>

          {/* Refined separator */}
          <motion.div
            className="relative flex items-center justify-center gap-3 mb-14 md:mb-20"
            variants={revealVariants.fadeInSequence}
          >
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-gold/40" />
            <div className="w-1 h-1 rounded-full bg-gold/60" />
            <div className="w-24 h-px bg-gradient-to-r from-gold/40 via-gold/70 to-gold/40" />
            <div className="w-1 h-1 rounded-full bg-gold/60" />
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-gold/40" />
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            variants={revealVariants.fadeInSequence}
          >
            <Link href="/shop">
              <Button size="lg" className="min-w-[200px]">
                Explore Collection
              </Button>
            </Link>
            <Link href="/create-perfume">
              <Button variant="outline" size="lg" className="min-w-[200px]">
                Create Your Own
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom vignette edge */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent z-[1]" />
    </motion.section>
  );
}
