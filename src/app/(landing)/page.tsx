import HeroSection from '@/components/landing/sections/HeroSection';
import FeaturesDemo from '@/components/landing/sections/FeaturesDemo';
import RealExamplesShowcase from '@/components/landing/sections/RealExamplesShowcase';
import IntegrationShowcase from '@/components/landing/sections/IntegrationShowcase';
import CTASection from '@/components/landing/sections/CTASection';

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <FeaturesDemo />
      <RealExamplesShowcase />
      
      <IntegrationShowcase />

      <CTASection />
    </>
  );
}
