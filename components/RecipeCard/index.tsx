import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { RecipePreview } from '@/types/recipe'

export default function RecipeCard({ recipe }: { recipe: RecipePreview }) {
  const cover = recipe.recipe_media?.[0]
  const imageUrl = cover
    ? supabase.storage
        .from('recipe-media')
        .getPublicUrl(cover.file_path).data.publicUrl
    : null

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group block overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md"
    >
      {imageUrl && (
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={recipe.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}

      <div className="space-y-2 p-4">
        <h2 className="line-clamp-2 text-lg font-semibold leading-snug">
          {recipe.title}
        </h2>

        <p className="text-sm text-muted-foreground">
          Tap to view full recipe →
        </p>
      </div>
    </Link>
  )
}
