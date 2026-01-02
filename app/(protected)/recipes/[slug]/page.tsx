import Image from 'next/image'
import { getRecipeBySlug } from '@/lib/recipeActions'
import RecipeActions from '@/components/RecipeActions'
// import type { RecipeMedia } from '@/types/recipe'
import { JSX } from 'react'
// import { supabase } from '@/lib/supabaseClient'
import MediaCarousel from '@/components/MediaCarousel'
import { FALLBACK_IMAGE } from '@/lib/utils'

type PageProps = {
  params: {
    slug: string
  }
}

/**
 * Normalize CRLF and render paragraphs
 */
function formatContent(text: string): JSX.Element[] {
  const normalized = text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')

  return normalized.split('\\n').map((line, idx) => (
    <p key={idx} className="mb-4 leading-relaxed">
      {line}
    </p>
  ))
}

export default async function RecipePage({ params }: PageProps) {
  const p = await params
  console.log(p)
  const recipe = await getRecipeBySlug(p.slug)

  if (!recipe) {
    throw new Error('Recipe not found')
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <article className="space-y-8">
        {/* ================= Header ================= */}
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-4xl font-bold leading-tight">
              {recipe.title}
            </h1>

            {/* Client-side actions */}
            <RecipeActions recipe={recipe} />
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {recipe.tags.map((tag) => (
                <span
                  key={`${tag.category}-${tag.name}`}
                  className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-700"
                >
                  #{tag.name}
                </span>
              ))}
            </div>
          )}
        </header>

        {/*===== Author =====*/}
        <div className="flex items-center gap-3">
          <Image
            src={recipe.author.avatar_url || '/avatar-placeholder.png'}
            alt={recipe.author.username || 'User'}
            width={40}
            height={40}
            className="rounded-full"
          />

          <div className="text-sm">
            <p className="font-medium">
              {recipe.author.username}
            </p>
            <p className="text-gray-500">Recipe author</p>
          </div>
        </div>


        {/* ================= Media ================= */}
        <section>
          {recipe.recipe_media.length === 0 ? (
            <div className="relative mx-auto h-[500px] w-full overflow-hidden rounded-2xl bg-gray-100 p-2">
              <Image
                src={FALLBACK_IMAGE}
                alt="Recipe image not available"
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                className="rounded-lg object-contain opacity-80"
              />
            </div>
          ) : (
            <MediaCarousel
              media={recipe.recipe_media
                .slice()
                .sort((a, b) => a.position - b.position)}
              title={recipe.title}
            />
          )}
        </section>


        {/* ================= Content ================= */}
        <section className="prose prose-lg max-w-none">
          {formatContent(recipe.content)}
        </section>
      </article>
    </main>
  )
}
