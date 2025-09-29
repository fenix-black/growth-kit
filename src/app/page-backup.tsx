export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -inset-[10px] opacity-50">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div className="absolute top-0 -right-4 w-72 h-72 bg-yellow-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>
      </div>

      {/* Main content */}
      <main className="relative z-10 text-center px-6">
        <div className="space-y-8">
          {/* Logo/Brand */}
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform duration-200">
              <span className="text-white text-3xl font-bold">F</span>
            </div>
          </div>

          {/* Main Title */}
          <div className="space-y-2">
            <h1 className="text-5xl md:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500 animate-gradient">
              FenixBlack.ai
            </h1>
            <div className="flex items-center justify-center gap-3 text-gray-400">
              <div className="h-px w-12 bg-gradient-to-r from-transparent to-gray-600"></div>
              <span className="text-xl md:text-2xl font-light tracking-wider">GrowthKit Server</span>
              <div className="h-px w-12 bg-gradient-to-l from-transparent to-gray-600"></div>
            </div>
          </div>

          {/* Status indicators */}
          <div className="flex justify-center gap-8 mt-12">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-gray-400 text-sm">System Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 bg-blue-500 rounded-full animate-pulse animation-delay-1000"></div>
              <span className="text-gray-400 text-sm">API Active</span>
            </div>
          </div>

          {/* Subtitle */}
          <p className="text-gray-500 max-w-md mx-auto mt-8 text-sm md:text-base">
            Powering growth with intelligent waitlist management and referral systems
          </p>

          {/* CTA Buttons */}
          <div className="flex gap-4 justify-center mt-12">
            <a
              href="/admin"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-purple-500/25 transform hover:scale-105 transition-all duration-200"
            >
              Admin Dashboard
            </a>
            <button
              disabled
              className="px-6 py-3 bg-gray-800/50 text-gray-500 rounded-lg font-medium border border-gray-700/50 cursor-not-allowed opacity-50"
              title="Coming Soon"
            >
              Documentation
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-0 w-full text-center py-6">
        <p className="text-gray-600 text-sm">
          © 2025 FenixBlack.ai • Built with Next.js & TypeScript
        </p>
      </footer>
    </div>
  );
}
