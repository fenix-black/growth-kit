import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { LLMService } from '@/lib/chat/llm-service';
import { ContextBuilder } from '@/lib/chat/context-builder';
import { ChatCreditManager } from '@/lib/chat/credit-manager';
import { MessageRouter } from '@/lib/chat/message-router';
import { CalendarService } from '@/lib/chat/calendar-service';
import { verifyAppAuth } from '@/lib/security/auth';
import { corsErrors } from '@/lib/utils/corsResponse';
import { corsHeaders } from '@/lib/middleware/cors';
import { handleSimpleOptions } from '@/lib/middleware/corsSimple';
import { addDays, startOfDay } from 'date-fns';

export async function OPTIONS(request: NextRequest) {
  return handleSimpleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  
  try {
    // Verify API key authentication
    const authContext = await verifyAppAuth(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }

    const body = await request.json();
    const { message, sessionId, fingerprint } = body;

    if (!message || !sessionId || !fingerprint) {
      return corsErrors.badRequest('Missing required fields', origin);
    }

    // Get or create fingerprint record
    const fingerprintRecord = await prisma.fingerprint.findFirst({
      where: {
        appId: authContext.app.id,
        fingerprint
      }
    });

    if (!fingerprintRecord) {
      return corsErrors.badRequest('Fingerprint not found', origin);
    }

    // Get app organization
    if (!authContext.app.organizationId) {
      return corsErrors.badRequest('App not linked to organization', origin);
    }

    // Get or create conversation
    const conversationId = await ContextBuilder.getOrCreateConversation(
      authContext.app.id,
      fingerprintRecord.id,
      sessionId
    );

    // Check if human has taken over
    const isHumanHandoff = await MessageRouter.isHumanHandoff(conversationId);
    if (isHumanHandoff) {
      // Store user message but don't respond with AI
      await prisma.chatMessage.create({
        data: {
          conversationId,
          role: 'user',
          content: message
        }
      });

      return NextResponse.json(
        {
          response: null,
          status: 'waiting_for_human',
          message: 'A team member will respond shortly.'
        },
        { headers: corsHeaders(origin, authContext.app.corsOrigins) }
      );
    }

    // Build context
    const context = await ContextBuilder.buildContext(conversationId, message);
    const creditsNeeded = ChatCreditManager.calculateMessageCredits(context.useRAG);

    // Check credits
    const hasCredits = await ChatCreditManager.hasCredits(
      authContext.app.organizationId,
      creditsNeeded
    );

    if (!hasCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits' },
        { status: 402, headers: corsHeaders(origin, authContext.app.corsOrigins) }
      );
    }

    // Get chat config
    const config = await prisma.chatConfiguration.findUnique({
      where: { appId: authContext.app.id }
    });

    if (!config || !config.enabled) {
      return corsErrors.badRequest('Chat not enabled for this app', origin);
    }

    // Store user message
    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'user',
        content: message
      }
    });

    // Build system prompt
    const systemPrompt = ContextBuilder.buildSystemPrompt(
      config.systemPrompt || LLMService.getDefaultSystemPrompt(authContext.app.name, config.botName),
      context.ragContext
    );

    // Define calendar functions for LLM
    const functions = config.enableCalendar ? getCalendarFunctions() : [];

    // Get LLM response
    const llmService = new LLMService();
    let llmResponse = await llmService.chat(
      [...context.messages, { role: 'user', content: message }],
      systemPrompt,
      functions,
      config.llmModel
    );

    // Handle function calls
    if (llmResponse.functionCalls) {
      for (const functionCall of llmResponse.functionCalls) {
        const result = await executeFunctionCall(
          functionCall,
          authContext.app.id,
          conversationId
        );
        functionCall.result = result;
      }

      // Get final response after function execution
      llmResponse = await llmService.chat(
        [
          ...context.messages,
          { role: 'user', content: message },
          { 
            role: 'assistant', 
            content: llmResponse.content,
            metadata: { functionCalls: llmResponse.functionCalls }
          }
        ],
        systemPrompt,
        [],
        config.llmModel
      );
    }

    // Consume credits
    await ChatCreditManager.consumeCredits(
      authContext.app.organizationId,
      creditsNeeded,
      context.useRAG ? 'CHAT_MESSAGE_RAG' : 'CHAT_MESSAGE',
      `Chat message in conversation ${conversationId}`
    );

    // Store assistant message
    await prisma.chatMessage.create({
      data: {
        conversationId,
        role: 'assistant',
        content: llmResponse.content,
        creditsUsed: creditsNeeded,
        metadata: llmResponse.functionCalls ? JSON.parse(JSON.stringify({ functionCalls: llmResponse.functionCalls })) : undefined
      }
    });

      return NextResponse.json(
        {
          response: llmResponse.content,
          creditsUsed: creditsNeeded
        },
        { headers: corsHeaders(origin, authContext.app.corsOrigins) }
      );

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders(origin, []) }
    );
  }
}

// Calendar function definitions for LLM
function getCalendarFunctions() {
  return [
    {
      name: 'check_availability',
      description: 'Check available time slots for scheduling a meeting',
      parameters: {
        type: 'object',
        properties: {
          meetingType: {
            type: 'string',
            description: 'The type of meeting (e.g., "demo", "consultation")'
          },
          daysAhead: {
            type: 'number',
            description: 'How many days ahead to check (default: 7)'
          }
        },
        required: ['meetingType']
      }
    },
    {
      name: 'book_meeting',
      description: 'Book a meeting at a specific time',
      parameters: {
        type: 'object',
        properties: {
          meetingTypeId: {
            type: 'string',
            description: 'The ID of the meeting type'
          },
          startTime: {
            type: 'string',
            description: 'ISO datetime string for meeting start'
          },
          attendeeName: {
            type: 'string',
            description: 'Name of the attendee'
          },
          attendeeEmail: {
            type: 'string',
            description: 'Email of the attendee'
          },
          notes: {
            type: 'string',
            description: 'Additional notes for the meeting'
          }
        },
        required: ['meetingTypeId', 'startTime', 'attendeeName', 'attendeeEmail']
      }
    }
  ];
}

// Execute function calls from LLM
async function executeFunctionCall(
  functionCall: any,
  appId: string,
  conversationId: string
): Promise<any> {
  if (functionCall.name === 'check_availability') {
    const { meetingType, daysAhead = 7 } = functionCall.arguments;
    
    // Find meeting type by name
    const meetingTypes = await CalendarService.getMeetingTypes(appId);
    const type = meetingTypes.find(t => 
      t.name.toLowerCase().includes(meetingType.toLowerCase())
    );

    if (!type) {
      return { error: 'Meeting type not found' };
    }

    const startDate = startOfDay(new Date());
    const endDate = addDays(startDate, daysAhead);

    const slots = await CalendarService.getAvailability(
      appId,
      type.id,
      startDate,
      endDate
    );

    return {
      slots: slots.slice(0, 5).map(s => ({
        startTime: s.startTime.toISOString(),
        endTime: s.endTime.toISOString(),
        meetingType: s.meetingType.name
      }))
    };
  }

  if (functionCall.name === 'book_meeting') {
    const { meetingTypeId, startTime, attendeeName, attendeeEmail, notes } = functionCall.arguments;

    const bookingId = await CalendarService.createBooking(
      appId,
      conversationId,
      {
        meetingTypeId,
        startTime: new Date(startTime),
        attendeeName,
        attendeeEmail,
        notes
      }
    );

    return {
      bookingId,
      status: 'confirmed',
      message: 'Meeting booked successfully'
    };
  }

  return { error: 'Unknown function' };
}

