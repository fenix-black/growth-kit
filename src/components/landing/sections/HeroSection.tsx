'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { ArrowRight, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import Link from 'next/link';
import { useGrowthKit } from '@fenixblack/growthkit';
import { useTranslation } from '@/hooks/useTranslation';

export default function HeroSection() {
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const { t } = useTranslation();
  const transformWords = [
    t('hero.transformWord1'),
    t('hero.transformWord2'),
    t('hero.transformWord3'),
    t('hero.transformWord4')
  ];
  const { track } = useGrowthKit();

  // Animated word cycling
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex((prev) => (prev + 1) % transformWords.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Track hero section view
  useEffect(() => {
    track('hero_section_viewed', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    });
  }, [track]);

  // Floating animation for background elements
  const floatingAnimation = {
    y: [-20, 20],
    transition: {
      duration: 4,
      repeat: Infinity,
      repeatType: "reverse" as const,
      ease: "easeInOut" as any, // Smooth floating animation
    }
  };

  // Stagger animation for hero content
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.25, 0, 1] as any, // Smooth cubic-bezier for quality animations
      }
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient orbs */}
        <motion.div
          animate={floatingAnimation}
          className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            ...floatingAnimation,
            transition: {
              ...floatingAnimation.transition,
              delay: 1
            }
          }}
          className="absolute top-40 right-10 w-96 h-96 bg-gradient-to-r from-fenix-purple/15 to-fenix-magenta/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            ...floatingAnimation,
            transition: {
              ...floatingAnimation.transition,
              delay: 2
            }
          }}
          className="absolute bottom-20 left-1/3 w-64 h-64 bg-gradient-to-r from-fenix-orange/20 to-fenix-pink/20 rounded-full blur-3xl"
        />

        {/* Floating icons */}
        <motion.div
          animate={{ 
            y: [-10, 10],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-32 right-1/4 text-primary/30"
        >
          <TrendingUp className="w-8 h-8" />
        </motion.div>
        <motion.div
          animate={{ 
            y: [10, -10],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-1/3 right-20 text-fenix-purple/30"
        >
          <Users className="w-6 h-6" />
        </motion.div>
        <motion.div
          animate={{ 
            y: [-15, 15],
            x: [-5, 5],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute top-1/3 left-20 text-fenix-orange/30"
        >
          <Sparkles className="w-7 h-7" />
        </motion.div>
      </div>

      {/* Main Hero Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Logo */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="flex justify-center">
            <Image
              src="/growthkit-logo-alpha-120px.png"
              alt="GrowthKit"
              width={120}
              height={40}
              className="opacity-90 hover:opacity-100 transition-opacity duration-200"
            />
          </div>
        </motion.div>

        {/* Badge */}
        <motion.div variants={itemVariants} className="mb-8">
          <div className="inline-flex items-center space-x-2 bg-white/90 backdrop-blur-sm border border-primary/30 rounded-full px-6 py-3 text-sm font-medium text-gray-800 shadow-lg shadow-primary/10">
            <Zap className="w-4 h-4 text-primary" />
            <span>{t('hero.badge')}</span>
          </div>
        </motion.div>

        {/* Animated Main Headline */}
        <motion.div variants={itemVariants} className="mb-6">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            <motion.span
              key={currentWordIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="text-primary inline-block"
              style={{
                background: 'linear-gradient(to right, #10b981, #14b8a6, #a855f7)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {transformWords[currentWordIndex]}
            </motion.span>
            <br />
<span className="text-gray-900">{t('hero.title1')}</span>
            <br />
            <span 
              className="text-fenix-magenta"
              style={{
                background: 'linear-gradient(to right, #d946ef, #a855f7, #10b981)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {t('hero.title2')}
            </span>
          </h1>
        </motion.div>

        {/* Subtitle */}
        <motion.div variants={itemVariants} className="mb-12">
          <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            {t('hero.subtitle1')}{' '}
            <span className="font-semibold text-primary">{t('hero.subtitle2')}</span> {t('hero.subtitle3')}
            <br />
            <span className="font-semibold text-gray-900">{t('hero.subtitle4')}</span>
          </p>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div variants={itemVariants} className="mb-16">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="#get-started"
              className="group bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg hover:shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105 flex items-center space-x-2 shadow-lg"
              style={{
                background: 'linear-gradient(to right, #10b981, #14b8a6)',
              }}
              onClick={() => track('hero_cta_clicked', { 
                button: 'start_building', 
                section: 'hero',
                destination: 'get-started'
              })}
            >
              <span>{t('hero.ctaPrimary')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            <Link
              href="#features"
              className="group bg-white border-2 border-primary/30 text-gray-900 px-8 py-4 rounded-xl font-semibold text-lg hover:border-primary hover:bg-gray-50 hover:shadow-xl transition-all duration-300 hover:scale-105 shadow-lg"
              onClick={() => track('hero_cta_clicked', { 
                button: 'see_how_it_works', 
                section: 'hero',
                destination: 'features'
              })}
            >
              {t('hero.ctaSecondary')}
            </Link>
          </div>
        </motion.div>

        {/* Social Proof - Quick Stats */}
        <motion.div variants={itemVariants}>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div 
                className="text-3xl font-bold text-primary"
                style={{
                  background: 'linear-gradient(to right, #10b981, #14b8a6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {t('hero.stat1Value')}
              </div>
              <div className="text-gray-600 text-sm font-medium">{t('hero.stat1Label')}</div>
            </div>
            <div className="text-center">
              <div 
                className="text-3xl font-bold text-fenix-purple"
                style={{
                  background: 'linear-gradient(to right, #a855f7, #d946ef)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {t('hero.stat2Value')}
              </div>
              <div className="text-gray-600 text-sm font-medium">{t('hero.stat2Label')}</div>
            </div>
            <div className="text-center">
              <div 
                className="text-3xl font-bold text-fenix-orange"
                style={{
                  background: 'linear-gradient(to right, #f97316, #ec4899)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {t('hero.stat3Value')}
              </div>
              <div className="text-gray-600 text-sm font-medium">{t('hero.stat3Label')}</div>
            </div>
          </div>
        </motion.div>
      </motion.div>

    </section>
  );
}
