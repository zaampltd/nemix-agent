import { NextResponse } from 'next/server';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    // Extract request body
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { messages, stream, temperature, max_tokens, top_p, frequency_penalty, presence_penalty } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid or missing "messages" array in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Crucial Fallback: If process.env.OPENAI_API_KEY is not found, DO NOT throw a 500 error or crash.
    // Instead, return a mock successful JSON response in the exact OpenAI format.
    if (!apiKey || apiKey.trim() === '') {
      const mockCompletion = {
        id: `chatcmpl-mock${Math.random().toString(36).substring(2, 11)}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'gpt-4o-mini',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'Nvmix API Gateway connected successfully! Please add OPENAI_API_KEY in Vercel Environment Variables to get real AI responses.',
            },
            logprobs: null,
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      };

      return NextResponse.json(mockCompletion, {
        status: 200,
        headers: corsHeaders,
      });
    }

    // Make fetch call to OpenAI
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
          stream: stream ?? false,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens,
          top_p: top_p,
          frequency_penalty: frequency_penalty,
          presence_penalty: presence_penalty,
        }),
      });

      // Get exact JSON or text response
      const data = await response.json();

      return NextResponse.json(data, {
        status: response.status,
        headers: corsHeaders,
      });
    } catch (fetchError: any) {
      // If the actual fetch failed (e.g. network issue), return a elegant JSON error response
      return NextResponse.json(
        {
          error: {
            message: fetchError?.message || 'Failed to communicate with the upstream AI provider',
            type: 'gateway_error',
            param: null,
            code: 'upstream_error',
          },
        },
        { status: 502, headers: corsHeaders }
      );
    }
  } catch (error: any) {
    return NextResponse.json(
      {
        error: {
          message: error?.message || 'Internal Server Error',
          type: 'api_error',
          param: null,
          code: 'internal_error',
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
