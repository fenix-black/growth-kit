'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, ExternalLink, Github } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAdaptiveNav } from '@/hooks/useAdaptiveNav';

export default function LandingNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navTheme = useAdaptiveNav();

  const navItems = [
    { href: '#features', label: 'Features' },
    { href: '#examples', label: 'Examples' },
    { href: '#integration', label: 'Integration' },
    { href: '/demo', label: 'Demo' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-lg border-b transition-all duration-500 ${
      navTheme.isDark 
        ? 'bg-white/10 border-white/20 shadow-lg shadow-black/20' 
        : 'bg-gradient-to-r from-white/90 via-blue-50/90 to-white/90 border-gray-200/50'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Image
                src="/growthkit-logo-icon-24px.png"
                alt="GrowthKit"
                width={48}
                height={48}
                className="group-hover:scale-105 transition-transform duration-200"
              />
              {/* Glow effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-secondary rounded-lg opacity-0 group-hover:opacity-20 blur-md transition-opacity duration-200 -z-10"></div>
            </div>
            <div>
              <span className={`text-xl font-bold transition-colors duration-500 ${navTheme.textColor}`}>
                GrowthKit
              </span>
              <div className={`text-xs -mt-1 transition-colors duration-500 ${
                navTheme.isDark ? 'text-gray-300' : 'text-gray-500'
              }`}>
                by FenixBlack
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition-all duration-500 hover:text-primary ${
                  navTheme.isDark ? 'text-gray-200' : 'text-gray-600'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              href="https://github.com/fenix-black/growth-kit"
              target="_blank"
              rel="noopener noreferrer"
              className={`transition-all duration-500 ${
                navTheme.isDark ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Github className="w-5 h-5" />
            </Link>
            <Link
              href="/admin"
              className={`font-medium flex items-center space-x-1 transition-all duration-500 hover:text-primary ${
                navTheme.isDark ? 'text-gray-200' : 'text-gray-600'
              }`}
            >
              <span>Dashboard</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
            <Link
              href="#get-started"
              className={`px-4 py-2 rounded-lg font-medium transition-all duration-500 hover:scale-105 ${
                navTheme.isDark 
                  ? 'bg-white text-gray-900 hover:bg-gray-100 shadow-lg' 
                  : 'bg-primary text-white hover:shadow-lg hover:shadow-primary/25'
              }`}
              style={!navTheme.isDark ? {
                background: 'linear-gradient(to right, #10b981, #14b8a6)',
              } : {}}
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className={`md:hidden p-2 transition-all duration-500 ${
              navTheme.isDark ? 'text-gray-200 hover:text-white' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className={`md:hidden border-t transition-colors duration-500 ${
              navTheme.isDark 
                ? 'bg-gray-800/95 border-white/20 backdrop-blur-lg' 
                : 'bg-white border-gray-100'
            }`}
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg transition-all duration-500 hover:text-primary ${
                    navTheme.isDark 
                      ? 'text-gray-200 hover:bg-white/10' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <div className={`pt-4 mt-4 border-t transition-colors duration-500 ${
                navTheme.isDark ? 'border-white/20' : 'border-gray-100'
              }`}>
                <Link
                  href="/admin"
                  className={`block px-3 py-2 rounded-lg transition-all duration-500 hover:text-primary flex items-center space-x-2 ${
                    navTheme.isDark 
                      ? 'text-gray-200 hover:bg-white/10' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span>Dashboard</span>
                  <ExternalLink className="w-4 h-4" />
                </Link>
                <Link
                  href="#get-started"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block mt-2 px-3 py-2 rounded-lg font-medium text-center transition-all duration-500 ${
                    navTheme.isDark 
                      ? 'bg-white text-gray-900' 
                      : 'bg-primary text-white'
                  }`}
                  style={!navTheme.isDark ? {
                    background: 'linear-gradient(to right, #10b981, #14b8a6)',
                  } : {}}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
