import FadeUp from "@/components/motion/FadeUp";

/*
 * Each paragraph gets its own FadeUp with increasing delay.
 * Because FadeUp uses `useInView` with `once: true`, all three
 * observe the viewport independently — but since they enter at roughly
 * the same time (same section), the delay prop creates the visual stagger.
 */
export default function RecognitionMoment() {
  return (
    <section className="px-6 py-24 md:py-36 bg-surface">
      <div className="max-w-3xl mx-auto space-y-6 md:space-y-8">

        <FadeUp>
          <p className="font-serif text-3xl md:text-4xl xl:text-5xl leading-[1.2] text-ink">
            You&rsquo;re already around people who get it.
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <p className="font-serif text-3xl md:text-4xl xl:text-5xl leading-[1.2] text-mute">
            Same gym. Same hour. Same quiet determination.
          </p>
        </FadeUp>

        <FadeUp delay={0.3}>
          <p className="font-serif text-3xl md:text-4xl xl:text-5xl leading-[1.2] text-ink italic">
            Spottr is the part that comes after the nod.
          </p>
        </FadeUp>

      </div>
    </section>
  );
}
