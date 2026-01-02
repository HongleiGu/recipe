'use client'

import Image from 'next/image'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import type { RecipeMedia } from '@/types/recipe'

type Props = {
  media: RecipeMedia[]
  title: string
}

export default function MediaCarousel({ media, title }: Props) {
  const [index, setIndex] = useState(0)

  const current = media[index]
  const publicUrl = supabase.storage
    .from('recipe-media')
    .getPublicUrl(current.file_path).data.publicUrl

  return (
    <div className="space-y-4">
      {/* Media */}
      <div className="relative mx-auto h-[500px] w-full overflow-hidden rounded-2xl bg-gray-50 p-2">
        {current.media_type === 'video' ? (
          <video
            src={publicUrl}
            controls
            className="h-full w-full rounded-lg object-contain"
          />
        ) : (
          <Image
            src={publicUrl}
            alt={title}
            fill
            sizes="(max-width: 768px) 100vw, 768px"
            className="rounded-lg object-contain"
          />
        )}
      </div>

      {/* Controls */}
      {media.length > 1 && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
            disabled={index === 0}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          >
            Prev
          </button>

          <span className="text-sm text-gray-500">
            {index + 1} / {media.length}
          </span>

          <button
            onClick={() =>
              setIndex((i) => Math.min(i + 1, media.length - 1))
            }
            disabled={index === media.length - 1}
            className="rounded-lg border px-3 py-1 text-sm disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
