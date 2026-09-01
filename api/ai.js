/* Vercel serverless function: proxies AI Assistant questions to Google's
 * Gemini API. The GEMINI_API_KEY lives in a Vercel environment variable and
 * never reaches the browser — the static app calls this endpoint instead of
 * Gemini directly, so the key cannot be read out of the client bundle.
 *
 * Reliability model:
 *  - Known-good models are tried FIRST (no ListModels round-trip on the hot
 *    path); discovery runs only if every known model is 404 (all renamed).
 *  - Transient 429/503 ("overloaded") get a couple of quick retries on the
 *    same model before moving on — this is what fixes "sometimes no answer".
 *  - CORS is open (Access-Control-Allow-Origin: *). The endpoint uses no
 *    cookies or auth, so this is safe, and it means the Android/iOS WebView
 *    can call it no matter what origin Capacitor gives it. */

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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Last-resort discovery: only used when every known model returns 404.
async function discoverModel(key) {
    try {
        const r = await fetch(
            'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
            { headers: { 'x-goog-api-key': key } }
        );
        if (!r.ok) return null;
        const data = await r.json();
        const usable = (data.models || [])
            .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
            .map((m) => (m.name || '').replace(/^models\//, ''));
        if (usable.includes('gemini-flash-latest')) return 'gemini-flash-latest';
        const flashes = usable
            .filter((n) => /^gemini-[\d.]+-flash$/.test(n))
            .sort((a, b) =>
                parseFloat(b.match(/^gemini-([\d.]+)/)[1]) - parseFloat(a.match(/^gemini-([\d.]+)/)[1]));
        if (flashes[0]) return flashes[0];
        const anyFlash = usable.find(
            (n) => n.includes('flash') && !/(lite|preview|exp|image|tts|live|8b)/.test(n));
        return anyFlash || usable[0] || null;
    } catch (e) {
        return null;
    }
}

function generate(key, model, prompt, thinkingOff) {
    const body = {
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
    };
    // Calculator questions don't need extended thinking; disabling it keeps
    // answers fast. Models that reject the field get a retry without it.
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

// Try one model with a couple of quick retries for transient overload.
async function tryModel(key, model, prompt) {
    let last = null;
    for (let attempt = 0; attempt < 2; attempt++) {
        let r = await generate(key, model, prompt, true);
        if (r.status === 400) r = await generate(key, model, prompt, false);
        if (r.ok) return { ok: true, r };
        last = r;
        if (r.status === 404) break;                    // model gone → caller advances
        if (r.status === 429 || r.status === 503) {     // overloaded → brief backoff, retry
            if (attempt === 0) await sleep(600);
            continue;
        }
        break;                                          // other error → caller advances
    }
    return { ok: false, r: last };
}

async function askGemini(key, prompt) {
    const order = [];
    if (resolvedModel) order.push(resolvedModel);
    for (const m of MODEL_FALLBACKS) if (!order.includes(m)) order.push(m);

    let lastStatus = null;
    let lastDetail = '';
    let all404 = true;

    for (const model of order) {
        const out = await tryModel(key, model, prompt);
        if (out.ok) { resolvedModel = model; return { ok: true, r: out.r, model }; }
        const r = out.r;
        lastStatus = r ? r.status : null;
        if (r && r.status !== 404) all404 = false;
        if (r) { try { lastDetail = (await r.text()).slice(0, 300); } catch (e) { /* ignore */ } }
    }

    // Every known model 404'd — they were likely all renamed. Discover once.
    if (all404) {
        const discovered = await discoverModel(key);
        if (discovered && !order.includes(discovered)) {
            const out = await tryModel(key, discovered, prompt);
            if (out.ok) { resolvedModel = discovered; return { ok: true, r: out.r, model: discovered }; }
            if (out.r) {
                lastStatus = out.r.status;
                try { lastDetail = (await out.r.text()).slice(0, 300); } catch (e) { /* ignore */ }
            }
        }
    }

    return { ok: false, status: lastStatus, detail: lastDetail, model: order[order.length - 1] };
}

module.exports = async (req, res) => {
    // Open CORS: no cookies/auth here, so any origin (including the Capacitor
    // WebView, whatever scheme it uses) may call it.
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
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
            return res.status(200).json({ ok: true, configured: Boolean(key), model: resolvedModel || null });
        }
        if (!key) return res.status(503).json({ error: 'AI is not configured' });
    } else {
        return res.status(405).json({ error: 'POST only' });
    }

    if (prompt.length > 2000) return res.status(413).json({ error: 'Prompt too long' });

    try {
        const out = await askGemini(key, prompt);
        if (!out.ok) {
            return res.status(502).json({
                error: `Gemini error ${out.status || 'network'}`,
                model: out.model,
                detail: out.detail,
            });
        }
        const data = await out.r.json();
        const text =
            (data.candidates &&
                data.candidates[0] &&
                data.candidates[0].content &&
                data.candidates[0].content.parts &&
                data.candidates[0].content.parts.map((p) => p.text || '').join('')) ||
            '';
        if (!text.trim()) return res.status(502).json({ error: 'Empty answer' });
        return res.status(200).json({ text: text.trim(), model: out.model });
    } catch (e) {
        return res.status(502).json({ error: 'Upstream failure' });
    }
};
