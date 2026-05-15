'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { PageHero } from '@/components/ui/Section';
import { AnimatedSection, AnimatedSectionItem } from '@/components/ui/AnimatedSection';
import { Heart, Leaf, Award, Users } from 'lucide-react';
import { fadeInLeft, fadeInRight, fadeInUp } from '@/lib/animations/scroll-animations';

const values = [
  {
    icon: <Heart className="w-5 h-5 text-gold" />,
    title: 'Passion',
    description: 'Every fragrance is infused with expertise and a deep love for the art of perfumery.',
  },
  {
    icon: <Leaf className="w-5 h-5 text-gold" />,
    title: 'Quality',
    description: 'We source only the finest ingredients from around the world.',
  },
  {
    icon: <Award className="w-5 h-5 text-gold" />,
    title: 'Craftsmanship',
    description: 'Our perfumers blend tradition with innovation to create unique fragrances.',
  },
  {
    icon: <Users className="w-5 h-5 text-gold" />,
    title: 'Service',
    description: 'Every customer deserves a personalized experience.',
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <PageHero
        title="Our Story"
        subtitle="Aquad'or was born from a deep passion for the art of perfumery and a desire to bring the world's finest fragrances to Cyprus."
        backgroundImage="https://images.unsplash.com/photo-1541643600914-78b084683601?w=1920&q=80"
        eyebrow="Est. 2024, Nicosia, Cyprus"
      />

      {/* Story Section — editorial asymmetric layout */}
      <section className="section-lg">
        <div className="container-wide">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
            {/* Text — takes 5 cols */}
            <motion.div
              className="lg:col-span-5"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeInLeft}
            >
              <p className="eyebrow text-gold/60 mb-5">Who We Are</p>
              <h2 className="font-playfair text-3xl md:text-4xl text-black mb-6 leading-tight">
                Where Luxury Meets{' '}
                <span className="text-gradient-gold">Distinction</span>
              </h2>
              <div className="w-10 h-px bg-gold mb-8" />
              <div className="space-y-5 text-gray-600 text-[15px] leading-[1.85]">
                <p>
                  Founded in the heart of Nicosia, Aquad&apos;or has established itself as Cyprus&apos;s premier destination for luxury fragrances. Our curated collection features high-end and niche perfumes from globally recognized brands.
                </p>
                <p>
                  We believe that fragrance is more than just a scent. It&apos;s an expression of identity, a memory captured in a bottle, and a journey of the senses.
                </p>
              </div>

              {/* Pull quote */}
              <blockquote className="mt-10 border-l-2 border-gold/40 pl-6">
                <p className="font-playfair italic text-xl text-gold/80 leading-relaxed">
                  &ldquo;Fragrance is the most intimate form of self-expression.&rdquo;
                </p>
              </blockquote>

              <p className="mt-8 text-gray-600 text-[15px] leading-[1.85]">
                Our commitment to excellence extends beyond our products. We offer personalized consultations to help you discover fragrances that resonate with your unique personality and style.
              </p>
            </motion.div>

            {/* Image — takes 7 cols, full-bleed editorial */}
            <motion.div
              className="lg:col-span-7 relative"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true, margin: '-50px' }}
              variants={fadeInRight}
            >
              <div className="relative aspect-[4/3] lg:aspect-[16/11] overflow-hidden">
                <Image
                  src="https://i.ibb.co/xSqkdDL6/image-Cap-Cut-Commerce-Pro-202502202047.jpg"
                  alt="Aquad'or luxury perfumes"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 60vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
              </div>

              {/* Floating stat card */}
              <motion.div
                className="absolute -bottom-6 -left-6 hidden lg:block glass-card p-5 w-48"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5, duration: 0.7 }}
              >
                <p className="font-playfair text-3xl text-gradient-gold font-normal">100+</p>
                <p className="text-gray-600 text-xs mt-1 tracking-wide">Curated fragrances from around the world</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values — refined editorial treatment */}
      <section className="section bg-[#F5F3EF] relative overflow-hidden">
        {/* Subtle gold top border */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />

        <div className="container-wide">
          <AnimatedSection variant="fadeInUp" className="text-center mb-14 md:mb-20">
            <p className="eyebrow text-gold/60 mb-4">What Drives Us</p>
            <h2 className="font-playfair text-3xl md:text-4xl text-black mb-5 leading-tight">Our Values</h2>
            <div className="flex items-center justify-center gap-3">
              <div className="w-8 h-px bg-gold/30" />
              <div className="w-12 h-px bg-gold" />
              <div className="w-8 h-px bg-gold/30" />
            </div>
          </AnimatedSection>

          <AnimatedSection variant="stagger" staggerDelay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-0 border-t border-l border-gold/10">
              {values.map((value) => (
                <AnimatedSectionItem key={value.title}>
                  <div className="group p-8 md:p-10 border-b border-r border-gold/10 hover:bg-white transition-colors duration-500">
                    <div className="w-10 h-10 border border-gold/20 bg-gold/5 flex items-center justify-center mb-5 group-hover:border-gold/40 transition-colors duration-300">
                      {value.icon}
                    </div>
                    <h3 className="font-playfair text-lg text-black mb-3">{value.title}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">{value.description}</p>
                  </div>
                </AnimatedSectionItem>
              ))}
            </div>
          </AnimatedSection>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
      </section>

      {/* CTA — clean centered */}
      <section className="section-lg">
        <div className="container-wide">
          <motion.div
            className="max-w-xl mx-auto text-center"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <p className="eyebrow text-gold/60 mb-4">Visit Us</p>
            <h2 className="font-playfair text-3xl md:text-4xl text-black mb-5 leading-tight">
              Experience the Difference
            </h2>
            <div className="flex items-center justify-center gap-3 mb-7">
              <div className="w-8 h-px bg-gold/30" />
              <div className="w-12 h-px bg-gold" />
              <div className="w-8 h-px bg-gold/30" />
            </div>
            <p className="text-gray-500 text-sm md:text-base mb-10 leading-relaxed">
              Visit our boutique in Nicosia or explore our collection online.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop">
                <Button size="md">Explore Collection</Button>
              </Link>
              <Link href="/contact">
                <Button variant="outline" size="md">Contact Us</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
