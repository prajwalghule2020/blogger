import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ threadId: string }> }
) {
    const { threadId } = await params

    const backendResponse = await fetch(`${BACKEND_URL}/api/abort/${threadId}`, {
        method: 'POST',
    })

    const data = await backendResponse.json()
    return new Response(JSON.stringify(data), {
        status: backendResponse.status,
        headers: { 'Content-Type': 'application/json' },
    })
}
