'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRef } from 'react';
import { Sparkles, Shield, Award } from 'lucide-react';
import Button from '@/components/ui/Button';
import { AnimatedSection, AnimatedSectionItem } from '@/components/ui/AnimatedSection';
import { ParallaxSection } from '@/components/ui/ParallaxSection';
import { useReducedMotion } from '@/hooks/useReducedMotion';

const features = [
  {
    icon: Sparkles,
    title: 'Personal Service',
    description: 'Tailored consultations',
  },
  {
    icon: Shield,
    title: 'Expert Guidance',
    description: 'Professional advice',
  },
  {
    icon: Award,
    title: 'Exclusive Scents',
    description: 'Rare collections',
  },
];

// Decorative floating gold dots
const particles = [
  { x: '15%', y: '20%', size: 3, duration: 5, delay: 0 },
  { x: '80%', y: '15%', size: 2, duration: 7, delay: 1 },
  { x: '70%', y: '70%', size: 2, duration: 6, delay: 2 },
  { x: '25%', y: '75%', size: 3, duration: 8, delay: 0.5 },
  { x: '90%', y: '45%', size: 1.5, duration: 5.5, delay: 1.5 },
  { x: '10%', y: '55%', size: 2, duration: 7.5, delay: 3 },
];

export default function CTASection() {
  const sectionRef = useRef(null);
  const reducedMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  });
  const contentY = useTransform(scrollYProgress, [0, 1], ['30px', '-30px']);

  return (
    <section ref={sectionRef} className="relative overflow-hidden min-h-[500px] md:min-h-[600px]">
      {/* Background — parallax perfume bottle */}
      <ParallaxSection speed={0.25} className="absolute inset-0">
        <Image
          src="/images/aquadour1.jpg"
          alt="Aquad'or perfume bottle bathed in warm gold light"
          fill
          className="object-cover"
          style={{ filter: 'brightness(0.3) saturate(0.6) contrast(1.1)' }}
          sizes="100vw"
          loading="lazy"
        />
      </ParallaxSection>

      {/* Layered gradient overlays for cinematic depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 70% 80% at 50% 50%, transparent 30%, rgba(0,0,0,0.65) 100%)',
        }}
      />

      {/* Subtle gold vignette center */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(212,175,55,0.04) 0%, transparent 60%)',
        }}
      />

      {/* Floating gold particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gold"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              opacity: 0.2,
            }}
            animate={{
              y: [-10, 10, -10],
              opacity: [0.15, 0.35, 0.15],
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Gold accent lines — top/bottom */}
      <div className="absolute top-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />
      <div className="absolute bottom-0 left-[5%] right-[5%] h-px bg-gradient-to-r from-transparent via-gold/25 to-transparent" />

      {/* Content — generous vertical padding with parallax */}
      <motion.div
        className="relative z-10 container-wide section-lg"
        style={{ y: reducedMotion ? 0 : contentY }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <AnimatedSection variant="fadeInUp">
            <p className="eyebrow text-gold/50 mb-6">Our Boutique</p>
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-gradient-gold mb-6 leading-tight">
              Experience Aquad&apos;or
            </h2>

            {/* Refined separator */}
            <div className="flex items-center justify-center gap-3 mb-7">
              <div className="w-8 h-px bg-gold/30" />
              <div className="w-1 h-1 rounded-full bg-gold/60" />
              <div className="w-16 h-px bg-gold/50" />
              <div className="w-1 h-1 rounded-full bg-gold/60" />
              <div className="w-8 h-px bg-gold/30" />
            </div>

            <p className="text-gray-400 text-base md:text-lg mb-14 max-w-xl mx-auto leading-relaxed">
              Book a personal consultation and discover your perfect scent with our fragrance experts.
            </p>
          </AnimatedSection>

          {/* Features — refined icon treatment */}
          <AnimatedSection variant="stagger" staggerDelay={0.12} className="mb-14">
            <div className="flex flex-wrap justify-center gap-8 md:gap-14">
              {features.map((feature) => (
                <AnimatedSectionItem key={feature.title}>
                  <div className="flex flex-col items-center group">
                    <div className="w-14 h-14 rounded-full border border-gold/20 bg-gold/5 flex items-center justify-center mb-3 transition-all duration-300 group-hover:border-gold/50 group-hover:bg-gold/10">
                      <feature.icon className="w-5 h-5 text-gold" />
                    </div>
                    <h3 className="text-white text-xs font-medium mb-1 tracking-wide">{feature.title}</h3>
                    <p className="text-gray-500 text-[11px] tracking-wide">{feature.description}</p>
                  </div>
                </AnimatedSectionItem>
              ))}
            </div>
          </AnimatedSection>

          {/* CTA Button */}
          <AnimatedSection variant="fadeInUp" delay={0.3}>
            <Link href="/contact">
              <Button size="lg" className="min-w-[220px]">
                Book Your Experience
              </Button>
            </Link>
          </AnimatedSection>
        </div>
      </motion.div>
    </section>
  );
}
