/**
 * Changelog Parser
 * Parses CHANGELOG.md (Keep a Changelog format) into structured data
 */

export interface ChangelogCategory {
  name: string;
  items: string[];
}

export interface ChangelogEntry {
  version: string;
  date: string;
  categories: ChangelogCategory[];
}

/**
 * Parse a CHANGELOG.md string into structured entries
 */
export function parseChangelog(markdown: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  
  // Split by version headers (## [x.x.x] - YYYY-MM-DD)
  const versionRegex = /^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})/gm;
  const sections = markdown.split(/(?=^## \[)/m).filter(s => s.trim());
  
  for (const section of sections) {
    const headerMatch = section.match(/^## \[([^\]]+)\] - (\d{4}-\d{2}-\d{2})/);
    if (!headerMatch) continue;
    
    const version = headerMatch[1];
    const date = headerMatch[2];
    const categories: ChangelogCategory[] = [];
    
    // Split by category headers (### Added, ### Changed, etc.)
    const categoryBlocks = section.split(/(?=^### )/m).slice(1);
    
    for (const block of categoryBlocks) {
      const categoryMatch = block.match(/^### (.+)/);
      if (!categoryMatch) continue;
      
      const categoryName = categoryMatch[1].trim();
      const items: string[] = [];
      
      // Extract bullet points (- item)
      const lines = block.split('\n').slice(1);
      let currentItem = '';
      
      for (const line of lines) {
        if (line.match(/^- /)) {
          if (currentItem) {
            items.push(currentItem.trim());
          }
          currentItem = line.replace(/^- /, '');
        } else if (line.match(/^\s+/) && currentItem) {
          // Continuation of previous item
          currentItem += ' ' + line.trim();
        }
      }
      
      if (currentItem) {
        items.push(currentItem.trim());
      }
      
      if (items.length > 0) {
        categories.push({ name: categoryName, items });
      }
    }
    
    if (categories.length > 0) {
      entries.push({ version, date, categories });
    }
  }
  
  return entries;
}

/**
 * Get icon and color for a changelog category
 */
export function getCategoryStyle(name: string): { icon: string; color: string; bgColor: string } {
  const normalized = name.toLowerCase();
  
  if (normalized.includes('added')) {
    return { icon: '✨', color: 'text-emerald-600', bgColor: 'bg-emerald-50' };
  }
  if (normalized.includes('changed')) {
    return { icon: '🔄', color: 'text-blue-600', bgColor: 'bg-blue-50' };
  }
  if (normalized.includes('fixed')) {
    return { icon: '🐛', color: 'text-amber-600', bgColor: 'bg-amber-50' };
  }
  if (normalized.includes('removed') || normalized.includes('deprecated')) {
    return { icon: '🗑️', color: 'text-red-600', bgColor: 'bg-red-50' };
  }
  if (normalized.includes('performance')) {
    return { icon: '⚡', color: 'text-purple-600', bgColor: 'bg-purple-50' };
  }
  if (normalized.includes('security')) {
    return { icon: '🔒', color: 'text-rose-600', bgColor: 'bg-rose-50' };
  }
  if (normalized.includes('dependencies')) {
    return { icon: '📦', color: 'text-gray-600', bgColor: 'bg-gray-50' };
  }
  if (normalized.includes('note')) {
    return { icon: '📝', color: 'text-slate-600', bgColor: 'bg-slate-50' };
  }
  if (normalized.includes('improved')) {
    return { icon: '📈', color: 'text-teal-600', bgColor: 'bg-teal-50' };
  }
  if (normalized.includes('technical')) {
    return { icon: '🔧', color: 'text-indigo-600', bgColor: 'bg-indigo-50' };
  }
  
  // Default
  return { icon: '📋', color: 'text-gray-600', bgColor: 'bg-gray-50' };
}

/**
 * Format date to human readable
 */
export function formatChangelogDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

