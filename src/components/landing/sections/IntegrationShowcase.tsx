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
  const [activeTab, setActiveTab] = useState<'quick' | 'advanced'>('quick');
  const [activeStep, setActiveStep] = useState(0);
  const [typingText, setTypingText] = useState('');
  const [showCopied, setShowCopied] = useState(false);

  const installCommand = 'npm install @fenixblack/growthkit';
  const setupCommand = 'npx @fenixblack/growthkit setup';

  // Typing animation effect
  useEffect(() => {
    if (activeStep === 0) {
      const command = activeTab === 'quick' ? installCommand : setupCommand;
      let i = 0;
      setTypingText('');
      const interval = setInterval(() => {
        setTypingText(command.slice(0, i));
        i++;
        if (i > command.length) {
          clearInterval(interval);
        }
      }, 50);
      return () => clearInterval(interval);
    }
  }, [activeStep, activeTab]);  // Re-run when tab or step changes

  const quickStartSteps = [
    {
      step: '01',
      title: 'Install the SDK',
      description: 'Works with React, Vue, Svelte, vanilla JS, anywhere',
      code: installCommand,
      language: 'bash'
    },
    {
      step: '02',
      title: 'Use Your Public Key',
      description: 'That\'s it! No backend, no config files needed',
      code: `import { useGrowthKit } from '@fenixblack/growthkit';

function App() {
  const gk = useGrowthKit({
    publicKey: 'pk_your_public_key_here' // From dashboard
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

  const advancedSteps = [
    {
      step: '01',
      title: 'Run Setup Command',
      description: 'One command does everything automatically',
      code: setupCommand,
      language: 'bash'
    },
    {
      step: '02',
      title: 'That\'s it! Setup is complete',
      description: 'CLI automatically created middleware and env vars',
      code: `// middleware.ts - Auto-generated ✨
export { middleware, config } from '@fenixblack/growthkit/auto-middleware';

// .env.local - Auto-configured 🔒
// GROWTHKIT_API_KEY=gk_your_api_key_here
// GROWTHKIT_API_URL=https://growth.fenixblack.ai/api`,
      language: 'typescript'
    }
  ];

  const integrationSteps = activeTab === 'quick' ? quickStartSteps : advancedSteps;

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
              2 simple steps
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose your setup: <span className="font-semibold text-primary">Quick Start</span> works everywhere instantly, 
            or <span className="font-semibold text-fenix-purple">Advanced</span> adds Next.js superpowers.
          </p>
          
          {/* Tab Switcher */}
          <div className="flex justify-center mt-8">
            <div className="inline-flex bg-white/80 backdrop-blur-sm p-1.5 rounded-2xl border border-gray-200/50 shadow-lg">
              <button
                onClick={() => {
                  setActiveTab('quick');
                  setActiveStep(0);
                }}
                className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === 'quick'
                    ? 'bg-primary text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={activeTab === 'quick' ? {
                  background: 'linear-gradient(to right, #10b981, #14b8a6)'
                } : {}}
              >
                <Zap className="w-4 h-4" />
                <span>Quick Start (10s)</span>
                {activeTab === 'quick' && (
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">Recommended</span>
                )}
              </button>
              <button
                onClick={() => {
                  setActiveTab('advanced');
                  setActiveStep(0);
                }}
                className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center space-x-2 ${
                  activeTab === 'advanced'
                    ? 'bg-fenix-purple text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={activeTab === 'advanced' ? {
                  background: 'linear-gradient(to right, #a855f7, #d946ef)'
                } : {}}
              >
                <Sparkles className="w-4 h-4" />
                <span>Advanced (Next.js)</span>
              </button>
            </div>
          </div>
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
                              {typingText.length === (activeTab === 'quick' ? installCommand : setupCommand).length && (
                                <motion.span
                                  animate={{ opacity: [1, 0] }}
                                  transition={{ duration: 0.8, repeat: Infinity }}
                                  className="text-gray-400"
                                >
                                  |
                                </motion.span>
                              )}
                            </motion.span>
                          ) : integrationSteps[activeStep].language === 'bash' ? (
                            <span className="text-green-400">
                              {integrationSteps[activeStep].code}
                            </span>
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
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`p-6 rounded-2xl border shadow-lg ${
                    activeTab === 'quick'
                      ? 'bg-gradient-to-r from-primary/5 to-secondary/5 border-primary/20'
                      : 'bg-gradient-to-r from-fenix-purple/5 to-fenix-magenta/5 border-fenix-purple/20'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-4">
                    {activeTab === 'quick' ? (
                      <Zap className="w-5 h-5 text-primary" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-fenix-purple" />
                    )}
                    <h3 className="text-lg font-semibold text-gray-900">
                      {activeTab === 'quick' ? '✅ Works everywhere:' : '⚡ Advanced features:'}
                    </h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {(activeTab === 'quick' ? [
                      { icon: '✨', text: 'No backend required' },
                      { icon: '🚀', text: 'Any JavaScript framework' },
                      { icon: '📦', text: 'Static site generators' },
                      { icon: '🎨', text: 'CodePen/CodeSandbox' },
                      { icon: '🌐', text: 'GitHub Pages ready' },
                      { icon: '⚡', text: 'Instant deployment' },
                      { icon: '🔒', text: 'Secure public keys' },
                      { icon: '📱', text: 'Works anywhere JS runs' }
                    ] : [
                      { icon: '🔐', text: 'Server-side API keys' },
                      { icon: '🛣️', text: 'Custom referral routing' },
                      { icon: '🔄', text: 'API proxying' },
                      { icon: '✉️', text: 'Email verification flow' },
                      { icon: '🎯', text: 'Advanced middleware' },
                      { icon: '⚙️', text: 'Custom configuration' },
                      { icon: '🏗️', text: 'Full-stack features' },
                      { icon: '🚀', text: 'Maximum security' }
                    ]).map((feature, index) => (
                      <motion.div
                        key={feature.text}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-start space-x-2 text-sm"
                      >
                        <span className="text-lg flex-shrink-0" style={{ marginTop: '-2px' }}>{feature.icon}</span>
                        <span className="text-gray-700 leading-relaxed">{feature.text}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
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
