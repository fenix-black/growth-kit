'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Fingerprint, 
  Share2, 
  Coins, 
  Clock, 
  Users, 
  TrendingUp, 
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react';
import ScrollReveal, { ScrollRevealStagger, StaggerItem } from '@/components/landing/animations/ScrollReveal';
import { useTranslation } from '@/hooks/useTranslation';

// Icon and color mapping (not translatable)
const featureMetadata: Record<string, { icon: string; color: string }> = {
  fingerprinting: { icon: 'Fingerprint', color: 'primary' },
  referrals: { icon: 'Share2', color: 'fenix-purple' },
  credits: { icon: 'Coins', color: 'fenix-orange' },
  waitlist: { icon: 'Clock', color: 'fenix-magenta' }
};

export default function FeaturesDemo() {
  const [activeFeature, setActiveFeature] = useState(0);
  const { t } = useTranslation();
  const featureDetailsData = t('featureDetails') as any[];
  
  // Add icon and color metadata
  const featureDetails = featureDetailsData.map((feature: any) => ({
    ...feature,
    ...featureMetadata[feature.id]
  }));

  const iconMap = {
    'Fingerprint': Fingerprint,
    'Share2': Share2,
    'Coins': Coins,
    'Clock': Clock,
  };

  const getFeatureColor = (color: string) => {
    switch (color) {
      case 'primary': return 'text-primary';
      case 'fenix-purple': return 'text-fenix-purple';
      case 'fenix-orange': return 'text-fenix-orange';
      case 'fenix-magenta': return 'text-fenix-magenta';
      default: return 'text-primary';
    }
  };

  const getFeatureGradient = (color: string) => {
    switch (color) {
      case 'primary': return 'from-primary to-secondary';
      case 'fenix-purple': return 'from-fenix-purple to-fenix-magenta';
      case 'fenix-orange': return 'from-fenix-orange to-fenix-pink';
      case 'fenix-magenta': return 'from-fenix-magenta to-fenix-purple';
      default: return 'from-primary to-secondary';
    }
  };

  const demoAnimations = {
    fingerprinting: {
      initial: { scale: 0.8, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 0.5 }
    },
    referrals: {
      initial: { x: -50, opacity: 0 },
      animate: { x: 0, opacity: 1 },
      transition: { duration: 0.6 }
    },
    credits: {
      initial: { y: 50, opacity: 0 },
      animate: { y: 0, opacity: 1 },
      transition: { duration: 0.4 }
    },
    waitlist: {
      initial: { scale: 0.9, opacity: 0 },
      animate: { scale: 1, opacity: 1 },
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="features" className="py-20 bg-gradient-to-br from-white via-blue-50 to-indigo-50 relative overflow-hidden">
      {/* Clean slate - no stray content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 text-primary mb-4">
            <Zap className="w-6 h-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">{t('features.badge')}</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            {t('features.title1')}
            <br />
            <span 
              className="text-primary"
              style={{
                background: 'linear-gradient(to right, #10b981, #a855f7, #d946ef)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              {t('features.title2')}
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            {t('features.subtitle')}{' '}
            <span className="font-semibold text-primary">{t('features.subtitleHighlight')}</span>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {[
              t('features.platforms.static'),
              t('features.platforms.frameworks'),
              t('features.platforms.nextjs'),
              t('features.platforms.github'),
              t('features.platforms.codepen'),
              t('features.platforms.any')
            ].map((platform) => (
              <motion.div
                key={platform}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="px-4 py-2 bg-white/80 backdrop-blur-sm border border-primary/20 rounded-full text-sm font-medium text-gray-700 shadow-sm"
              >
                {platform}
              </motion.div>
            ))}
          </div>
        </ScrollReveal>

        {/* Interactive Features Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mt-20">
          {/* Feature Navigation */}
          <ScrollRevealStagger staggerDelay={0.1} className="space-y-4">
            {featureDetails.map((feature, index) => {
              const IconComponent = iconMap[feature.icon as keyof typeof iconMap];
              const isActive = activeFeature === index;
              
              return (
                <StaggerItem key={feature.id}>
                  <motion.div
                    onClick={() => setActiveFeature(index)}
                    className={`cursor-pointer p-6 rounded-2xl transition-all duration-300 ${
                      isActive 
                        ? 'bg-white shadow-xl shadow-primary/10 border-2 border-primary/20' 
                        : 'bg-white/70 hover:bg-white/90 border-2 border-transparent hover:border-primary/20'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`
                        flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center
                        ${isActive ? `bg-gradient-to-r ${getFeatureGradient(feature.color)} text-white` : 'bg-gray-100 text-gray-600'}
                      `}>
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className={`text-lg font-semibold mb-2 ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                          {feature.title}
                        </h3>
                        <p className={`text-sm leading-relaxed ${isActive ? 'text-gray-600' : 'text-gray-500'}`}>
                          {feature.description}
                        </p>
                        {isActive && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-4 pt-4 border-t border-gray-200"
                          >
                            <div className="grid grid-cols-2 gap-2 mb-4">
                              {feature.benefits.map((benefit: string, idx: number) => (
                                <div key={idx} className="flex items-center space-x-2 text-sm text-gray-600">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                                  <span>{benefit}</span>
                                </div>
                              ))}
                            </div>
                            <div className="bg-gray-900 rounded-lg p-4">
                              <pre className="text-sm text-gray-300 font-mono overflow-x-auto">
                                <code>{feature.codeExample}</code>
                              </pre>
                            </div>
                          </motion.div>
                        )}
                      </div>
                      <div className={`
                        flex-shrink-0 transition-all duration-200
                        ${isActive ? 'text-primary rotate-90' : 'text-gray-400'}
                      `}>
                        <ArrowRight className="w-5 h-5" />
                      </div>
                    </div>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </ScrollRevealStagger>

          {/* Feature Demo Visualization */}
          <ScrollReveal direction="left" className="lg:pl-8">
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  {...demoAnimations[featureDetails[activeFeature].id as keyof typeof demoAnimations]}
                  className="bg-gradient-to-br from-white/95 to-blue-50/95 rounded-3xl p-8 shadow-2xl border border-primary/10"
                >
                  {/* Demo content based on active feature */}
                  {activeFeature === 0 && (
                    <FingerprintingDemo />
                  )}
                  {activeFeature === 1 && (
                    <ReferralDemo />
                  )}
                  {activeFeature === 2 && (
                    <CreditsDemo />
                  )}
                  {activeFeature === 3 && (
                    <WaitlistDemo />
                  )}
                </motion.div>
              </AnimatePresence>
              
              {/* Floating stats */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute -top-4 -right-4 bg-white rounded-xl p-4 shadow-lg border border-gray-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">{t('features.liveDemo')}</span>
                </div>
              </motion.div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// Individual demo components
function FingerprintingDemo() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">{t('features.fingerprinting.demoTitle')}</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>{t('features.fingerprinting.demoStatus')}</span>
        </div>
      </div>
      
      <div className="bg-gradient-to-br from-gray-50 to-blue-50/50 rounded-xl p-4 border border-primary/10">
        <div className="space-y-3">
          {[
            { id: 'fp_user_123', device: 'Chrome • Desktop', location: 'San Francisco' },
            { id: 'fp_user_456', device: 'Safari • Mobile', location: 'New York' },
            { id: 'fp_user_789', device: 'Firefox • Desktop', location: 'London' },
          ].map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className="flex items-center justify-between p-3 bg-white rounded-lg shadow-sm border border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <Fingerprint className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-mono text-sm font-medium text-gray-900">{user.id}</div>
                  <div className="text-xs text-gray-500">{user.device}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-600">{user.location}</div>
                <div className="text-xs text-green-600">Active</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReferralDemo() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">{t('features.referrals.demoTitle')}</h3>
        <div className="text-sm font-medium text-fenix-purple">0.45 {t('features.referrals.demoCoefficient')}</div>
      </div>
      
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-fenix-purple/10 to-fenix-magenta/10 rounded-xl p-4 border border-fenix-purple/20 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-fenix-purple" />
              <span className="font-medium text-gray-900">Sarah's Referrals</span>
            </div>
            <div className="text-fenix-purple font-bold">+15 Credits</div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="w-8 h-8 bg-fenix-purple/20 rounded-full flex items-center justify-center"
              >
                <Users className="w-4 h-4 text-fenix-purple" />
              </motion.div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center justify-center">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="bg-white border-2 border-fenix-purple/30 rounded-full p-3 shadow-lg"
          >
            <Share2 className="w-6 h-6 text-fenix-purple" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function CreditsDemo() {
  const [credits, setCredits] = useState(24);
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">{t('features.credits.demoTitle')}</h3>
        <div className="flex items-center space-x-2">
          <Coins className="w-5 h-5 text-fenix-orange" />
          <span className="text-xl font-bold text-fenix-orange">{credits}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {[
          { action: t('features.credits.actions.emailVerification'), credits: '+5', color: 'green' },
          { action: t('features.credits.actions.friendReferral'), credits: '+3', color: 'blue' },
          { action: t('features.credits.actions.profileComplete'), credits: '+2', color: 'purple' },
        ].map((item, index) => (
          <motion.div
            key={item.action}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm"
          >
            <span className="font-medium text-gray-700">{item.action}</span>
            <span className={`font-bold text-${item.color}-600`}>{item.credits}</span>
          </motion.div>
        ))}
      </div>
      
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setCredits(credits - 1)}
        className="w-full bg-fenix-orange text-white py-3 rounded-lg font-medium"
        style={{
          background: 'linear-gradient(to right, #f97316, #ec4899)',
        }}
      >
        {t('features.credits.useCredit')}
      </motion.button>
    </div>
  );
}

function WaitlistDemo() {
  const { t } = useTranslation();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-gray-900">{t('features.waitlist.demoTitle')}</h3>
        <div className="text-sm font-medium text-fenix-magenta">1,247 {t('features.waitlist.demoQueue')}</div>
      </div>
      
      <div className="space-y-3">
        {[
          { position: 1, status: 'invited', email: 'alex@example.com' },
          { position: 2, status: 'invited', email: 'sarah@example.com' },
          { position: 3, status: 'queued', email: 'john@example.com' },
          { position: 4, status: 'queued', email: 'emma@example.com' },
        ].map((user, index) => (
          <motion.div
            key={user.email}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center justify-between p-3 rounded-lg shadow-sm ${
              user.status === 'invited' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-gray-50 border border-gray-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                user.status === 'invited' ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'
              }`}>
                {user.position}
              </div>
              <span className="text-sm font-medium text-gray-700">{user.email}</span>
            </div>
            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
              user.status === 'invited' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {t(`features.waitlist.statuses.${user.status}`)}
            </div>
          </motion.div>
        ))}
      </div>
      
      <div className="text-center">
        <motion.div
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="inline-flex items-center justify-center w-8 h-8 bg-fenix-magenta rounded-full text-white mb-2"
        >
          <Clock className="w-4 h-4" />
        </motion.div>
        <p className="text-sm text-gray-600">{t('features.waitlist.autoInvite')}</p>
      </div>
    </div>
  );
}
