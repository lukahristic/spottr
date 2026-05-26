"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import PhoneFrame from "@/components/ui/PhoneFrame";
import WordReveal from "@/components/motion/WordReveal";
import FadeUp from "@/components/motion/FadeUp";
import { supabase } from "@/lib/supabase/browser";

/*
 * Phone stack — three cards fanned from the bottom center.
 * `transform-origin: bottom center` means rotating a card makes the
 * top swing left or right while the bottom stays roughly in place.
 * This creates a natural "held in your hand" fan effect.
 *
 * z-index order: front=3, middle=2, back=1
 * Entrance: back cards slide in from sides, front card rises from below.
 */

const backRightVariants = {
  initial: { opacity: 0, x: 70, rotate: 10 },
  animate: { opacity: 1, x: 22, rotate: 7 },
};

const backLeftVariants = {
  initial: { opacity: 0, x: -70, rotate: -9 },
  animate: { opacity: 1, x: -20, rotate: -6 },
};

const frontVariants = {
  initial: { opacity: 0, y: 40, rotate: -1 },
  animate: { opacity: 1, y: 0, rotate: -3 },
};

export default function Hero() {
  const shouldReduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [gymName, setGymName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    const trimmedGym = gymName.trim();
    setStatus("loading");
    const { error } = await supabase.from("waitlist").insert({
      email: trimmed,
      gym_name: trimmedGym || null,
    });
    if (error) {
      // Postgres unique-constraint code = 23505: already on the list
      setErrorMsg(error.code === "23505" ? "You're already on the list." : "Something went wrong. Try again.");
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  return (
    <section className="min-h-screen flex items-center pt-20 px-6 pb-16 md:pb-24">
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-12 md:gap-16 items-center">

        {/* Text */}
        <div className="order-2 md:order-1">
          <FadeUp>
            <p className="text-xs uppercase tracking-[0.2em] text-mute mb-6">
              Coming soon
            </p>
          </FadeUp>

          <h1 className="font-serif text-5xl md:text-6xl xl:text-7xl leading-[1.05] text-ink">
            <WordReveal text="You're not training alone." delay={0.1} />
          </h1>

          <FadeUp delay={0.4}>
            <p className="mt-6 text-lg md:text-xl text-mute leading-relaxed max-w-md">
              The people around you are figuring it out too. Spottr is a quiet
              way to connect — only when you both want to.
            </p>
          </FadeUp>

          <FadeUp delay={0.55}>
            <form
              id="waitlist"
              className="mt-10 flex flex-col gap-3 max-w-md"
              onSubmit={handleSubmit}
            >
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="first time, be nice"
                  required
                  disabled={status === "loading" || status === "success"}
                  className="flex-1 px-5 py-3 rounded-full bg-surface text-ink placeholder:text-mute text-sm outline-none focus:ring-2 focus:ring-gold/40 transition-shadow disabled:opacity-50"
                />
                <motion.button
                  type="submit"
                  disabled={status === "loading" || status === "success"}
                  className="px-7 py-3 rounded-full bg-gold text-ink font-medium text-sm whitespace-nowrap disabled:opacity-70"
                  whileHover={status === "idle" ? { opacity: 0.9 } : {}}
                  whileTap={status === "idle" ? { scale: 0.97 } : {}}
                  transition={{ duration: 0.15 }}
                >
                  {status === "loading" ? "Saving…" : status === "success" ? "You're in ✓" : "I’m in"}
                </motion.button>
              </div>
              <input
                type="text"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                placeholder="which gym do you train at? (optional)"
                disabled={status === "loading" || status === "success"}
                maxLength={120}
                className="px-5 py-3 rounded-full bg-surface text-ink placeholder:text-mute text-sm outline-none focus:ring-2 focus:ring-gold/40 transition-shadow disabled:opacity-50"
              />
            </form>
            {status === "success" && (
              <p className="mt-3 text-xs text-gold">You&rsquo;re on the list. We&rsquo;ll be in touch when Spottr opens at your gym.</p>
            )}
            {status === "error" && (
              <p className="mt-3 text-xs text-mute">{errorMsg}</p>
            )}
            {(status === "idle" || status === "loading") && (
              <p className="mt-3 text-xs text-mute">
                No pressure. No notifications until you check in.
              </p>
            )}
          </FadeUp>
        </div>

        {/* Phone stack */}
        <div className="order-1 md:order-2 flex justify-center md:justify-end">
          {/*
           * Container sized for one phone. The back two phones extend beyond
           * the edges due to rotation — that's intentional (overflow visible).
           * origin-bottom on each card means rotation pivots from the base.
           */}
          <div className="relative w-52 md:w-60" style={{ height: "500px" }}>

            {/* Back right — Your gyms empty state */}
            <motion.div
              className="absolute inset-0 origin-bottom"
              style={{ zIndex: 1 }}
              initial={shouldReduce ? backRightVariants.animate : backRightVariants.initial}
              animate={backRightVariants.animate}
              transition={{ duration: 0.8, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              <PhoneFrame
                src="/screenshots/your-gyms-empty.png"
                alt="Empty gym state — Your gym isn't on Spottr yet"
              />
            </motion.div>

            {/* Back left — Conversation thread */}
            <motion.div
              className="absolute inset-0 origin-bottom"
              style={{ zIndex: 2 }}
              initial={shouldReduce ? backLeftVariants.animate : backLeftVariants.initial}
              animate={backLeftVariants.animate}
              transition={{ duration: 0.8, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
            >
              <PhoneFrame
                src="/screenshots/conversation.png"
                alt="Conversation thread showing a real gym introduction"
              />
            </motion.div>

            {/* Front — Live member list + bob */}
            <motion.div
              className="absolute inset-0 origin-bottom"
              style={{ zIndex: 3 }}
              initial={shouldReduce ? frontVariants.animate : frontVariants.initial}
              animate={frontVariants.animate}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Bob wrapper — starts after entrance finishes */}
              <motion.div
                animate={shouldReduce ? {} : { y: [0, -12, 0] }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 0.8,
                }}
              >
                <PhoneFrame
                  src="/screenshots/live.png"
                  alt="Live member list showing who is at your gym right now"
                  priority
                />
              </motion.div>
            </motion.div>

          </div>
        </div>

      </div>
    </section>
  );
}
