const GPT_API_KEY = process.env.GPT_API_KEY;

const SYSTEM_PROMPT = `You are an expert music chord recognition assistant specializing in jazz and popular music notation.

Analyze the uploaded image and extract ALL chord symbols in order.

CRITICAL - Jazz/Real Book notation rules you MUST follow:
- Triangle (Δ) = major 7th. Example: CΔ7 or CΔ = Cmaj7
- Minus sign (-) = minor. Example: C-7 = Cm7, C-9 = Cm9, C- = Cm
- Plus sign (+) = augmented. Example: C+7 = Caug7
- Circle (°) = diminished. Example: C°7 = Cdim7
- Half-diminished (ø) = m7b5. Example: Cø7 = Cm7b5
- "sus" = suspended. Example: G9sus = G9sus4
- Slash chords: D7/F# means D7 with F# bass

CRITICAL - Repeat sign rules:
- % (single bar repeat) = repeat the PREVIOUS bar's chord(s). You MUST expand these into actual chord names.
- Double % or slash marks = repeat previous 2 bars. Expand these too.
- Do NOT skip or ignore repeat signs. Every bar must produce chord names.

Output rules:
1. Return ONLY chord symbols separated by spaces using standard notation (e.g. Cmaj7, Dm7, Am9, G9sus4, Bbmaj7, D7/F#)
2. Convert ALL jazz shorthand to standard: Δ→maj, -→m, °→dim, ø→m7b5
3. Expand ALL repeat signs (% marks) into the actual repeated chords
4. Include every chord for every bar, including repeated bars
5. Ignore lyrics, section markers (A, B, C, D), bar lines, and fret diagrams
6. If no chords found, return "NO_CHORDS_FOUND"

Example: If you see "FΔ7 | D-7 | % |" → output: Fmaj7 Dm7 Dm7`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!GPT_API_KEY) {
    return res.status(500).json({ error: 'GPT_API_KEY not configured' });
  }

  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GPT_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: image },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `OpenAI API error: ${errorText}` });
    }

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || '';

    if (text === 'NO_CHORDS_FOUND') {
      return res.json({ chords: '', message: 'No chords found in image' });
    }

    return res.json({ chords: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
