export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center space-y-6">
        <h1 className="text-6xl font-serif text-glow">
          Space of Sonder
        </h1>
        <p className="text-xl text-gray-400">
          A private diary that becomes a public constellation
        </p>
        <div className="flex gap-4 justify-center pt-8">
          <a
            href="/auth"
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            Get Started
          </a>
          <a
            href="/sky"
            className="px-6 py-3 bg-star-gold/20 hover:bg-star-gold/30 rounded-lg transition-colors"
          >
            View the Sky
          </a>
        </div>
      </div>
    </main>
  );
}
