'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { deleteRecipeById } from '@/lib/recipeActions'
import { RecipeFull } from '@/types/recipe'

type Props = {
  recipe: RecipeFull
}

export default function RecipeActions({
  recipe
}: Props) {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const isOwner = userId === recipe.author.id

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data.user?.id ?? null)
    })
  }, [])

  const handleDelete = async () => {
    if (!isOwner) return

    const ok = confirm('Are you sure you want to delete this recipe?')
    if (!ok) return

    await deleteRecipeById(recipe.id)
    router.push('/')
  }

  return (
    <div className="flex gap-3">
      {/* Edit */}
      <button
        disabled={!isOwner}
        onClick={() => isOwner && router.push(`/recipes/${recipe.slug}/edit`)}
        className={`rounded-lg border px-4 py-2 text-sm transition
          ${
            isOwner
              ? 'hover:bg-gray-50'
              : 'cursor-not-allowed opacity-40'
          }`}
        title={
          isOwner
            ? 'Edit recipe'
            : 'You can only edit your own recipes'
        }
      >
        Edit
      </button>

      {/* Delete */}
      <button
        disabled={!isOwner}
        onClick={handleDelete}
        className={`rounded-lg border px-4 py-2 text-sm transition
          ${
            isOwner
              ? 'border-red-300 text-red-600 hover:bg-red-50'
              : 'cursor-not-allowed border-gray-200 text-gray-400 opacity-40'
          }`}
        title={
          isOwner
            ? 'Delete recipe'
            : 'You can only delete your own recipes'
        }
      >
        Delete
      </button>
    </div>
  )
}
