import type { Context } from "@netlify/functions";

export default async (req: Request, _context: Context) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { image, mimeType } = await req.json();

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
      return new Response(
        JSON.stringify({ error: data.error?.message || "Gemini API error" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
