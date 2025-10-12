import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { LLMService } from '@/lib/chat/llm-service';
import { ContextBuilder } from '@/lib/chat/context-builder';
import { ChatCreditManager } from '@/lib/chat/credit-manager';
import { MessageRouter } from '@/lib/chat/message-router';
import { CalendarService } from '@/lib/chat/calendar-service';
import { verifyPublicToken } from '@/lib/security/auth';
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
    // Verify public token authentication (JWT from SDK)
    const authContext = await verifyPublicToken(request.headers);
    if (!authContext) {
      return corsErrors.unauthorized(origin);
    }

    const body = await request.json();
    const { message, sessionId, fingerprint, fingerprint2, fingerprint3 } = body;

    if (!message || !sessionId || !fingerprint) {
      return corsErrors.badRequest('Missing required fields', origin);
    }

    // Find fingerprint record using priority-based matching (same as auth token endpoint)
    // 1. Try primary fingerprint (FingerprintJS)
    let fingerprintRecord = await prisma.fingerprint.findUnique({
      where: {
        appId_fingerprint: {
          appId: authContext.app.id,
          fingerprint,
        },
      },
    });

    // 2. Try fingerprint2 (canvas) if primary didn't match
    if (!fingerprintRecord && fingerprint2) {
      fingerprintRecord = await prisma.fingerprint.findFirst({
        where: {
          appId: authContext.app.id,
          fingerprint2: fingerprint2,
        },
      });
    }

    // 3. Try fingerprint3 (browser signature) if still not found
    if (!fingerprintRecord && fingerprint3) {
      fingerprintRecord = await prisma.fingerprint.findFirst({
        where: {
          appId: authContext.app.id,
          fingerprint3: fingerprint3,
        },
      });
    }

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

    // Build first call messages
    const firstCallMessages = context.messages.map(m => ({
      role: m.role,
      content: m.content
    }));
    firstCallMessages.push({ role: 'user', content: message });

    // Get LLM response
    const llmService = new LLMService();
    let llmResponse = await llmService.chat(
      firstCallMessages,
      systemPrompt,
      functions,
      config.llmModel
    );

    // Handle function calls with proper Groq pattern
    if (llmResponse.functionCalls && llmResponse.rawToolCalls) {
      // Build message history with assistant + tool messages
      const messagesForSecondCall: any[] = [
        ...firstCallMessages,
        {
          role: 'assistant',
          content: llmResponse.content || '',
          tool_calls: llmResponse.rawToolCalls // Full structure with IDs
        }
      ];
      
      // Execute functions and add tool role messages
      for (const toolCall of llmResponse.rawToolCalls) {
        try {
          const functionCall = llmResponse.functionCalls.find(
            fc => fc.name === toolCall.function.name
          );
          
          if (!functionCall) {
            throw new Error(`Function call not found: ${toolCall.function.name}`);
          }
          
          const result = await executeFunctionCall(
            functionCall,
            authContext.app.id,
            conversationId
          );
          
          // Add tool message (NOT assistant message)
          messagesForSecondCall.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(result || { success: true })
          });
        } catch (error) {
          console.error('Function execution error:', error);
          // Add error as tool message
          messagesForSecondCall.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify({ error: 'Function execution failed' })
          });
        }
      }
      
      // Second call - NO functions parameter (not even empty array!)
      llmResponse = await llmService.chat(
        messagesForSecondCall,
        systemPrompt,
        undefined, // Don't pass functions at all
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
          meetingType: {
            type: 'string',
            description: 'The name of the meeting type (e.g., "Demo", "Consultation")'
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
        required: ['meetingType', 'startTime', 'attendeeName', 'attendeeEmail']
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
    const { meetingType, startTime, attendeeName, attendeeEmail, notes } = functionCall.arguments;

    // Find meeting type by name
    const meetingTypes = await CalendarService.getMeetingTypes(appId);
    const type = meetingTypes.find(t => 
      t.name.toLowerCase().includes(meetingType.toLowerCase())
    );

    if (!type) {
      return { error: 'Meeting type not found' };
    }

    const bookingId = await CalendarService.createBooking(
      appId,
      conversationId,
      {
        meetingTypeId: type.id,
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

