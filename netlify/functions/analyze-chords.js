// Netlify Function (Node.js runtime) - Gemini Vision API proxy

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "API key not configured" }),
    };
  }

  try {
    const { image, mimeType } = JSON.parse(event.body);

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `You are a music chord recognition expert. Analyze this image and extract ALL chord names and lyrics (if any).

Output rules:
1. If the image contains LYRICS with CHORDS: output in ChordPro format, with chords in square brackets before the lyrics they belong to. Example: [C]When I find myself in [G]times of trouble
2. If the image contains ONLY CHORDS (chord progression): output each line of chords separated by " - ". Example: Cadd9 - Bm7b5 - E7 - Am7
3. If there's a song title, put it on the first line as: {title: Song Name}
4. Handle special notations: #F7 means F#7, bB means Bb, slash chords like C/E should stay as C/E
5. Output ONLY the chord text, no explanations or commentary.
6. Preserve the line structure from the original image.`,
                },
                {
                  inlineData: {
                    mimeType: mimeType || "image/jpeg",
                    data: image,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: data.error?.message || "Gemini API error" }),
      };
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: String(err) }),
    };
  }
};
