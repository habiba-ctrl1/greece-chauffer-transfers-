import Image from "next/image";

interface PhotoProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}

/** Fill-mode image inside an aspect-ratio box (box sets the ratio → no layout shift). */
export function Photo({ src, alt, sizes, priority, className = "" }: PhotoProps) {
  return (
    <div className={`ph ${className}`}>
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
      />
    </div>
  );
}
