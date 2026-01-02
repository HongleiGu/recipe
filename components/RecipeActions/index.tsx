'use client'

import { useRouter } from 'next/navigation'
import { deleteRecipeById } from '@/lib/recipeActions'

export default function RecipeActions({
  recipeId,
  slug,
}: {
  recipeId: string
  slug: string
}) {
  const router = useRouter()

  const handleDelete = async () => {
    const ok = confirm('Are you sure you want to delete this recipe?')
    if (!ok) return

    await deleteRecipeById(recipeId)
    router.push('/')
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => router.push(`/recipes/${slug}/edit`)}
        className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
      >
        Edit
      </button>

      <button
        onClick={handleDelete}
        className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
      >
        Delete
      </button>
    </div>
  )
}
