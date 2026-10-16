import { cn } from '@/lib/utils';

/** "Jane Perera" → "JP", "jane" → "J". */
export function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0][0], words[words.length - 1][0]] : [words[0]?.[0] ?? '?'];
  return letters.join('').toUpperCase();
}

interface AvatarProps {
  name: string;
  /** The profile photo. Until there is one, the person's initials are shown. */
  imageUrl?: string | null;
  className?: string;
}

/** A round profile picture. Decorative: put the person's name in text next to it or in a label. */
export function Avatar({ name, imageUrl, className }: AvatarProps) {
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-sm font-semibold text-primary-foreground',
        className,
      )}
    >
      {imageUrl ? <img src={imageUrl} alt="" className="size-full object-cover" /> : initialsOf(name)}
    </span>
  );
}
