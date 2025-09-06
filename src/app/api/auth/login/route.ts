import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        // External login API URL provided by the user
        const externalLoginApiUrl = 'https://xpi.machibo.com/api/auth/login';
        const response = await fetch(externalLoginApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json', // Added Accept header as per curl command
            },
            body: JSON.stringify({ username, password }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error during external login:', error);
        return NextResponse.json({ error: error.message || 'Failed to authenticate with external API' }, { status: 500 });
    }
}
