export interface MiniAppExample {
  id: string;
  name: string;
  description: string;
  category: string;
  url?: string; // Optional - for real apps that can be shared
  metrics: {
    userGrowth: string;
    viralCoefficient?: string;
    retentionImprovement?: string;
    creditsEarned?: string;
    referrals?: string;
    timeframe: string;
  };
  screenshot: string;
  tags: string[];
  testimonial?: {
    quote: string;
    author: string;
    role: string;
  };
}

// Real mini-app examples using GrowthKit
export const miniAppExamples: MiniAppExample[] = [
  {
    id: 'restore-photos',
    name: 'Restore Photos',
    description: 'Breathe new life into your old photographs. Correct, restore, and animate your memories in a few clicks.',
    category: 'SaaS & AI',
    metrics: {
      userGrowth: '300%',
      viralCoefficient: '0.45',
      retentionImprovement: '80%',
      creditsEarned: '15K',
      timeframe: '3 months'
    },
    screenshot: '/landing/examples/restore-demo2.jpg',
    tags: ['SaaS', 'AI', 'Photography'],
    testimonial: {
      quote: "GrowthKit transformed our user acquisition. The referral system alone increased our signups by 300% in just 3 months.",
      author: "Pablo Schaffner",
      role: "Co-founder, Restore Photos"
    }
  },
  {
    id: 'creative-design',
    name: 'PixelCraft Studio',
    description: 'Creative design tool for social media graphics with AI-powered templates',
    category: 'Creative & Design',
    metrics: {
      userGrowth: '250%',
      viralCoefficient: '0.38',
      creditsEarned: '22K',
      referrals: '1,800',
      timeframe: '4 months'
    },
    screenshot: '/landing/examples/taskflow-pro-placeholder.svg',
    tags: ['Creative', 'Design', 'AI', 'Social Media'],
    testimonial: {
      quote: "The credit system keeps users engaged while the referral program brings in high-quality leads. It's brilliant.",
      author: "Marcus Rodriguez",
      role: "Founder, PixelCraft Studio"
    }
  },
  {
    id: 'fintech-app',
    name: 'WealthTracker',
    description: 'Personal finance management with investment tracking and budgeting tools',
    category: 'FinTech & Finance',
    metrics: {
      userGrowth: '180%',
      retentionImprovement: '65%',
      creditsEarned: '8.5K',
      referrals: '1,200',
      timeframe: '2 months'
    },
    screenshot: '/landing/examples/taskflow-pro-placeholder.svg',
    tags: ['FinTech', 'Finance', 'Investment', 'Budgeting'],
    testimonial: {
      quote: "The waitlist feature created incredible FOMO. We had 500 signups before launch and converted 80% to paid users.",
      author: "Jennifer Liu",
      role: "Product Manager, WealthTracker"
    }
  },
  {
    id: 'edu-platform',
    name: 'LearnForge',
    description: 'Online learning platform with interactive courses and skill assessments',
    category: 'Education & Learning',
    metrics: {
      userGrowth: '400%',
      viralCoefficient: '0.52',
      retentionImprovement: '90%',
      creditsEarned: '35K',
      timeframe: '5 months'
    },
    screenshot: '/landing/examples/taskflow-pro-placeholder.svg',
    tags: ['Education', 'Learning', 'Courses', 'Skills'],
    testimonial: {
      quote: "Students love earning credits for completing courses and referring friends. Our engagement metrics are through the roof.",
      author: "Dr. Alex Kumar",
      role: "CEO, LearnForge"
    }
  }
];

// Dashboard screenshot placeholders
export const dashboardScreenshots = {
  overview: {
    title: 'Analytics Dashboard',
    description: 'Real-time metrics across all your apps',
    image: '/landing/screenshots/dashboard-overview-PLACEHOLDER.svg',
    features: ['User Growth Tracking', 'Referral Analytics', 'Credit Management', 'Revenue Insights']
  },
  appsManagement: {
    title: 'Multi-App Management',
    description: 'Manage all your growth-enabled apps from one place',
    image: '/landing/screenshots/apps-management-PLACEHOLDER.svg',
    features: ['App Configuration', 'API Key Management', 'Policy Settings', 'Usage Monitoring']
  },
  userDetails: {
    title: 'User Insights',
    description: 'Deep dive into user behavior and referral patterns',
    image: '/landing/screenshots/dashboard-overview-PLACEHOLDER.svg',
    features: ['User Journey Tracking', 'Referral Trees', 'Credit History', 'Engagement Metrics']
  }
};

// Feature demonstrations data
export const featureDetails = [
  {
    id: 'fingerprinting',
    title: 'Smart User Fingerprinting',
    description: 'Track users across sessions without requiring login',
    icon: 'Fingerprint',
    color: 'primary',
    benefits: [
      'Anonymous user tracking',
      'Cross-session persistence',
      'Privacy-friendly identification',
      'Seamless user experience'
    ],
    codeExample: `const gk = useGrowthKit({
  publicKey: 'pk_your_public_key'
});
// Automatically generates unique fingerprint
// and tracks user across sessions`
  },
  {
    id: 'referrals',
    title: 'Viral Referral System',
    description: 'Turn every user into a growth engine',
    icon: 'Share2',
    color: 'fenix-purple',
    benefits: [
      'Unique referral codes per user',
      'Automatic credit distribution',
      'Anti-abuse protection',
      'Viral coefficient tracking'
    ],
    codeExample: `// User gets their referral link
const referralLink = gk.getReferralLink();

// Share and earn credits when friends join
await gk.share();`
  },
  {
    id: 'credits',
    title: 'Flexible Credit System',
    description: 'Reward engagement and incentivize actions',
    icon: 'Coins',
    color: 'fenix-orange',
    benefits: [
      'Customizable credit policies',
      'Action-based spending',
      'Progress gamification',
      'Retention improvement'
    ],
    codeExample: `// Users earn credits for actions
await gk.claimEmail('user@example.com');
await gk.verifyEmail(token);

// Spend credits for premium features
await gk.completeAction('premium-generation');`
  },
  {
    id: 'waitlist',
    title: 'Smart Waitlist Management',
    description: 'Build anticipation and manage early access',
    icon: 'Clock',
    color: 'fenix-magenta',
    benefits: [
      'Automated invitation system',
      'Priority queue management',
      'FOMO-driven signups',
      'Launch readiness tracking'
    ],
    codeExample: `// Join waitlist with automatic invitations
await gk.joinWaitlist('early-adopter@email.com');

// Admin controls invitation batches
await inviteNextBatch(30); // Invite 30 users`
  }
];
