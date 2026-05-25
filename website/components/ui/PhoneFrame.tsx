import Image from "next/image";

interface PhoneFrameProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
}

/*
 * A flat, warm device frame. Deliberately not the glossy Apple marketing
 * mockup — rounded rect + soft border + shadow is more editorial, less generic.
 *
 * Uses `fill` so the parent controls the size. Caller must pass a className
 * with explicit width (e.g. "w-64 md:w-72") — the aspect-[9/19] inside here
 * sets the height automatically to match a tall Android screenshot ratio.
 */
export default function PhoneFrame({
  src,
  alt,
  className = "",
  priority = false,
}: PhoneFrameProps) {
  return (
    <div className={`w-full ${className}`}>
      <div className="relative aspect-[9/19] w-full rounded-[2rem] overflow-hidden border-2 border-surface shadow-2xl bg-surface">
        <Image
          src={src}
          alt={alt}
          fill
          priority={priority}
          className="object-cover object-top"
          sizes="(max-width: 768px) 256px, 320px"
        />
      </div>
    </div>
  );
}
