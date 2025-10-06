'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  ArrowUpRight, 
  Star,
  ExternalLink,
  Quote
} from 'lucide-react';
import ScrollReveal, { ScrollRevealStagger, StaggerItem } from '@/components/landing/animations/ScrollReveal';
import { useTranslation } from '@/hooks/useTranslation';

// Import original examples for metrics and screenshots (not translatable)
import { miniAppExamples as originalExamples } from '@/lib/landing/examples';

export default function RealExamplesShowcase() {
  const [selectedExample, setSelectedExample] = useState(0);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const { t } = useTranslation();
  const miniAppExamplesData = t('miniAppExamples') as any[];
  
  // Merge translated data with original metrics and screenshots (keep translated timeframe)
  const miniAppExamples = miniAppExamplesData.map((app: any, index: number) => ({
    ...app,
    metrics: {
      ...originalExamples[index].metrics,
      timeframe: app.timeframe // Use translated timeframe
    },
    screenshot: originalExamples[index].screenshot
  }));

  const categories = [...new Set(miniAppExamples.map((app: any) => app.category))];

  return (
    <section id="examples" className="py-20 bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 text-fenix-magenta mb-4">
            <Star className="w-6 h-6 fill-current" />
            <span className="text-sm font-semibold uppercase tracking-wider">{t('examples.badge')}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {t('examples.title1')}
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
              {t('examples.title2')}
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('examples.subtitle')}
          </p>
        </ScrollReveal>

        {/* Category Filter */}
        <ScrollReveal className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category, index) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 text-sm font-medium rounded-full border transition-all duration-200 hover:shadow-md"
            >
              {category}
            </motion.button>
          ))}
        </ScrollReveal>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* App Cards */}
          <ScrollRevealStagger staggerDelay={0.1} className="space-y-6">
            {miniAppExamples.map((app, index) => (
              <StaggerItem key={app.id}>
                <motion.div
                  className={`cursor-pointer p-6 rounded-2xl transition-all duration-300 ${
                    selectedExample === index
                      ? 'bg-gradient-to-br from-white/95 to-indigo-50/50 shadow-2xl border-2 border-primary/20 scale-105'
                      : 'bg-white/80 hover:bg-white/95 shadow-lg hover:shadow-xl border border-gray-200/50 hover:border-primary/20'
                  }`}
                  onClick={() => setSelectedExample(index)}
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{app.name}</h3>
                        <div className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                          {app.category.split(' & ')[0]}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-4">
                        {app.description}
                      </p>
                    </div>
                    {hoveredCard === index && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="ml-2"
                      >
                        <ExternalLink className="w-5 h-5 text-gray-400" />
                      </motion.div>
                    )}
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center p-3 bg-gradient-to-r from-primary/5 to-secondary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {app.metrics.userGrowth}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">{t('examples.metrics.userGrowth')}</div>
                    </div>
                    <div className="text-center p-3 bg-gradient-to-r from-fenix-magenta/5 to-fenix-purple/5 rounded-lg">
                      <div className="text-2xl font-bold text-fenix-magenta mb-1">
                        {app.metrics.creditsEarned || app.metrics.referrals}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {app.metrics.creditsEarned ? t('examples.metrics.creditsEarned') : t('examples.metrics.referrals')}
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {app.tags.slice(0, 3).map((tag: string) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Timeframe */}
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-500">
                      {t('examples.resultsIn')} <span className="font-medium text-gray-700">{app.metrics.timeframe}</span>
                    </div>
                    <div className={`
                      w-3 h-3 rounded-full transition-all duration-200
                      ${selectedExample === index ? 'bg-primary' : 'bg-gray-300'}
                    `} />
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </ScrollRevealStagger>

          {/* Selected App Details */}
          <div className="lg:sticky lg:top-8">
            <ScrollReveal direction="left">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedExample}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.5 }}
                  className="space-y-6"
                >
                  {/* App Screenshot */}
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl overflow-hidden shadow-xl">
                      <Image
                        src={miniAppExamples[selectedExample].screenshot}
                        alt={`${miniAppExamples[selectedExample].name} Screenshot`}
                        width={600}
                        height={400}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    {/* Success Badge */}
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{t('examples.successStory')}</span>
                    </div>
                  </div>

                  {/* Detailed Metrics */}
                  <div className="bg-gradient-to-br from-indigo-50/50 to-purple-50/50 p-6 rounded-2xl border border-primary/20 shadow-lg">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">{t('examples.growthMetrics')}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                        <div className="text-3xl font-bold text-primary mb-2">
                          {miniAppExamples[selectedExample].metrics.userGrowth}
                        </div>
                        <div className="text-sm text-gray-600">{t('examples.metrics.userGrowth')}</div>
                      </div>
                      {miniAppExamples[selectedExample].metrics.viralCoefficient && (
                        <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                          <div className="text-3xl font-bold text-fenix-purple mb-2">
                            {miniAppExamples[selectedExample].metrics.viralCoefficient}
                          </div>
                          <div className="text-sm text-gray-600">{t('examples.metrics.viralCoefficient')}</div>
                        </div>
                      )}
                      {miniAppExamples[selectedExample].metrics.retentionImprovement && (
                        <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                          <div className="text-3xl font-bold text-fenix-orange mb-2">
                            {miniAppExamples[selectedExample].metrics.retentionImprovement}
                          </div>
                          <div className="text-sm text-gray-600">{t('examples.metrics.retention')}</div>
                        </div>
                      )}
                      <div className="text-center p-4 bg-white rounded-xl shadow-sm">
                        <div className="text-3xl font-bold text-fenix-magenta mb-2">
                          {miniAppExamples[selectedExample].metrics.creditsEarned || 
                           miniAppExamples[selectedExample].metrics.referrals}
                        </div>
                        <div className="text-sm text-gray-600">
                          {miniAppExamples[selectedExample].metrics.creditsEarned ? t('examples.metrics.credits') : t('examples.metrics.referrals')}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Testimonial */}
                  {miniAppExamples[selectedExample].testimonial && (
                    <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-6 rounded-2xl border border-primary/20 shadow-lg">
                      <div className="flex items-start space-x-4">
                        <Quote className="w-8 h-8 text-primary/40 flex-shrink-0 mt-1" />
                        <div>
                          <blockquote className="text-gray-700 font-medium mb-4 leading-relaxed">
                            "{miniAppExamples[selectedExample].testimonial!.quote}"
                          </blockquote>
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white font-bold"
                              style={{
                                background: 'linear-gradient(to right, #10b981, #14b8a6)',
                              }}
                            >
                              {miniAppExamples[selectedExample].testimonial!.author.charAt(0)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900">
                                {miniAppExamples[selectedExample].testimonial!.author}
                              </div>
                              <div className="text-sm text-gray-600">
                                {miniAppExamples[selectedExample].testimonial!.role}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* All Tags */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('examples.technologiesUsed')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {miniAppExamples[selectedExample].tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-full transition-colors duration-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </ScrollReveal>
          </div>
        </div>

        {/* Bottom CTA */}
        <ScrollReveal className="text-center mt-20">
          <div className="bg-gradient-to-r from-primary/10 via-fenix-purple/10 to-fenix-magenta/10 rounded-3xl p-8 border border-primary/20 shadow-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              {t('examples.ctaTitle')}
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              {t('examples.ctaSubtitle')}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center space-x-2 mx-auto"
              style={{
                background: 'linear-gradient(to right, #10b981, #14b8a6)',
              }}
            >
              <span>{t('examples.ctaButton')}</span>
              <ArrowUpRight className="w-5 h-5" />
            </motion.button>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
