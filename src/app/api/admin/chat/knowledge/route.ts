import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { isAdminAuthenticated } from '@/lib/auth/admin';
import { processDocument } from '@/lib/chat/document-processor';
import { deleteDocumentChunks } from '@/lib/chat/upstash-vector';

export async function GET(request: NextRequest) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const appId = searchParams.get('appId');

  if (!appId) {
    return NextResponse.json({ error: 'Missing appId' }, { status: 400 });
  }

  const config = await prisma.chatConfiguration.findUnique({
    where: { appId },
    include: {
      knowledgeDocuments: {
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          title: true,
          sourceType: true,
          sourceUrl: true,
          status: true,
          chunkCount: true,
          createdAt: true
        }
      }
    }
  });

  return NextResponse.json({ 
    documents: config?.knowledgeDocuments || [] 
  });
}

export async function POST(request: NextRequest) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { appId, title, content, sourceType = 'manual', sourceUrl } = body;

  if (!appId || !title || !content) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Get or create chat config
  let config = await prisma.chatConfiguration.findUnique({
    where: { appId },
    select: { id: true }
  });

  if (!config) {
    config = await prisma.chatConfiguration.create({
      data: { appId, enabled: true },
      select: { id: true }
    });
  }

  // Create document
  const document = await prisma.chatKnowledgeDocument.create({
    data: {
      configId: config.id,
      title,
      content,
      sourceType,
      sourceUrl,
      status: 'processing'
    }
  });

  // Process document in background (simplified - in production use a queue)
  processDocumentAsync(document.id, appId, content, title);

  return NextResponse.json({ 
    document: {
      id: document.id,
      title: document.title,
      status: 'processing'
    }
  });
}

export async function DELETE(request: NextRequest) {
  const isAuthenticated = await isAdminAuthenticated();
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const documentId = searchParams.get('documentId');

  if (!documentId) {
    return NextResponse.json({ error: 'Missing documentId' }, { status: 400 });
  }

  // Get chunks to delete from vector DB
  const chunks = await prisma.chatKnowledgeChunk.findMany({
    where: { documentId },
    select: { upstashId: true }
  });

  const chunkIds = chunks.map(c => c.upstashId).filter(Boolean) as string[];

  // Delete from vector DB
  if (chunkIds.length > 0) {
    await deleteDocumentChunks(chunkIds);
  }

  // Delete document and chunks from DB (cascade will handle chunks)
  await prisma.chatKnowledgeDocument.delete({
    where: { id: documentId }
  });

  return NextResponse.json({ success: true });
}

// Process document asynchronously
async function processDocumentAsync(
  documentId: string,
  appId: string,
  content: string,
  title: string
) {
  try {
    const chunkCount = await processDocument(documentId, appId, content, title);
    
    // Update document status
    await prisma.chatKnowledgeDocument.update({
      where: { id: documentId },
      data: {
        status: 'ready',
        chunkCount
      }
    });
  } catch (error) {
    console.error('Document processing error:', error);
    await prisma.chatKnowledgeDocument.update({
      where: { id: documentId },
      data: { status: 'error' }
    });
  }
}

