const GPT_API_KEY = process.env.GPT_API_KEY;

const SYSTEM_PROMPT = `You are a music chord recognition assistant. Analyze the uploaded image which contains a guitar chord sheet, tab, or chord progression.

Extract ALL chord symbols from the image in the order they appear.

Rules:
1. Return ONLY the chord symbols separated by spaces, nothing else.
2. Preserve the exact chord notation as written (e.g. Cmaj7, Am9, F#m7b5, G7#9).
3. If a chord repeats in the progression, include each occurrence.
4. Ignore lyrics, tab numbers, fret diagrams — only extract chord names.
5. If you see slash chords like C/E or G/B, preserve them.
6. If no chords are found, return "NO_CHORDS_FOUND".

Example output: C Am F G7 C/E Dm7 G7 C`;

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
        max_tokens: 512,
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
