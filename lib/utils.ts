import { RecipeMedia } from "@/types/recipe"

export const FALLBACK_IMAGE =
  process.env.NEXT_PUBLIC_FALLBACK_RECIPE_IMAGE!

export const FALLBACK_AVATAR =
  process.env.NEXT_PUBLIC_FALLBACK_AVATAR_IMAGE!

export const FALLBACK_MEDIA: RecipeMedia = {
  position: 1,
  file_path: FALLBACK_IMAGE,
  media_type: 'image' as const,
  default: true
}