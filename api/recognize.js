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

STRICT output rules:
- Output ONLY chord symbols and [Section] markers. NO other text, NO explanations, NO punctuation except within chord names.
- Use standard chord notation: Cmaj7, Dm7, Am9, G9sus4, Bbmaj7, D7/F#
- Convert ALL jazz shorthand: Δ→maj, -→m, °→dim, ø→m7b5
- Expand ALL repeat signs (% marks) into actual chord names
- Group chords by song sections using [Section] markers
- Use section names: [Intro], [Verse], [Chorus], [Bridge], [Outro], [Interlude], [Solo], or [A], [B], [C] etc.
- If sections are labeled in the image, use those labels
- If no chords found, return only: NO_CHORDS_FOUND

CORRECT output example (note: NO extra text, ONLY chords and markers):
[Intro] Fmaj7 Em7 Dm7 Dm7/G [Verse] Cmaj7 Am7 Dm7 G7 [Chorus] Fmaj7 G7 Am7 Em7`;

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
    let text = data?.choices?.[0]?.message?.content?.trim() || '';

    if (text === 'NO_CHORDS_FOUND' || !text) {
      return res.json({ chords: '', message: 'No chords found in image' });
    }

    // Strip any preamble text before the first chord or section marker
    // Find where actual chord data starts: first [Section] marker or first chord-like token
    const sectionStart = text.indexOf('[');
    if (sectionStart > 0) {
      text = text.substring(sectionStart);
    } else if (sectionStart === -1) {
      // No section markers — find first chord-like token (starts with A-G)
      const match = text.match(/(?:^|\s)([A-G][b#]?(?:maj|min|m|dim|aug|sus|add|[0-9])?)/);
      if (match && match.index > 0) {
        text = text.substring(match.index).trim();
      }
    }

    // Remove any trailing explanation text (after the last chord)
    // Chords/sections end, then explanatory text might follow
    text = text.replace(/\n\n[\s\S]*$/, '').trim();

    return res.json({ chords: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
