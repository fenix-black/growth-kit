import Groq from 'groq-sdk';
import { ChatMessage, LLMResponse, FunctionCall } from './types';

export class LLMService {
  private groq: Groq;

  constructor() {
    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not set');
    }
    this.groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }

  /**
   * Send messages to LLM and get response
   */
  async chat(
    messages: ChatMessage[],
    systemPrompt: string,
    functions?: any[],
    model: string = 'openai/gpt-oss-120b'
  ): Promise<LLMResponse> {
    try {
      const completion = await this.groq.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.7,
        max_tokens: 1024,
        ...(functions && functions.length > 0 && {
          tools: functions.map(f => ({
            type: 'function' as const,
            function: f
          }))
        })
      });

      const response = completion.choices[0];
      
      // Check for function calls
      const functionCalls: FunctionCall[] = [];
      if (response.message.tool_calls) {
        for (const toolCall of response.message.tool_calls) {
          if (toolCall.type === 'function') {
            functionCalls.push({
              name: toolCall.function.name,
              arguments: JSON.parse(toolCall.function.arguments)
            });
          }
        }
      }

      return {
        content: response.message.content || '',
        functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
        creditsUsed: 1 // Base cost, will be adjusted for RAG
      };
    } catch (error) {
      console.error('LLM error:', error);
      throw new Error('Failed to get LLM response');
    }
  }

  /**
   * Get default system prompt
   */
  static getDefaultSystemPrompt(appName: string, botName: string): string {
    return `You are ${botName}, a helpful AI assistant for ${appName}. 
    
Your role is to:
- Answer questions about ${appName} using the knowledge base provided
- Help users schedule meetings when they express interest
- Collect user information (name, email) when booking meetings
- Be friendly, professional, and concise

When using functions:
- Always confirm before booking a meeting
- Ask for user's email if not already provided
- Be clear about meeting times and dates

If you don't know something, admit it and offer to connect them with a human.`;
  }
}

