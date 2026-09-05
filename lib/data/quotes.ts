/**
 * Curated quotes for inspiration and reflection
 * Shown during loading screens and in the diary sidebar
 */

export const QUOTES = [
  {
    text: "The longest journey begins with a single step.",
    author: "Lao Tzu"
  },
  {
    text: "What we think, we become.",
    author: "Buddha"
  },
  {
    text: "In the midst of winter, I found there was, within me, an invincible summer.",
    author: "Albert Camus"
  },
  {
    text: "The wound is the place where the light enters you.",
    author: "Rumi"
  },
  {
    text: "Not all those who wander are lost.",
    author: "J.R.R. Tolkien"
  },
  {
    text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
    author: "Aristotle"
  },
  {
    text: "The only way out is through.",
    author: "Robert Frost"
  },
  {
    text: "Everything you can imagine is real.",
    author: "Pablo Picasso"
  },
  {
    text: "To live is the rarest thing in the world. Most people exist, that is all.",
    author: "Oscar Wilde"
  },
  {
    text: "Be yourself; everyone else is already taken.",
    author: "Oscar Wilde"
  },
  {
    text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.",
    author: "Albert Einstein"
  },
  {
    text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.",
    author: "Rumi"
  },
  {
    text: "The unexamined life is not worth living.",
    author: "Socrates"
  },
  {
    text: "Life can only be understood backwards; but it must be lived forwards.",
    author: "Søren Kierkegaard"
  },
  {
    text: "It is during our darkest moments that we must focus to see the light.",
    author: "Aristotle"
  },
  {
    text: "The only impossible journey is the one you never begin.",
    author: "Tony Robbins"
  },
  {
    text: "In the depth of winter, I finally learned that there was in me an invincible summer.",
    author: "Albert Camus"
  },
  {
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb"
  },
  {
    text: "Your time is limited, don't waste it living someone else's life.",
    author: "Steve Jobs"
  },
];

/**
 * Short quotes (< 50 chars) ideal for loading screens
 */
export const SHORT_QUOTES = QUOTES.filter(q => q.text.length < 50);

/**
 * Get a random quote from the collection
 */
export function getRandomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

/**
 * Get a random short quote (< 50 chars) for loading screens
 */
export function getRandomShortQuote() {
  return SHORT_QUOTES[Math.floor(Math.random() * SHORT_QUOTES.length)];
}

/**
 * Get a deterministic quote based on a seed (e.g., date)
 */
export function getDailyQuote(seed: string = new Date().toDateString()) {
  const hash = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return QUOTES[hash % QUOTES.length];
}
