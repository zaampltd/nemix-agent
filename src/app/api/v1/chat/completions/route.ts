import { NextResponse } from 'next/server';
import { generateNvmixCompletion } from '@/lib/nvmix-engine';

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
    // 1. Enforce strict Nvmix API key validation via Authorization header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or malformed Authorization header. Must be "Bearer <NVMIX_API_KEY>"' },
        { status: 401, headers: corsHeaders }
      );
    }

    const nvmixApiKey = authHeader.split(' ')[1]?.trim();
    if (!nvmixApiKey || !nvmixApiKey.startsWith('nvx_')) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid Nvmix API Key. Keys must start with "nvx_"' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. Extract and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    const { messages, temperature, max_tokens } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid or missing "messages" array in request body' },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3. Delegate to the shared core Nvmix engine
    const completionResult = await generateNvmixCompletion(messages, {
      temperature,
      max_tokens
    });

    return NextResponse.json(completionResult, {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error: any) {
    console.error('Nvmix Gateway completions route caught error:', error);
    return NextResponse.json(
      {
        error: {
          message: error?.message || 'Nvmix Gateway encountered an internal processing error.',
          type: 'gateway_error',
          code: 'internal_error',
        },
      },
      { status: error?.message?.includes('Aggregator') ? 502 : 500, headers: corsHeaders }
    );
  }
}
