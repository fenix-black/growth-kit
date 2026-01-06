'use client';

import Image from 'next/image';
import { motion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { 
  Linkedin, 
  Github, 
  ExternalLink,
  ChevronDown,
  Lightbulb,
  Rocket,
  Heart,
  ArrowRight
} from 'lucide-react';

// Featured products data
const featuredProducts = [
  {
    name: 'GrowthKit',
    description: 'Viral growth engine for any app',
    url: 'https://growth.fenixblack.ai',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    name: 'DeskCloud',
    description: 'Give AI Agents eyes and hands over virtual desktops',
    url: 'https://www.deskcloud.app',
    gradient: 'from-blue-500 to-indigo-500',
  },
  {
    name: 'OkiDoki.chat',
    description: 'Intelligent chat platform',
    url: 'https://www.okidoki.chat',
    gradient: 'from-purple-500 to-pink-500',
  },
  {
    name: 'Restore Photos',
    description: 'AI photo restoration & animation',
    url: 'https://restore.fenixblack.ai',
    gradient: 'from-orange-500 to-red-500',
  },
  {
    name: 'DocxDiff',
    description: 'Smart document comparison',
    url: 'https://www.docxdiff.com',
    gradient: 'from-cyan-500 to-blue-500',
  },
  {
    name: 'Virtual Backgrounds',
    description: 'AI-powered Zoom backgrounds',
    url: 'https://backgrounds.fenixblack.ai',
    gradient: 'from-pink-500 to-rose-500',
  },
];

// Animated counter component
function AnimatedCounter({ value, suffix = '', duration = 2 }: { value: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const incrementTime = (duration * 1000) / end;
      
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start >= end) clearInterval(timer);
      }, Math.max(incrementTime, 20));

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

// Story card component
function StoryCard({ 
  icon: Icon, 
  title, 
  description, 
  index 
}: { 
  icon: any; 
  title: string; 
  description: string; 
  index: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      className="relative"
    >
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
        <div 
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
          style={{
            background: 'linear-gradient(135deg, #10b981, #14b8a6)',
          }}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

// Product card with tilt effect
function ProductCard({ product, index }: { product: typeof featuredProducts[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    setRotateX((y - centerY) / 20);
    setRotateY((centerX - x) / 20);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
  };

  return (
    <motion.a
      ref={ref}
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="block group"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      <div className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all duration-300 h-full">
        <div 
          className={`w-10 h-10 rounded-lg bg-gradient-to-br ${product.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
        >
          <span className="text-white font-bold text-sm">
            {product.name.charAt(0)}
          </span>
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
          {product.name}
          <ExternalLink className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
        </h3>
        <p className="text-gray-500 text-sm">{product.description}</p>
      </div>
    </motion.a>
  );
}

export default function AboutPage() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.5], [1, 0.95]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, 50]);

  return (
    <div className="bg-white">
      {/* SECTION 1: THE HOOK */}
      <section 
        ref={heroRef}
        className="dark-section relative min-h-screen flex items-center justify-center overflow-hidden -mt-16 pt-16"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
        }}
      >
        {/* Animated background gradient */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: 'radial-gradient(circle at 30% 40%, rgba(16, 185, 129, 0.3) 0%, transparent 50%), radial-gradient(circle at 70% 60%, rgba(168, 85, 247, 0.2) 0%, transparent 50%)',
          }}
        />
        
        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          style={{ opacity: heroOpacity, scale: heroScale, y: heroY }}
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-emerald-400 text-sm font-medium tracking-widest uppercase mb-6"
          >
            Building since 1995
          </motion.p>
          
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-8 leading-tight"
          >
            I help founders turn
            <br />
            <span 
              className="bg-clip-text text-transparent"
              style={{
                backgroundImage: 'linear-gradient(to right, #10b981, #a855f7, #ec4899)',
              }}
            >
              simple apps
            </span>
            <br />
            into viral products
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-gray-400 text-lg sm:text-xl max-w-2xl mx-auto"
          >
            I wrote my first enterprise software as a teenager.
            <br className="hidden sm:block" />
            Three decades and 100+ projects later, I&apos;m still shipping.
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="flex flex-col items-center text-gray-500"
          >
            <span className="text-xs uppercase tracking-widest mb-2">Scroll</span>
            <ChevronDown className="w-5 h-5" />
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 2: THE REVEAL - Bento Grid */}
      <section className="light-section py-20 sm:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Bento Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {/* Photo - Large */}
            <motion.div 
              className="col-span-2 row-span-2 relative group"
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative h-full min-h-[300px] sm:min-h-[400px] rounded-3xl overflow-hidden">
                <Image
                  src="/landing/pablo.jpeg"
                  alt="Pablo Schaffner"
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                  priority
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Name overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                    Pablo Schaffner
                  </h2>
                  <p className="text-gray-300 text-sm sm:text-base">
                    Founder, FenixBlack.ai
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Stat 1: Years */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 flex flex-col justify-center text-white"
            >
              <span className="text-4xl sm:text-5xl font-bold mb-1">
                <AnimatedCounter value={30} />
              </span>
              <span className="text-emerald-100 text-sm font-medium">
                years building
              </span>
            </motion.div>

            {/* Stat 2: Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-gradient-to-br from-purple-500 to-pink-600 rounded-3xl p-6 flex flex-col justify-center text-white"
            >
              <span className="text-4xl sm:text-5xl font-bold mb-1">
                <AnimatedCounter value={100} suffix="+" />
              </span>
              <span className="text-purple-100 text-sm font-medium">
                projects shipped
              </span>
            </motion.div>

            {/* Stat 3: Live */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl p-6 flex flex-col justify-center text-white"
            >
              <span className="text-4xl sm:text-5xl font-bold mb-1">
                <AnimatedCounter value={15} suffix="+" />
              </span>
              <span className="text-blue-100 text-sm font-medium">
                live today
              </span>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-gray-900 rounded-3xl p-6 flex flex-col justify-center gap-3"
            >
              <a
                href="https://www.linkedin.com/in/pschaffner/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group"
              >
                <Linkedin className="w-5 h-5" />
                <span className="text-sm font-medium">LinkedIn</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </a>
              <a
                href="https://github.com/puntorigen"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors group"
              >
                <Github className="w-5 h-5" />
                <span className="text-sm font-medium">GitHub</span>
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
              </a>
            </motion.div>
          </div>
        </div>
      </section>

      {/* SECTION 3: THE STORY */}
      <section className="light-section py-20 sm:py-28 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-emerald-600 text-sm font-semibold tracking-widest uppercase">
              The Journey
            </span>
          </motion.div>

          <div className="space-y-8">
            <StoryCard
              icon={Lightbulb}
              title="The Problem I Noticed"
              description="After decades of building software, I kept seeing the same pattern: founders wasting months rebuilding growth features from scratch. Referral systems, credit mechanics, waitlists — the same building blocks, reinvented over and over."
              index={0}
            />
            
            <StoryCard
              icon={Rocket}
              title="My Solution"
              description="I started FenixBlack to change that. Every product I build is designed to give creators superpowers — the same growth mechanics that power billion-dollar apps, available to anyone in minutes, not months."
              index={1}
            />
            
            <StoryCard
              icon={Heart}
              title="My Philosophy"
              description="The best tools are the ones you don't have to think about — they just work. Simple on the surface, powerful underneath. Three decades of experience distilled into tools that anyone can use."
              index={2}
            />
          </div>
        </div>
      </section>

      {/* SECTION 4: FEATURED WORK */}
      <section className="light-section py-20 sm:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-purple-600 text-sm font-semibold tracking-widest uppercase mb-4 block">
              Featured Work
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              A Few Things I&apos;ve Built
            </h2>
            <p className="text-gray-600 max-w-xl mx-auto">
              From AI-powered tools to developer infrastructure — here are some recent projects.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {featuredProducts.map((product, index) => (
              <ProductCard key={product.name} product={product} index={index} />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <a
              href="https://github.com/puntorigen"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <span>Explore more on GitHub</span>
              <ArrowRight className="w-4 h-4" />
            </a>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5: CONNECT */}
      <section 
        className="dark-section py-24 sm:py-32"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Building something interesting?
            </h2>
            <p className="text-gray-400 text-lg sm:text-xl mb-10 max-w-xl mx-auto">
              I&apos;d love to hear about it. Whether you need advice, collaboration, or just want to chat about tech — let&apos;s connect.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.a
                href="https://www.linkedin.com/in/pschaffner/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto justify-center"
                style={{
                  background: 'linear-gradient(to right, #10b981, #14b8a6)',
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Linkedin className="w-5 h-5" />
                <span>Connect on LinkedIn</span>
              </motion.a>
              
              <motion.a
                href="https://github.com/puntorigen"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-8 py-4 rounded-xl font-semibold text-white border border-gray-700 hover:border-gray-500 hover:bg-white/5 transition-all duration-200 w-full sm:w-auto justify-center"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Github className="w-5 h-5" />
                <span>View GitHub</span>
              </motion.a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Bottom spacer - reserved for future punch line */}
      <section className="dark-section py-8 bg-gray-900 border-t border-gray-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Reserved for future content */}
        </div>
      </section>
    </div>
  );
}
