import { readFileSync } from 'fs';
import { join } from 'path';
import { parseChangelog, getCategoryStyle, formatChangelogDate } from '@/lib/changelog';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Changelog - GrowthKit SDK',
  description: 'Track all the features, fixes, and improvements in the GrowthKit SDK. Stay up to date with the latest changes.',
};

// Read and parse changelog at build time
function getChangelog() {
  const filePath = join(process.cwd(), 'sdk/CHANGELOG.md');
  const content = readFileSync(filePath, 'utf-8');
  return parseChangelog(content);
}

export default function ChangelogPage() {
  const entries = getChangelog();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50/30">
      {/* Header Section */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-2 text-primary mb-4">
              <span className="text-2xl">📋</span>
              <span className="text-sm font-semibold uppercase tracking-wider">Changelog</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
              What&apos;s New in{' '}
              <span 
                style={{
                  background: 'linear-gradient(to right, #10b981, #a855f7)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                GrowthKit SDK
              </span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Every feature, fix, and improvement — tracked and documented.
            </p>
          </div>
          
          {/* Timeline */}
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 sm:left-8 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-purple-400 to-gray-200" />
            
            {/* Entries */}
            <div className="space-y-8">
              {entries.map((entry, index) => (
                <div key={entry.version} className="relative pl-8 sm:pl-20">
                  {/* Timeline dot */}
                  <div 
                    className={`absolute left-0 sm:left-8 -translate-x-1/2 w-4 h-4 rounded-full border-4 border-white shadow-md ${
                      index === 0 
                        ? 'bg-primary' 
                        : 'bg-gray-300'
                    }`}
                    style={index === 0 ? { background: 'linear-gradient(to right, #10b981, #14b8a6)' } : undefined}
                  />
                  
                  {/* Version card */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
                    {/* Card header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="text-xl font-bold text-gray-900">
                          v{entry.version}
                        </span>
                        {index === 0 && (
                          <span 
                            className="px-2 py-0.5 text-xs font-semibold rounded-full text-white"
                            style={{ background: 'linear-gradient(to right, #10b981, #14b8a6)' }}
                          >
                            Latest
                          </span>
                        )}
                      </div>
                      <time className="text-sm text-gray-500">
                        {formatChangelogDate(entry.date)}
                      </time>
                    </div>
                    
                    {/* Card content */}
                    <div className="px-6 py-5 space-y-5">
                      {entry.categories.map((category) => {
                        const style = getCategoryStyle(category.name);
                        return (
                          <div key={category.name}>
                            <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium ${style.bgColor} ${style.color} mb-3`}>
                              <span>{style.icon}</span>
                              <span>{category.name}</span>
                            </div>
                            <ul className="space-y-2 ml-1">
                              {category.items.map((item, itemIndex) => (
                                <li key={itemIndex} className="flex items-start space-x-2 text-gray-700 text-sm leading-relaxed">
                                  <span className="text-gray-300 mt-1.5">•</span>
                                  <span 
                                    dangerouslySetInnerHTML={{ 
                                      __html: formatMarkdownInline(item) 
                                    }} 
                                  />
                                </li>
                              ))}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Footer note */}
          <div className="mt-16 text-center">
            <p className="text-sm text-gray-500">
              This changelog is automatically generated from{' '}
              <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">
                sdk/CHANGELOG.md
              </code>
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Simple inline markdown formatting (bold, code, links)
 */
function formatMarkdownInline(text: string): string {
  return text
    // Bold
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="px-1 py-0.5 bg-gray-100 rounded text-xs font-mono text-gray-800">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-primary hover:underline">$1</a>');
}

