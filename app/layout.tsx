import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ScrollProgress } from '@/components/ui/ScrollProgress';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: 'Anamnesis',
  description: 'A private diary that becomes a public constellation',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{
          __html: `
            // Inline loading screen quote rotation - runs immediately without waiting for React
            window.SHORT_QUOTES = [
              { text: "The longest journey begins with a single step.", author: "Lao Tzu" },
              { text: "What we think, we become.", author: "Buddha" },
              { text: "Not all those who wander are lost.", author: "J.R.R. Tolkien" },
              { text: "The only way out is through.", author: "Robert Frost" },
              { text: "Everything you can imagine is real.", author: "Pablo Picasso" },
              { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
              { text: "The unexamined life is not worth living.", author: "Socrates" }
            ];

            window.initLoadingQuotes = function() {
              const quoteText = document.getElementById('loading-quote-text');
              const quoteAuthor = document.getElementById('loading-quote-author');

              if (!quoteText || !quoteAuthor) return;

              let currentIndex = Math.floor(Math.random() * window.SHORT_QUOTES.length);

              function updateQuote() {
                const quote = window.SHORT_QUOTES[currentIndex];
                quoteText.textContent = '"' + quote.text + '"';
                quoteAuthor.textContent = '— ' + quote.author;
                currentIndex = (currentIndex + 1) % window.SHORT_QUOTES.length;
              }

              // Set initial random quote
              updateQuote();

              // After 3 seconds, rotate every 2 seconds
              setTimeout(function() {
                setInterval(updateQuote, 2000);
              }, 3000);
            };
          `
        }} />
      </head>
      <body className={`${inter.variable} font-sans`}>
        <ScrollProgress />
        {children}
      </body>
    </html>
  );
}
