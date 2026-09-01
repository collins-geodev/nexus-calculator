/* Vercel serverless function: proxies AI Assistant questions to Google's
 * Gemini API. The GEMINI_API_KEY lives in a Vercel environment variable and
 * never reaches the browser — the static app calls this endpoint instead of
 * Gemini directly, so the key cannot be read out of the client bundle. */

const ALLOWED_ORIGINS = [
    'https://nexus-calculator-ten.vercel.app',
    'https://localhost',     // Capacitor Android WebView
    'capacitor://localhost', // Capacitor iOS WebView
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:8080',
];

const SYSTEM_PROMPT =
    'You are the Nexus AI Assistant inside the Nexus Calculator app, built by ' +
    'Collins Tochukwu Anyanwu. Answer math, statistics, conversion, finance and ' +
    'everyday calculation questions. Be concise (a few sentences), state the ' +
    'final answer clearly, and reply in plain text — no markdown headings, ' +
    'lists or tables.';

module.exports = async (req, res) => {
    const origin = req.headers.origin || '';
    if (ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Vary', 'Origin');
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(204).end();

    const key = process.env.GEMINI_API_KEY;

    let prompt = '';
    if (req.method === 'POST') {
        prompt = req.body && typeof req.body.prompt === 'string' ? req.body.prompt.trim() : '';
        if (!key) return res.status(503).json({ error: 'AI is not configured' });
        if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
    } else if (req.method === 'GET') {
        // Health check / self-test: GET /api/ai reports configuration state;
        // GET /api/ai?q=... answers like a POST (used for diagnostics).
        prompt = req.query && typeof req.query.q === 'string' ? req.query.q.trim() : '';
        if (!prompt) return res.status(200).json({ ok: true, configured: Boolean(key) });
        if (!key) return res.status(503).json({ error: 'AI is not configured' });
    } else {
        return res.status(405).json({ error: 'POST only' });
    }

    if (prompt.length > 2000) return res.status(413).json({ error: 'Prompt too long' });

    try {
        const r = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
                body: JSON.stringify({
                    system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.3,
                        maxOutputTokens: 800,
                        // Calculator questions don't need extended thinking;
                        // disabling it keeps answers fast and cheap.
                        thinkingConfig: { thinkingBudget: 0 },
                    },
                }),
            }
        );
        if (!r.ok) return res.status(502).json({ error: `Gemini error ${r.status}` });

        const data = await r.json();
        const text =
            (data.candidates &&
                data.candidates[0] &&
                data.candidates[0].content &&
                data.candidates[0].content.parts &&
                data.candidates[0].content.parts.map((p) => p.text || '').join('')) ||
            '';
        if (!text.trim()) return res.status(502).json({ error: 'Empty answer' });
        return res.status(200).json({ text: text.trim() });
    } catch (e) {
        return res.status(502).json({ error: 'Upstream failure' });
    }
};
