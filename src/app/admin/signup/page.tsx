'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2, User, Building, ArrowRight, Sparkles, Shield, Rocket, BarChart3 } from 'lucide-react';
import ScrollReveal from '@/components/landing/animations/ScrollReveal';

export default function AdminSignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Basic validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          organizationName: formData.organizationName
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Redirect to login with success message
        router.push('/admin/login?message=Account created successfully');
      } else {
        setError(data.message || 'Failed to create account');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Marketing & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-fenix-magenta/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(16,185,129,0.1),transparent_50%),radial-gradient(circle_at_70%_70%,rgba(217,70,239,0.1),transparent_50%)]"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 py-12 text-white">
          <ScrollReveal direction="up" delay={0.2}>
            <div className="mb-12">
              <Link 
                href="https://growth.fenixblack.ai" 
                className="inline-block transition-opacity hover:opacity-80"
              >
                <Image
                  src="/growthkit-logo-dark-alpha.png"
                  alt="GrowthKit"
                  width={180}
                  height={60}
                  className="mb-8"
                />
              </Link>
              <h1 className="text-4xl font-bold mb-6 leading-tight text-white">
                Start your journey to
                <span 
                  className="block"
                  style={{
                    background: 'linear-gradient(to right, #10b981, #d946ef)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  Exponential Growth
                </span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Join thousands of marketers and businesses using GrowthKit to generate more leads, build powerful referral programs, and turn visitors into customers.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.4}>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Rocket className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Launch in Minutes</h3>
                  <p className="text-sm text-slate-300">Get your growth system up and running instantly</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="p-2 rounded-lg bg-fenix-magenta/20">
                  <BarChart3 className="w-6 h-6 text-fenix-magenta" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Marketing Insights</h3>
                  <p className="text-sm text-slate-300">Track conversion rates, lead quality, and campaign performance</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Enterprise Security</h3>
                  <p className="text-sm text-slate-300">Bank-grade security with SOC 2 compliance</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.6}>
            <Link 
              href="https://www.fenixblack.ai" 
              target="_blank" 
              rel="noopener noreferrer"
              className="block mt-12 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-fenix-magenta/10 border border-primary/30 transition-all hover:border-primary/50 hover:from-primary/15 hover:to-fenix-magenta/15"
            >
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Powered by FenixBlack</h3>
                  <p className="text-sm text-slate-300">
                    Enterprise-grade infrastructure with 99.9% uptime, built for scale and reliability.
                  </p>
                </div>
              </div>
            </Link>
          </ScrollReveal>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white dark:bg-slate-900">
        <div className="max-w-md mx-auto w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Link 
              href="https://growth.fenixblack.ai" 
              className="inline-block transition-opacity hover:opacity-80"
            >
              <Image
                src="/growthkit-logo-alpha.png"
                alt="GrowthKit"
                width={60}
                height={60}
                className="mx-auto mb-4"
              />
            </Link>
          </div>

          <ScrollReveal direction="fade" delay={0.1}>
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Create Your Account
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Join GrowthKit and start growing your business today
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <User size={16} />
                  Full Name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  placeholder="Enter your full name"
                  disabled={loading}
                />
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Mail size={16} />
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  placeholder="Enter your work email"
                  disabled={loading}
                />
              </div>

              {/* Organization Name Field */}
              <div className="space-y-2">
                <label htmlFor="organizationName" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Building size={16} />
                  Organization Name
                </label>
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  required
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  placeholder="Enter your company name"
                  disabled={loading}
                />
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Lock size={16} />
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    placeholder="Create a strong password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <Lock size={16} />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <ScrollReveal direction="fade" delay={0}>
                  <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500 mt-0.5 flex-shrink-0"></div>
                    {error}
                  </div>
                </ScrollReveal>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                style={{
                  background: loading ? '#6b7280' : 'linear-gradient(to right, #10b981, #14b8a6)'
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #059669, #0d9488)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.currentTarget.style.background = 'linear-gradient(to right, #10b981, #14b8a6)';
                  }
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* Login Link */}
              <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Already have an account?{' '}
                  <Link 
                    href="/admin/login" 
                    className="font-medium transition-colors inline-flex items-center gap-1"
                    style={{ color: '#10b981' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
                    onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
                  >
                    Sign in
                    <ArrowRight size={14} />
                  </Link>
                </p>
              </div>
            </form>
          </ScrollReveal>
        </div>

        {/* Footer */}
        <ScrollReveal direction="up" delay={0.3}>
          <div className="text-center mt-12 text-sm text-slate-500 dark:text-slate-400">
            <p>
              © 2025 GrowthKit. Powered by{' '}
              <Link 
                href="https://www.fenixblack.ai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="transition-colors"
                style={{ color: '#10b981' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#059669'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#10b981'}
              >
                FenixBlack
              </Link>.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}