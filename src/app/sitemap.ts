import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://growth.fenixblack.ai';
  const languages = ['en', 'es'];
  
  // Define all your pages
  const pages = [
    '', // Home page
    // Add more pages as needed:
    // '/features',
    // '/pricing',
    // '/docs',
  ];
  
  // Generate sitemap entries for each page in each language
  const sitemap: MetadataRoute.Sitemap = [];
  
  pages.forEach(page => {
    languages.forEach(lang => {
      sitemap.push({
        url: lang === 'en' ? `${baseUrl}${page}` : `${baseUrl}${page}?lang=${lang}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: page === '' ? 1 : 0.8,
        alternates: {
          languages: {
            en: `${baseUrl}${page}`,
            es: `${baseUrl}${page}?lang=es`,
          },
        },
      });
    });
  });
  
  return sitemap;
}
