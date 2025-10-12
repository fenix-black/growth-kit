'use client';

import { useState, useEffect } from 'react';
import { App } from '@prisma/client';
import ContentCard from '@/components/ui/ContentCard';
import Button from '@/components/ui/Button';

interface Document {
  id: string;
  title: string;
  status: string;
  chunkCount: number;
  createdAt: string;
}

interface KnowledgeBaseCardProps {
  app: App;
}

export function KnowledgeBaseCard({ app }: KnowledgeBaseCardProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/admin/chat/knowledge?appId=${app.id}`);
      const data = await response.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Fetch documents error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [app.id]);

  const handleUpload = async () => {
    if (!title.trim() || !content.trim()) {
      alert('Please provide title and content');
      return;
    }

    setIsUploading(true);
    try {
      const response = await fetch('/api/admin/chat/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: app.id,
          title,
          content,
          sourceType: 'manual'
        })
      });

      if (!response.ok) throw new Error('Upload failed');
      
      setTitle('');
      setContent('');
      fetchDocuments();
      alert('Document uploaded successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/admin/chat/knowledge?documentId=${documentId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Delete failed');
      
      fetchDocuments();
      alert('Document deleted successfully!');
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document');
    }
  };

  return (
    <ContentCard title="Knowledge Base">
      <div className="space-y-4">
        {/* Upload form */}
        <div className="space-y-3 p-4 border rounded-lg bg-gray-50">
          <h4 className="font-medium">Add Document</h4>
          <div>
            <label htmlFor="docTitle" className="block text-sm font-medium mb-2">Title</label>
            <input
              id="docTitle"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Product FAQ"
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label htmlFor="docContent" className="block text-sm font-medium mb-2">Content</label>
            <textarea
              id="docContent"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your documentation here..."
              rows={8}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <Button onClick={handleUpload} disabled={isUploading}>
            {isUploading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>

        {/* Documents list */}
        <div>
          <h4 className="font-medium mb-3">Uploaded Documents ({documents.length})</h4>
          {isLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : documents.length === 0 ? (
            <p className="text-gray-500">No documents uploaded yet</p>
          ) : (
            <div className="space-y-2">
              {documents.map(doc => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <div className="font-medium">{doc.title}</div>
                    <div className="text-sm text-gray-500">
                      {doc.chunkCount} chunks • {doc.status}
                    </div>
                  </div>
                  <Button 
                    variant="danger" 
                    onClick={() => handleDelete(doc.id)}
                  >
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ContentCard>
  );
}

