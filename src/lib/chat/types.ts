// Shared types for chat system

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, any>;
}

export interface ConversationContext {
  conversationId: string;
  fingerprintId: string;
  appId: string;
  messageHistory: ChatMessage[];
  ragContext?: string[];
  userContext?: Record<string, any>;
}

export interface LLMResponse {
  content: string;
  functionCalls?: FunctionCall[];
  rawToolCalls?: any[]; // Groq's full tool_calls structure with IDs
  creditsUsed: number;
}

export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
  result?: any;
}

export interface AvailabilitySlot {
  startTime: Date;
  endTime: Date;
  meetingType: {
    id: string;
    name: string;
    durationMinutes: number;
  };
}

export interface BookingRequest {
  meetingTypeId: string;
  startTime: Date;
  attendeeName: string;
  attendeeEmail: string;
  notes?: string;
}

