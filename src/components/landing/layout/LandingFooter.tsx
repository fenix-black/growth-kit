'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Github, ExternalLink, Heart } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';

export default function LandingFooter() {
  const { t } = useTranslation();
  
  const footerSections = [
    {
      title: t('footer.product'),
      links: [
        { href: '#features', label: t('footer.productLinks.features') },
        { href: '#examples', label: t('footer.productLinks.examples') },
        { href: '/demo', label: t('footer.productLinks.demo') },
        { href: '/admin', label: t('footer.productLinks.dashboard') },
      ]
    },
    {
      title: t('footer.developers'),
      links: [
        { href: 'https://github.com/fenix-black/growth-kit/tree/main/sdk', label: t('footer.developersLinks.sdk'), external: true },
        { href: '/api-docs', label: t('footer.developersLinks.api') },
        { href: 'https://github.com/fenix-black/growth-kit', label: t('footer.developersLinks.github'), external: true },
        { href: '/examples', label: t('footer.developersLinks.examples') },
      ]
    },
    {
      title: t('footer.resources'),
      links: [
        { href: '/blog', label: t('footer.resourcesLinks.blog') },
        { href: '/guides', label: t('footer.resourcesLinks.guides') },
        { href: '/changelog', label: t('footer.resourcesLinks.changelog') },
        { href: '/support', label: t('footer.resourcesLinks.support') },
      ]
    },
    {
      title: t('footer.company'),
      links: [
        { href: '/about', label: t('footer.companyLinks.about') },
        { href: '/contact', label: t('footer.companyLinks.contact') },
        { href: '/privacy', label: t('footer.companyLinks.privacy') },
        { href: '/terms', label: t('footer.companyLinks.terms') },
      ]
    }
  ];

  return (
    <footer className="bg-gradient-to-b from-pink-50 via-purple-50 to-indigo-50 border-t border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8">
          {/* Brand Section */}
          <div className="col-span-2 lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <Image
                src="/growthkit-logo-icon-24px.png"
                alt="GrowthKit"
                width={32}
                height={32}
              />
              <div>
                <span className="text-xl font-bold text-gray-900">
                  GrowthKit
                </span>
                <div className="text-xs text-gray-500 -mt-1">by FenixBlack</div>
              </div>
            </div>
            <p className="text-gray-600 text-sm mb-4 max-w-sm">
              {t('footer.tagline')}
            </p>
            <div className="flex space-x-4">
              <Link
                href="https://github.com/fenix-black/growth-kit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-primary transition-colors duration-200"
              >
                <Github className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      {...(link.external && { target: '_blank', rel: 'noopener noreferrer' })}
                      className="text-gray-600 hover:text-primary transition-colors duration-200 text-sm flex items-center space-x-1"
                    >
                      <span>{link.label}</span>
                      {link.external && <ExternalLink className="w-3 h-3" />}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('footer.ctaTitle')}</h3>
            <p className="text-gray-600 mb-4">{t('footer.ctaSubtitle')}</p>
            <Link
              href="#get-started"
              className="inline-flex items-center bg-primary text-white px-6 py-3 rounded-lg font-medium hover:shadow-lg hover:shadow-primary/25 transition-all duration-200 hover:scale-105"
              style={{
                background: 'linear-gradient(to right, #10b981, #14b8a6)',
              }}
            >
              {t('footer.ctaButton')}
            </Link>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <Link
            href="https://www.fenixblack.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-primary transition-colors duration-200 text-sm cursor-pointer hover:underline"
          >
            {t('footer.copyright')} <span className="font-medium">{t('footer.copyrightCompany')}</span>{t('footer.copyrightSuffix')}
          </Link>
          <div className="flex items-center space-x-1 text-gray-500 text-sm">
            <span>{t('footer.builtWith')}</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>{t('footer.builtWithSuffix')}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
