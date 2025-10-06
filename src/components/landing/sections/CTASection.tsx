'use client';

import { motion } from 'framer-motion';
import { 
  Rocket, 
  ArrowRight, 
  Sparkles, 
  Users, 
  TrendingUp,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import ScrollReveal from '@/components/landing/animations/ScrollReveal';
import { useTranslation } from '@/hooks/useTranslation';

export default function CTASection() {
  const { t } = useTranslation();
  return (
    <section id="get-started" className="py-20 bg-gradient-to-br from-gray-900 via-black to-gray-900 relative overflow-hidden dark-section">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, -5, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-20 left-10 w-64 h-64 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -5, 5, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-20 right-10 w-80 h-80 bg-gradient-to-r from-fenix-magenta/15 to-fenix-purple/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ 
            y: [-10, 10],
            x: [0, 10, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-1/2 left-1/3 w-48 h-48 bg-gradient-to-r from-fenix-orange/10 to-fenix-pink/10 rounded-full blur-3xl"
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <ScrollReveal className="text-center">
          {/* Main CTA Content */}
          <div className="max-w-4xl mx-auto mb-16">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl"
              style={{
                background: 'linear-gradient(to right, #10b981, #14b8a6)',
              }}
            >
              <Rocket className="w-10 h-10 text-white" />
            </motion.div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6">
              {t('cta.title1')}{' '}
              <span 
                className="text-primary"
                style={{
                  background: 'linear-gradient(to right, #10b981, #a855f7, #d946ef)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                {t('cta.title2')}
              </span>
              {t('cta.title3')}
            </h2>
            
            <p className="text-xl text-gray-300 mb-12 leading-relaxed max-w-2xl mx-auto">
              {t('cta.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Link
                href="/admin"
                className="group bg-primary text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl hover:shadow-primary/25 transition-all duration-300 hover:scale-105 flex items-center space-x-3"
                style={{
                  background: 'linear-gradient(to right, #10b981, #14b8a6)',
                }}
              >
                <span>{t('cta.ctaPrimary')}</span>
                <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-200" />
              </Link>
              <Link
                href="#features"
                className="group bg-white/20 backdrop-blur-sm text-white border-2 border-white/40 px-10 py-5 rounded-2xl font-bold text-xl hover:bg-white/30 hover:border-white/60 transition-all duration-300 hover:scale-105 flex items-center space-x-3 shadow-lg"
              >
                <span>{t('cta.ctaSecondary')}</span>
                <Sparkles className="w-6 h-6 group-hover:rotate-12 transition-transform duration-200" />
              </Link>
            </div>
          </div>

          {/* Social Proof Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center"
            >
              <div 
                className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(to right, #10b981, #14b8a6)',
                }}
              >
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">{t('cta.stat1Value')}</div>
              <div className="text-gray-400 font-medium">{t('cta.stat1Label')}</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center"
            >
              <div 
                className="w-16 h-16 bg-fenix-purple rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(to right, #a855f7, #d946ef)',
                }}
              >
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">{t('cta.stat2Value')}</div>
              <div className="text-gray-400 font-medium">{t('cta.stat2Label')}</div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 text-center"
            >
              <div 
                className="w-16 h-16 bg-fenix-orange rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{
                  background: 'linear-gradient(to right, #f97316, #ec4899)',
                }}
              >
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div className="text-4xl font-bold text-white mb-2">{t('cta.stat3Value')}</div>
              <div className="text-gray-400 font-medium">{t('cta.stat3Label')}</div>
            </motion.div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-16 pt-8 border-t border-white/10">
            <p className="text-gray-400 text-lg mb-8">{t('cta.trustedBy')}</p>
            <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
              {[
                t('cta.companies.startups'),
                t('cta.companies.scaleups'),
                t('cta.companies.enterprise'),
                t('cta.companies.agencies'),
                t('cta.companies.indie')
              ].map((company, index) => (
                <motion.div
                  key={company}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 0.6, y: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="text-gray-300 font-medium text-lg"
                >
                  {company}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Bottom Message */}
          <div className="mt-12">
            <p className="text-gray-400 text-sm">
              {t('cta.bottomMessage')}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
