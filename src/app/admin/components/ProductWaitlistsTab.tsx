'use client';

import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import ContentCard from '@/components/ui/ContentCard';
import { Plus, Settings, Users, Copy, CheckCircle, Edit2, Trash2, BarChart3 } from 'lucide-react';
import { ProductWaitlistConfig } from '@/lib/types/product-waitlist';
import ProductWaitlistForm from './ProductWaitlistForm';
import ProductWaitlistDetail from './ProductWaitlistDetail';

interface ProductWithCounts extends ProductWaitlistConfig {
  _count: {
    total: number;
    waiting: number;
    invited: number;
    accepted: number;
  };
}

interface ProductWaitlistsTabProps {
  appId: string;
  appName: string;
}

export default function ProductWaitlistsTab({ appId, appName }: ProductWaitlistsTabProps) {
  const [products, setProducts] = useState<ProductWithCounts[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductWaitlistConfig | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<ProductWithCounts | null>(null);
  const [copiedTag, setCopiedTag] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [appId]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/v1/admin/app/${appId}/products`, {
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data.products || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = (product: ProductWithCounts, type: 'react' | 'vanilla') => {
    const code = type === 'react'
      ? `<WaitlistForm productTag="${product.tag}" mode="inline" />`
      : `GrowthKit.renderWaitlist('#container', {\n  productTag: '${product.tag}',\n  mode: 'inline'\n});`;

    navigator.clipboard.writeText(code);
    setCopiedTag(product.tag);
    setTimeout(() => setCopiedTag(null), 2000);
  };

  const handleDelete = async (tag: string) => {
    if (!confirm('Are you sure you want to disable this product waitlist? Existing entries will be preserved.')) {
      return;
    }

    try {
      const response = await fetch(`/api/v1/admin/app/${appId}/products/${tag}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${process.env.SERVICE_KEY || 'growth-kit-service-admin-key-2025'}`,
        },
      });

      if (response.ok) {
        fetchProducts();
      }
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  if (selectedProduct) {
    return (
      <ProductWaitlistDetail
        appId={appId}
        product={selectedProduct}
        onBack={() => {
          setSelectedProduct(null);
          fetchProducts();
        }}
      />
    );
  }

  if (showForm || editingProduct) {
    return (
      <ProductWaitlistForm
        appId={appId}
        product={editingProduct}
        onCancel={() => {
          setShowForm(false);
          setEditingProduct(null);
        }}
        onSave={() => {
          setShowForm(false);
          setEditingProduct(null);
          fetchProducts();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Product Waitlists</h3>
          <p className="text-sm text-gray-600 mt-1">
            Create embeddable waitlists for specific features or products
          </p>
        </div>
        <Button
          variant="primary"
          icon={<Plus size={16} />}
          onClick={() => setShowForm(true)}
        >
          New Product Waitlist
        </Button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading products...</div>
      ) : products.length === 0 ? (
        <ContentCard className="text-center py-16">
          <div className="max-w-md mx-auto">
            <Users size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Product Waitlists Yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first product waitlist to start collecting interest for specific features, tiers, or products.
            </p>
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => setShowForm(true)}
            >
              Create First Product Waitlist
            </Button>
          </div>
        </ContentCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ContentCard 
              key={product.tag}
              className="hover:shadow-lg transition-shadow duration-200"
            >
              {/* Product Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-gray-900">{product.name}</h4>
                    {!product.enabled && (
                      <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                        Disabled
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-mono text-gray-500">{product.tag}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEditingProduct(product)}
                    className="p-1.5 text-gray-400 hover:text-primary hover:bg-primary/5 rounded transition-colors"
                    title="Edit"
                  >
                    <Edit2 size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(product.tag)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {product.description}
                </p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-3 gap-2 mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-900">{product._count.waiting}</div>
                  <div className="text-xs text-gray-500">Waiting</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-fenix-orange">{product._count.invited}</div>
                  <div className="text-xs text-gray-500">Invited</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-primary">{product._count.accepted}</div>
                  <div className="text-xs text-gray-500">Accepted</div>
                </div>
              </div>

              {/* Auto-invite Status */}
              {product.autoInviteEnabled ? (
                <div className="text-xs text-gray-600 mb-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
                  Auto-invite: {product.dailyInviteQuota}/day at {product.inviteTime}
                </div>
              ) : (
                <div className="text-xs text-gray-400 mb-3 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 bg-gray-300 rounded-full"></div>
                  Auto-invite: Disabled
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mb-4">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<Users size={14} />}
                  onClick={() => setSelectedProduct(product)}
                  className="flex-1"
                >
                  Manage
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<BarChart3 size={14} />}
                  onClick={() => setSelectedProduct(product)}
                  className="flex-1"
                >
                  Analytics
                </Button>
              </div>

              {/* Implementation Code */}
              <div className="border-t pt-4">
                <div className="text-xs font-medium text-gray-700 mb-2">Implementation:</div>
                <div className="space-y-2">
                  <div className="bg-gray-900 rounded p-2 flex items-start justify-between group">
                    <code className="text-xs text-emerald-400 flex-1 font-mono break-all">
                      {`<WaitlistForm productTag="${product.tag}" mode="inline" />`}
                    </code>
                    <button
                      onClick={() => handleCopyCode(product, 'react')}
                      className="ml-2 p-1 text-gray-400 hover:text-white transition-colors flex-shrink-0"
                      title="Copy React code"
                    >
                      {copiedTag === product.tag ? (
                        <CheckCircle size={14} className="text-primary" />
                      ) : (
                        <Copy size={14} />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </ContentCard>
          ))}
        </div>
      )}
    </div>
  );
}

