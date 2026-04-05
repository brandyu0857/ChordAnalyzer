const GPT_API_KEY = process.env.GPT_API_KEY;

const SYSTEM_PROMPT = `You are an expert music chord recognition assistant specializing in jazz and popular music notation.

Analyze the uploaded image and extract ALL chord symbols AND lyrics in ChordPro format.

CRITICAL - Reading accuracy rules:
- Read the image TOP to BOTTOM, LEFT to RIGHT. Do NOT skip any line.
- Chords are typically written ABOVE the lyrics. Read EVERY line of chords carefully.
- An intro/前奏 section may have MULTIPLE lines of chords. Read ALL of them.
- If a section label (like [前奏], [Intro], [Verse]) appears, ALL chord lines following it until the next section belong to that section.
- Bar lines (|) separate measures. A dash (-) between chords means the previous chord sustains. Do NOT skip dashes — include the preceding chord again.
- Chinese section labels: 前奏=Intro, 主歌=Verse, 副歌/合唱=Chorus, 間奏=Interlude, 尾奏=Outro, 橋段=Bridge
- Navigation marks like (回▲), (1), (2), (3), ★, ☆ are NOT chords — skip them.
- Annotations like "等4拍", "各1拍" are performance notes — skip them.

CRITICAL - Jazz/Real Book notation rules you MUST follow:
- Triangle (Δ) = major 7th. Example: CΔ7 or CΔ = Cmaj7
- Minus sign (-) between chords = sustain/repeat. Minus AFTER note name = minor: C-7 = Cm7
- Plus sign (+) = augmented. Example: C+7 = Caug7
- Circle (°) = diminished. Example: C°7 = Cdim7
- Half-diminished (ø) = m7b5. Example: Cø7 = Cm7b5
- "sus" = suspended. Example: G9sus = G9sus4
- Slash chords: D7/F# means D7 with F# bass
- Superscript b or # after a note = flat/sharp: B♭maj7 = Bbmaj7, F♯ = F#

CRITICAL - Repeat sign rules:
- % (single bar repeat) = repeat the PREVIOUS bar's chord(s). You MUST expand these into actual chord names.
- Double % or slash marks = repeat previous 2 bars. Expand these too.
- Do NOT skip or ignore repeat signs. Every bar must produce chord names.

STRICT output format - ChordPro:
- Use ChordPro format: chords in curly braces {Chord} placed at the exact position in the lyrics where the chord changes.
- Use [Section] markers on their own line for sections.
- Each lyric line with its chords should be on ONE line.
- For instrumental sections with no lyrics, put chords separated by spaces on one line: {Fmaj7} {Em7} {E} {Amaj7}
- Use standard chord notation: Cmaj7, Dm7, Am9, G9sus4, Bbmaj7, D7/F#
- Convert ALL jazz shorthand: Δ→maj, -→m, °→dim, ø→m7b5
- Expand ALL repeat signs (% marks) into actual chord names
- Translate Chinese section labels to English.
- If no chords found, return only: NO_CHORDS_FOUND
- NO other text, NO explanations.

CORRECT output example:
[Intro]
{Fmaj7} {Em7} {E} {Amaj7}
{Fmaj7} {Em7} {Am7} {Dmaj7} {F/G}
[Verse]
{G}已经为了变的{D/F#}更好去掉{Em}锋芒
{C}一不小心成了{Cm7}你的倾诉{D7}对象
[Chorus]
{Fmaj7}Love Song 一直{G7}想写一首{Am7}Love Song{Em7}`;

function normalizeChordText(text) {
  // Strip parentheses
  text = text.replace(/[()]/g, '');
  // Convert caret (^) to maj
  text = text.replace(/\^/g, 'maj');
  // Normalize Unicode symbols to ASCII
  text = text.replace(/♭/g, 'b').replace(/♯/g, '#').replace(/Δ/g, 'maj').replace(/°/g, 'dim').replace(/ø/g, 'm7b5');
  return text;
}

// Extract chord-only format from ChordPro text
function chordProToChordList(sheet) {
  const lines = sheet.split('\n');
  const parts = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    // Pass through section markers
    if (/^\[.+\]$/.test(trimmed)) {
      parts.push(trimmed);
      continue;
    }
    // Extract chords from {Chord} patterns
    const chords = [];
    const re = /\{([^}]+)\}/g;
    let m;
    while ((m = re.exec(trimmed)) !== null) {
      chords.push(m[1]);
    }
    if (chords.length) parts.push(...chords);
  }
  return parts.join(' ');
}

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
        model: 'gpt-4.1-mini',
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
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: `OpenAI API error: ${errorText}` });
    }

    const data = await response.json();
    let text = data?.choices?.[0]?.message?.content?.trim() || '';

    if (text === 'NO_CHORDS_FOUND' || !text) {
      return res.json({ chords: '', sheet: '', message: 'No chords found in image' });
    }

    // Strip any preamble text before the first chord or section marker
    const sectionStart = text.indexOf('[');
    const chordStart = text.indexOf('{');
    const firstRelevant = Math.min(
      sectionStart >= 0 ? sectionStart : Infinity,
      chordStart >= 0 ? chordStart : Infinity
    );
    if (firstRelevant > 0 && firstRelevant < Infinity) {
      text = text.substring(firstRelevant);
    }

    // Remove trailing explanation text
    text = text.replace(/\n\n[\s\S]*$/, '').trim();

    // Remove NO_CHORDS_FOUND if mixed with other content
    text = text.replace(/\bNO_CHORDS_FOUND\b/g, '').trim();

    // Normalize chord symbols
    text = normalizeChordText(text);

    if (!text) {
      return res.json({ chords: '', sheet: '', message: 'No chords found in image' });
    }

    // Extract chord-only list for diagram view
    const chords = chordProToChordList(text);

    return res.json({ chords, sheet: text });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
