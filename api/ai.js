/* Vercel serverless function: proxies AI Assistant questions to Google's
 * Gemini API. The GEMINI_API_KEY lives in a Vercel environment variable and
 * never reaches the browser — the static app calls this endpoint instead of
 * Gemini directly, so the key cannot be read out of the client bundle.
 *
 * The model is not hard-coded: Google renames/retires Gemini models, so the
 * function asks the ListModels endpoint for what this key can use and picks
 * the newest plain "flash" model (cached per warm lambda), with static
 * fallbacks if discovery fails. */

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
    'everyday calculation questions. Be concise and state the final answer ' +
    'clearly. When the user asks for steps, working or an explanation, show ' +
    'short numbered steps first, then the final answer. Reply in plain text — ' +
    'no markdown headings, lists with dashes, or tables (numbered steps and ' +
    '**bold** are fine).';

const MODEL_FALLBACKS = ['gemini-3.6-flash', 'gemini-flash-latest', 'gemini-2.5-flash'];
let resolvedModel = null; // cached while the lambda stays warm

async function resolveModel(key) {
    if (resolvedModel) return resolvedModel;
    try {
        const r = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
            { headers: { 'x-goog-api-key': key } }
        );
        if (r.ok) {
            const data = await r.json();
            const usable = (data.models || [])
                .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
                .map((m) => (m.name || '').replace(/^models\//, ''));
            if (usable.includes('gemini-flash-latest')) return (resolvedModel = 'gemini-flash-latest');
            const flashes = usable
                .filter((n) => /^gemini-[\d.]+-flash$/.test(n))
                .sort((a, b) =>
                    parseFloat(b.match(/^gemini-([\d.]+)/)[1]) - parseFloat(a.match(/^gemini-([\d.]+)/)[1]));
            if (flashes[0]) return (resolvedModel = flashes[0]);
            const anyFlash = usable.find(
                (n) => n.includes('flash') && !/(lite|preview|exp|image|tts|live|8b)/.test(n));
            if (anyFlash) return (resolvedModel = anyFlash);
            if (usable[0]) return (resolvedModel = usable[0]);
        }
    } catch (e) { /* discovery failed — use fallbacks */ }
    return MODEL_FALLBACKS[0];
}

function generate(key, model, prompt, thinkingOff) {
    const body = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    };
    // Calculator questions don't need extended thinking; models that don't
    // support the field get a retry without it (400 handling below).
    if (thinkingOff) body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
    return fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
            body: JSON.stringify(body),
        }
    );
}

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
        if (!prompt) {
            return res.status(200).json({
                ok: true,
                configured: Boolean(key),
                model: resolvedModel || null,
            });
        }
        if (!key) return res.status(503).json({ error: 'AI is not configured' });
    } else {
        return res.status(405).json({ error: 'POST only' });
    }

    if (prompt.length > 2000) return res.status(413).json({ error: 'Prompt too long' });

    try {
        const first = await resolveModel(key);
        const candidates = [first, ...MODEL_FALLBACKS.filter((m) => m !== first)];
        let r = null;
        let used = null;
        for (const m of candidates) {
            r = await generate(key, m, prompt, true);
            if (r.status === 400) r = await generate(key, m, prompt, false);
            used = m;
            // 404 = model gone; 429/503 = that model throttled/overloaded —
            // in all three cases the next candidate may still work.
            if (r.status !== 404 && r.status !== 429 && r.status !== 503) break;
        }
        if (!r || !r.ok) {
            let detail = '';
            try { detail = (await r.text()).slice(0, 300); } catch (e) { /* ignore */ }
            return res.status(502).json({
                error: `Gemini error ${r ? r.status : 'network'}`,
                model: used,
                detail,
            });
        }
        resolvedModel = used;

        const data = await r.json();
        const text =
            (data.candidates &&
                data.candidates[0] &&
                data.candidates[0].content &&
                data.candidates[0].content.parts &&
                data.candidates[0].content.parts.map((p) => p.text || '').join('')) ||
            '';
        if (!text.trim()) return res.status(502).json({ error: 'Empty answer' });
        return res.status(200).json({ text: text.trim(), model: used });
    } catch (e) {
        return res.status(502).json({ error: 'Upstream failure' });
    }
};
