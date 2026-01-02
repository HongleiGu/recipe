export default function TagBadge({ name }: { name: string }) {
  return <span className="px-2 py-1 text-xs rounded-full bg-gray-200">{name}</span>
}