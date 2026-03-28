export interface SongExample {
  title: string;
  artist: string;
}

/**
 * Static database: Roman-numeral degree string → songs using that progression.
 *
 * Degree format rules:
 *   - Major triad / dom7+: uppercase (I, IV, V, V7, Imaj7)
 *   - Minor triad / m7+:   lowercase (ii, vi, ii7)
 *   - Accidentals prefix:  b or # before the numeral (bVII, bVI)
 *   - Chord-type suffix:   7 / maj7 / dim / sus4 / + etc.
 *
 * Multiple rotations of the same progression are listed separately
 * because different songs start on different chords of the loop.
 */
export const PROGRESSION_SONGS: Record<string, SongExample[]> = {

  // ── I-V-vi-IV  ("Axis of Awesome / 流行四和弦") ──────────────────────────
  'I-V-vi-IV': [
    { title: 'Let It Be',              artist: 'The Beatles' },
    { title: 'Someone Like You',       artist: 'Adele' },
    { title: 'No Woman No Cry',        artist: 'Bob Marley' },
    { title: 'With or Without You',    artist: 'U2' },
    { title: 'Poker Face',             artist: 'Lady Gaga' },
    { title: 'Can You Feel the Love Tonight', artist: 'Elton John' },
  ],
  'vi-IV-I-V': [
    { title: 'Zombie',                 artist: 'The Cranberries' },
    { title: 'Demons',                 artist: 'Imagine Dragons' },
    { title: 'Despacito',              artist: 'Luis Fonsi' },
    { title: 'Apologize',              artist: 'OneRepublic' },
    { title: 'Wrecking Ball',          artist: 'Miley Cyrus' },
    { title: 'Radioactive',            artist: 'Imagine Dragons' },
  ],
  'IV-I-V-vi': [
    { title: "Can't Stop the Feeling", artist: 'Justin Timberlake' },
    { title: 'Uptown Funk',            artist: 'Mark Ronson ft. Bruno Mars' },
    { title: 'Happy',                  artist: 'Pharrell Williams' },
  ],
  'V-vi-IV-I': [
    { title: 'She Will Be Loved',      artist: 'Maroon 5' },
    { title: 'Payphone',               artist: 'Maroon 5' },
  ],

  // ── I-IV-V  ("三和弦摇滚/蓝调") ─────────────────────────────────────────
  'I-IV-V': [
    { title: 'La Bamba',               artist: 'Ritchie Valens' },
    { title: 'Johnny B. Goode',        artist: 'Chuck Berry' },
    { title: 'Wild Thing',             artist: 'The Troggs' },
    { title: 'Twist and Shout',        artist: 'The Beatles' },
    { title: 'Louie Louie',            artist: 'The Kingsmen' },
  ],
  'I-IV-V-IV': [
    { title: 'Sweet Home Chicago',     artist: 'Robert Johnson' },
    { title: 'Pride and Joy',          artist: 'Stevie Ray Vaughan' },
  ],
  'I-V-IV': [
    { title: 'More Than a Feeling',    artist: 'Boston' },
    { title: 'Hey Joe',                artist: 'Jimi Hendrix' },
    { title: 'Wonderful Tonight',      artist: 'Eric Clapton' },
  ],
  'V-IV-I': [
    { title: 'Hey Jude',               artist: 'The Beatles' },
    { title: 'Free Fallin\'',          artist: 'Tom Petty' },
    { title: 'Brown Eyed Girl',        artist: 'Van Morrison' },
  ],

  // ── I-vi-IV-V  ("50年代进行") ────────────────────────────────────────────
  'I-vi-IV-V': [
    { title: 'Stand By Me',            artist: 'Ben E. King' },
    { title: 'Every Breath You Take',  artist: 'The Police' },
    { title: 'Blue Moon',              artist: 'Traditional Standard' },
    { title: 'Earth Angel',            artist: 'The Penguins' },
    { title: 'All I Have to Do Is Dream', artist: 'Everly Brothers' },
  ],
  'I-vi-ii-V': [
    { title: 'Fly Me to the Moon',     artist: 'Standard (Frank Sinatra)' },
    { title: 'Heart and Soul',         artist: 'Standard' },
    { title: 'I Will',                 artist: 'The Beatles' },
    { title: 'Oh! You Pretty Things',  artist: 'David Bowie' },
  ],
  'vi-IV-V-I': [
    { title: 'Grenade',                artist: 'Bruno Mars' },
    { title: 'When I Was Your Man',    artist: 'Bruno Mars' },
    { title: 'Love Story',             artist: 'Taylor Swift (chorus)' },
  ],
  'IV-V-vi-I': [
    { title: 'Love Story',             artist: 'Taylor Swift (verse)' },
  ],

  // ── ii-V-I  ("爵士核心进行") ─────────────────────────────────────────────
  'ii-V-I': [
    { title: 'Autumn Leaves',          artist: 'Standard' },
    { title: 'All The Things You Are', artist: 'Jerome Kern' },
    { title: 'There Will Never Be Another You', artist: 'Standard' },
  ],
  'ii-V7-I': [
    { title: 'Autumn Leaves',          artist: 'Standard' },
    { title: "Satin Doll",             artist: 'Duke Ellington' },
    { title: 'Take the A Train',       artist: 'Billy Strayhorn' },
  ],
  'ii7-V7-Imaj7': [
    { title: 'Misty',                  artist: 'Standard' },
    { title: 'My Funny Valentine',     artist: 'Standard' },
    { title: 'The Girl from Ipanema',  artist: 'Jobim' },
  ],

  // ── I-V-vi-iii-IV  ("卡农/上升进行") ────────────────────────────────────
  'I-V-vi-iii-IV': [
    { title: 'Canon in D',             artist: 'Pachelbel' },
    { title: 'Go West',                artist: 'Pet Shop Boys' },
  ],
  'I-V-vi-iii-IV-I-IV-V': [
    { title: 'Canon in D (full)',       artist: 'Pachelbel' },
  ],

  // ── I-IV-vi-V  ───────────────────────────────────────────────────────────
  'I-IV-vi-V': [
    { title: 'Africa',                 artist: 'Toto' },
    { title: 'Take On Me',             artist: 'A-ha' },
    { title: "Summer of '69",          artist: 'Bryan Adams' },
    { title: 'I Gotta Feeling',        artist: 'Black Eyed Peas' },
  ],

  // ── I-iii-IV-V ───────────────────────────────────────────────────────────
  'I-iii-IV-V': [
    { title: 'Piano Man',              artist: 'Billy Joel' },
    { title: 'Passenger',              artist: 'Iggy Pop' },
  ],
  'I-iii-IV-I': [
    { title: 'Brown Eyed Girl',        artist: 'Van Morrison' },
  ],

  // ── I-bVII-IV  ("岩石摩达尔进行") ───────────────────────────────────────
  'I-bVII-IV': [
    { title: 'Sweet Home Alabama',     artist: 'Lynyrd Skynyrd' },
    { title: 'What I Got',             artist: 'Sublime' },
    { title: 'Bad Moon Rising',        artist: 'CCR' },
  ],
  'I-bVII-bVI-bVII': [
    { title: "Knockin' on Heaven's Door", artist: 'Bob Dylan' },
    { title: 'Comfortably Numb',       artist: 'Pink Floyd' },
  ],
  'I-V-bVII-IV': [
    { title: "Don't Look Back in Anger", artist: 'Oasis' },
    { title: 'Here Comes the Sun',     artist: 'The Beatles' },
  ],
  'I-bIII-IV': [
    { title: 'My Generation',          artist: 'The Who' },
    { title: 'Smoke on the Water',     artist: 'Deep Purple (main riff area)' },
  ],

  // ── Natural minor / Aeolian progressions ─────────────────────────────────
  'i-bVI-bIII-bVII': [
    { title: 'All Along the Watchtower', artist: 'Bob Dylan / Jimi Hendrix' },
    { title: 'Smooth Criminal',        artist: 'Michael Jackson' },
    { title: 'Believer',               artist: 'Imagine Dragons' },
  ],
  'i-bVII-bVI-V': [
    { title: 'Hit the Road Jack',      artist: 'Ray Charles' },
    { title: 'Sultans of Swing',       artist: 'Dire Straits' },
    { title: 'Venus',                  artist: 'Shocking Blue / Bananarama' },
  ],
  'i-bVII-bVI-bVII': [
    { title: "Stairway to Heaven (verse)", artist: 'Led Zeppelin' },
    { title: 'Hotel California',       artist: 'Eagles' },
    { title: 'Losing My Religion',     artist: 'R.E.M.' },
  ],
  'i-bVI-bVII': [
    { title: 'Creep',                  artist: 'Radiohead' },
    { title: 'In the Air Tonight',     artist: 'Phil Collins' },
    { title: 'Mr. Brightside',         artist: 'The Killers' },
  ],
  'i-iv-bVII-bIII': [
    { title: 'While My Guitar Gently Weeps', artist: 'The Beatles' },
    { title: 'Paint It Black',         artist: 'The Rolling Stones' },
  ],
  'i-iv-i-V': [
    { title: 'House of the Rising Sun', artist: 'The Animals' },
    { title: 'Scarborough Fair',       artist: 'Simon & Garfunkel' },
  ],
  'i-bVII-bVI-bVII-i': [
    { title: 'Riders on the Storm',    artist: 'The Doors' },
  ],

  // ── Descending progressions ───────────────────────────────────────────────
  'I-VII-vi-V': [
    { title: 'Heart of Gold',          artist: 'Neil Young (descending)' },
  ],
  'vi-V-IV-III': [
    { title: 'Hit the Road Jack',      artist: 'Ray Charles' },
  ],
  'i-VII-VI-V': [
    { title: 'My Way',                 artist: 'Frank Sinatra' },
    { title: 'Smooth',                 artist: 'Santana ft. Rob Thomas' },
  ],

  // ── Other popular progressions ────────────────────────────────────────────
  'I-IV-I-V': [
    { title: 'Hound Dog',              artist: 'Elvis Presley' },
    { title: 'Roll Over Beethoven',    artist: 'Chuck Berry' },
  ],
  'I-IV-V-I': [
    { title: "Blowin' in the Wind",    artist: 'Bob Dylan' },
    { title: 'This Land Is Your Land', artist: 'Woody Guthrie' },
  ],
  'I-ii-IV-I': [
    { title: 'Blackbird',              artist: 'The Beatles' },
  ],
  'I-ii-iii-IV': [
    { title: 'The Sound of Silence',   artist: 'Simon & Garfunkel' },
    { title: 'No Surprises',           artist: 'Radiohead' },
  ],
  'IV-V-I': [
    { title: 'Hallelujah (chorus)',    artist: 'Leonard Cohen' },
    { title: 'Amazing Grace',          artist: 'Traditional' },
  ],

  // ── Songs with 2-chord loops ──────────────────────────────────────────────
  'I-V': [
    { title: 'Get Lucky (verse)',       artist: 'Daft Punk' },
    { title: 'Clocks',                 artist: 'Coldplay' },
  ],
  'I-IV': [
    { title: 'Let Her Go',             artist: 'Passenger' },
  ],
  'i-bVII': [
    { title: 'Sultans of Swing (riff)', artist: 'Dire Straits' },
    { title: 'Another Brick in the Wall', artist: 'Pink Floyd' },
  ],
  'i-V': [
    { title: 'Billie Jean',            artist: 'Michael Jackson' },
    { title: 'What Is Love',           artist: 'Haddaway' },
  ],

};
