import Link from 'next/link'
import Image from 'next/image'

export default function HomePage() {
  return (
    <main className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-6">
      {/* Soft background */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-rose-50 via-amber-50 to-emerald-50" />

      <div className="mx-auto max-w-2xl text-center space-y-10">
        {/* Headline */}
        <h1 className="text-5xl font-bold leading-tight tracking-tight">
          What should I eat today?
        </h1>

        {/* Illustration */}
        <div className="relative mx-auto h-[220px] w-full overflow-hidden rounded-2xl">
          <Image
            src="/kitchen.png"
            alt=""
            fill
            priority
            className="object-contain"
          />
        </div>

        {/* Subtext */}
        <p className="text-lg text-gray-600">
          A quiet place to collect recipes —
          <br />
          based on what you have, how you cook, and how you feel.
        </p>

        {/* Gentle cues */}
        <div className="space-y-2 text-gray-700">
          <p>• No oven? Totally fine.</p>
          <p>• Only a few ingredients? Still works.</p>
          <p>• Just want something comforting? You’re in the right place.</p>
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 pt-4">
          <Link
            href="/recipes"
            className="rounded-full bg-black px-6 py-3 text-white transition hover:bg-gray-800"
          >
            Browse recipes
          </Link>

          <Link
            href="/recipes/upload"
            className="rounded-full border border-gray-300 px-6 py-3 transition hover:bg-gray-50"
          >
            Add a recipe
          </Link>
        </div>
      </div>
    </main>
  )
}
