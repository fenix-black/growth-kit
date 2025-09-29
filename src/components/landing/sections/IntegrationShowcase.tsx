'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Code2, 
  Terminal, 
  Zap, 
  Check, 
  Copy,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import ScrollReveal, { ScrollRevealStagger, StaggerItem } from '@/components/landing/animations/ScrollReveal';

export default function IntegrationShowcase() {
  const [activeStep, setActiveStep] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  const installCommand = 'npm install @fenixblack/growthkit';

  // Typing animation effect
  useEffect(() => {
    if (activeStep === 0) {
      let i = 0;
      const interval = setInterval(() => {
        setTypingText(installCommand.slice(0, i));
        i++;
        if (i > installCommand.length) {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [activeStep]);

  const integrationSteps = [
    {
      step: '01',
      title: 'Install the SDK',
      description: 'One command to add viral growth to any Next.js app',
      code: installCommand,
      language: 'bash'
    },
    {
      step: '02', 
      title: 'Add Middleware',
      description: 'Zero-config middleware handles referrals and verification',
      code: `// middleware.ts
export { middleware, config } from '@fenixblack/growthkit/auto-middleware';

// That's it! 🚀`,
      language: 'typescript'
    },
    {
      step: '03',
      title: 'Set Environment Variables',
      description: 'Secure API key configuration',
      code: `# .env.local
GROWTHKIT_API_KEY=gk_your_api_key_here
GROWTHKIT_API_URL=https://growth.fenixblack.ai/api`,
      language: 'bash'
    },
    {
      step: '04',
      title: 'Use the Hook',
      description: 'React hook provides all growth features instantly',
      code: `import { useGrowthKit } from '@fenixblack/growthkit';

function App() {
  const gk = useGrowthKit({
    debug: process.env.NODE_ENV === 'development'
  });
  
  return (
    <div>
      <h1>Credits: {gk.credits}</h1>
      <button onClick={() => gk.share()}>
        Share & Earn Credits
      </button>
    </div>
  );
}`,
      language: 'tsx'
    }
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  return (
    <section id="integration" className="py-20 bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <ScrollReveal className="text-center mb-16">
          <div className="flex items-center justify-center space-x-2 text-primary mb-4">
            <Code2 className="w-6 h-6" />
            <span className="text-sm font-semibold uppercase tracking-wider">Developer Experience</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            From zero to viral in
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
              4 simple steps
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our SDK is designed for developers who value simplicity without sacrificing power. 
            Get enterprise-grade growth features running in under 30 seconds.
          </p>
        </ScrollReveal>

        {/* Integration Steps */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Step Navigation */}
          <ScrollRevealStagger staggerDelay={0.1} className="space-y-4">
            {integrationSteps.map((step, index) => (
              <StaggerItem key={step.step}>
                <motion.div
                  className={`cursor-pointer p-6 rounded-2xl transition-all duration-300 ${
                    activeStep === index
                      ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-2 border-primary/30 shadow-lg'
                      : 'bg-white/80 hover:bg-white/95 border border-gray-200/50 hover:border-primary/20'
                  }`}
                  onClick={() => setActiveStep(index)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center space-x-4">
                    <div 
                      className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm ${
                        activeStep === index ? 'text-white' : 'bg-gray-100 text-gray-600'
                      }`}
                      style={activeStep === index ? {
                        background: 'linear-gradient(to right, #10b981, #14b8a6)',
                      } : {}}
                    >
                      {step.step}
                    </div>
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold mb-1 ${
                        activeStep === index ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                    <div className={`
                      transition-all duration-200
                      ${activeStep === index ? 'text-primary rotate-90' : 'text-gray-400'}
                    `}>
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </ScrollRevealStagger>

          {/* Code Display */}
          <div className="lg:sticky lg:top-8">
            <ScrollReveal direction="left">
              <div className="relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.4 }}
                    className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl"
                  >
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1.5">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        </div>
                        <div className="flex items-center space-x-2 ml-4">
                          <Terminal className="w-4 h-4 text-gray-400" />
                          <span className="text-sm font-medium text-gray-300">
                            {integrationSteps[activeStep].language}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => copyToClipboard(integrationSteps[activeStep].code)}
                        className="flex items-center space-x-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors duration-200"
                      >
                        <Copy className="w-4 h-4 text-gray-300" />
                        <span className="text-sm text-gray-300">Copy</span>
                      </motion.button>
                    </div>

                    {/* Code Content */}
                    <div className="p-6">
                      <pre className="text-sm text-gray-300 font-mono leading-relaxed overflow-x-auto">
                        <code>
                          {activeStep === 0 && integrationSteps[activeStep].language === 'bash' ? (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              className="text-green-400"
                            >
                              $ {typingText}
                              {typingText.length === installCommand.length && (
                                <motion.span
                                  animate={{ opacity: [1, 0] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                  className="text-gray-400"
                                >
                                  |
                                </motion.span>
                              )}
                            </motion.span>
                          ) : (
                            integrationSteps[activeStep].code
                          )}
                        </code>
                      </pre>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Copy Success Notification */}
                <AnimatePresence>
                  {showCopied && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.8, y: 10 }}
                      className="absolute top-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Copied!</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollReveal>

            {/* Features Highlight */}
            <ScrollReveal delay={0.2} className="mt-8">
              <div className="bg-gradient-to-r from-white/95 to-purple-50/50 p-6 rounded-2xl border border-primary/20 shadow-lg">
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold text-gray-900">What you get instantly:</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    'User fingerprinting',
                    'Viral referral system', 
                    'Credit management',
                    'Waitlist features',
                    'Real-time analytics',
                    'Anti-abuse protection',
                    'Email verification',
                    'TypeScript support'
                  ].map((feature, index) => (
                    <motion.div
                      key={feature}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center space-x-2 text-sm text-gray-600"
                    >
                      <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                      <span>{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Bottom CTA */}
        <ScrollReveal className="text-center mt-20">
          <div 
            className="bg-gray-900 rounded-3xl p-12 text-white shadow-2xl dark-section"
            style={{
              background: 'linear-gradient(to right, #1f2937, #111827)',
            }}
          >
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6"
              style={{
                background: 'linear-gradient(to right, #10b981, #14b8a6)',
              }}
            >
              <Zap className="w-8 h-8 text-white" />
            </motion.div>
            <h3 className="text-3xl font-bold text-white mb-4">
              Ready to 10x your growth?
            </h3>
            <p className="text-white mb-8 max-w-2xl mx-auto text-xl leading-relaxed font-medium">
              Join hundreds of developers who've already transformed their apps into viral growth engines. 
              Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-200"
                style={{
                  background: 'linear-gradient(to right, #10b981, #14b8a6)',
                }}
              >
                Start Free Trial
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-white text-gray-900 border-2 border-gray-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-100 hover:border-gray-900 transition-all duration-200 shadow-2xl"
              >
                View Documentation
              </motion.button>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
