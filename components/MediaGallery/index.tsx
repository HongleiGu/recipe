import Image from 'next/image'
import { supabase } from '@/lib/supabaseClient'
import { RecipeMedia } from '@/types/recipe'


export default function MediaGallery({ media }: { media: RecipeMedia[] }) {
  return (
    <div className="space-y-3">
      {media
        ?.sort((a: RecipeMedia, b: RecipeMedia) => a.position - b.position)
        .map((item: RecipeMedia, idx: number) => {
          const url = supabase.storage.from('recipe-media').getPublicUrl(item.file_path).data.publicUrl
          if (item.media_type === 'video') {
            return <video key={idx} src={url} controls className="rounded-xl" />
          }
          return (
            <Image
              key={idx}
              src={url}
              alt="recipe media"
              width={600}
              height={400}
              className="rounded-xl"
            />
          )
        })}
      </div>
    )
  }