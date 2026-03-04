import { NextRequest } from 'next/server'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url)
    const topic = searchParams.get('topic')
    const audience = searchParams.get('audience') || 'general audience'
    const geo = searchParams.get('geo') || 'global'
    const intent_hint = searchParams.get('intent_hint') || ''

    if (!topic) {
        return new Response(
            JSON.stringify({ error: 'topic parameter is required' }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    const backendUrl = new URL(`${BACKEND_URL}/api/stream`)
    backendUrl.searchParams.set('topic', topic)
    backendUrl.searchParams.set('audience', audience)
    backendUrl.searchParams.set('geo', geo)
    if (intent_hint) backendUrl.searchParams.set('intent_hint', intent_hint)

    const backendResponse = await fetch(backendUrl.toString(), {
        headers: { 'Accept': 'text/event-stream' },
    })

    if (!backendResponse.ok) {
        return new Response(
            JSON.stringify({ error: `Backend error: ${backendResponse.status}` }),
            { status: backendResponse.status, headers: { 'Content-Type': 'application/json' } }
        )
    }

    const stream = backendResponse.body
    if (!stream) {
        return new Response(
            JSON.stringify({ error: 'No stream available from backend' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        )
    }

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            'Connection': 'keep-alive',
            'X-Accel-Buffering': 'no',
        },
    })
}
