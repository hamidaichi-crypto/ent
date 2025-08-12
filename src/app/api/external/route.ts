import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const externalUrl = searchParams.get('url');

  if (!externalUrl) {
    return NextResponse.json({ error: 'Missing external URL' }, { status: 400 });
  }

  try {
    const response = await fetch(externalUrl);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching external API:', error);
    return NextResponse.json({ error: 'Failed to fetch data from external API' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const externalUrl = searchParams.get('url');

  if (!externalUrl) {
    return NextResponse.json({ error: 'Missing external URL' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const response = await fetch(externalUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error posting to external API:', error);
    return NextResponse.json({ error: 'Failed to post data to external API' }, { status: 500 });
  }
}
