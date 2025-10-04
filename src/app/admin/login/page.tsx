'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Sparkles, TrendingUp, Users, Zap } from 'lucide-react';
import ScrollReveal from '@/components/landing/animations/ScrollReveal';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setSuccess(message);
      // Clear the URL parameter
      const url = new URL(window.location.href);
      url.searchParams.delete('message');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
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
              <Image
                src="/growthkit-logo-dark-alpha.png"
                alt="GrowthKit"
                width={180}
                height={60}
                className="mb-8"
              />
              <h1 className="text-4xl font-bold mb-6 leading-tight">
                Welcome back to your
                <span className="block bg-gradient-to-r from-primary to-fenix-magenta bg-clip-text text-transparent">
                  Growth Dashboard
                </span>
              </h1>
              <p className="text-xl text-slate-300 leading-relaxed">
                Access your marketing hub to track leads, manage waitlists, and grow your business with powerful referral systems and automation.
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.4}>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="p-2 rounded-lg bg-primary/20">
                  <TrendingUp className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Lead Generation</h3>
                  <p className="text-sm text-slate-300">Turn visitors into qualified leads with proven systems</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="p-2 rounded-lg bg-fenix-magenta/20">
                  <Users className="w-6 h-6 text-fenix-magenta" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Waitlist Management</h3>
                  <p className="text-sm text-slate-300">Build anticipation and convert interest into sales</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20">
                <div className="p-2 rounded-lg bg-secondary/20">
                  <Zap className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Referral Programs</h3>
                  <p className="text-sm text-slate-300">Harness the power of word-of-mouth marketing</p>
                </div>
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.6}>
            <div className="mt-12 p-6 rounded-xl bg-gradient-to-r from-primary/10 to-fenix-magenta/10 border border-primary/30">
              <div className="flex items-start gap-3">
                <Sparkles className="w-6 h-6 text-primary mt-1" />
                <div>
                  <h3 className="font-semibold text-white mb-2">Powered by FenixBlack</h3>
                  <p className="text-sm text-slate-300">
                    Enterprise-grade infrastructure with 99.9% uptime, built for scale and reliability.
                  </p>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 py-12 bg-white dark:bg-slate-900">
        <div className="max-w-md mx-auto w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <Image
              src="/growthkit-logo-alpha.png"
              alt="GrowthKit"
              width={60}
              height={60}
              className="mx-auto mb-4"
            />
          </div>

          <ScrollReveal direction="fade" delay={0.1}>
            <div className="text-center lg:text-left mb-8">
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                Welcome Back
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                Sign in to access your GrowthKit dashboard
              </p>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="up" delay={0.2}>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                  placeholder="Enter your email"
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-200"
                    placeholder="Enter your password"
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

              {/* Success Message */}
              {success && (
                <ScrollReveal direction="fade" delay={0}>
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 text-sm flex items-start gap-3">
                    <div className="w-4 h-4 rounded-full bg-green-500 mt-0.5 flex-shrink-0"></div>
                    {success}
                  </div>
                </ScrollReveal>
              )}

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
                className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-medium py-4 px-6 rounded-xl transition-all duration-200 transform hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              {/* Signup Link */}
              <div className="text-center pt-4 border-t border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Need an account?{' '}
                  <Link 
                    href="/admin/signup" 
                    className="font-medium text-primary hover:text-primary/80 transition-colors inline-flex items-center gap-1"
                  >
                    Create account
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
            <p>© 2025 GrowthKit. Powered by FenixBlack.</p>
          </div>
        </ScrollReveal>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Image
            src="/growthkit-logo-alpha.png"
            alt="GrowthKit"
            width={60}
            height={60}
            className="mx-auto mb-4 animate-pulse"
          />
          <p className="text-slate-600 dark:text-slate-400">Loading...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}