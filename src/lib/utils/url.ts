/**
 * Build a URL with the correct protocol based on the domain
 * Uses http:// for localhost/127.0.0.1, https:// for everything else
 */
export function buildAppUrl(domain: string, path: string = ''): string {
  const isLocalhost = domain === 'localhost' || 
                     domain === '127.0.0.1' || 
                     domain.startsWith('localhost:') || 
                     domain.startsWith('127.0.0.1:');
  
  const protocol = isLocalhost ? 'http' : 'https';
  return `${protocol}://${domain}${path}`;
}
