"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import WordReveal from "@/components/motion/WordReveal";
import FadeUp from "@/components/motion/FadeUp";
import { supabase } from "@/lib/supabase/browser";

// Shared easing curve — expo-out, snappy deceleration
const EASE = [0.16, 1, 0.3, 1] as const;

// ─── Demo members rendered inside the phone screen ────────────────────────────
const MEMBERS = [
  {
    initials: "AJ",
    name: "Alex J.",
    goal: "Building strength",
    vibe: "Motivated",
    vibeClass: "bg-tan text-amber-900",
    open: false,
  },
  {
    initials: "MR",
    name: "Maya R.",
    goal: "Zone 2 cardio",
    vibe: "Focused",
    vibeClass: "bg-sky text-blue-900",
    open: true,
  },
  {
    initials: "SK",
    name: "Sam K.",
    goal: "Learning the basics",
    vibe: "Learning",
    vibeClass: "bg-sage text-emerald-900",
    open: true,
  },
] as const;

type Member = (typeof MEMBERS)[number];

// ─── Hero ─────────────────────────────────────────────────────────────────────
export default function Hero() {
  const shouldReduce = useReducedMotion();
  const [email, setEmail] = useState("");
  const [gymName, setGymName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return;
    setStatus("loading");
    const { error } = await supabase.from("waitlist").insert({
      email: trimmed,
      gym_name: gymName.trim() || null,
    });
    if (error) {
      setErrorMsg(
        error.code === "23505"
          ? "You're already on the list."
          : "Something went wrong. Try again."
      );
      setStatus("error");
    } else {
      setStatus("success");
    }
  }

  return (
    <section className="min-h-screen flex items-center pt-24 px-6 pb-20 md:pb-32 overflow-x-hidden">
      <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 md:gap-20 items-center">

        {/* ── Left: copy + waitlist ── */}
        <div className="order-2 md:order-1">

          {/* Eyebrow */}
          <FadeUp>
            <div className="inline-flex items-center gap-2 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-sage inline-block" />
              <span className="text-xs uppercase tracking-[0.18em] text-mute font-medium">
                Private beta — seed gyms only
              </span>
            </div>
          </FadeUp>

          {/* Headline */}
          <h1 className="font-serif text-5xl md:text-6xl xl:text-[4.25rem] leading-[1.05] text-ink tracking-tight">
            <WordReveal text="The gym has always been social." delay={0.1} />
          </h1>

          {/* Sub */}
          <FadeUp delay={0.4}>
            <p className="mt-6 text-[1.0625rem] md:text-lg text-mute leading-relaxed max-w-md">
              Spottr gives that a quiet on-ramp — check in, share your vibe,
              and connect only when you&rsquo;re both ready.
            </p>
          </FadeUp>

          {/* Waitlist form */}
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
                  placeholder="your email"
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
                  {status === "loading"
                    ? "Saving…"
                    : status === "success"
                    ? "You're in ✓"
                    : "Join waitlist"}
                </motion.button>
              </div>
              <input
                type="text"
                value={gymName}
                onChange={(e) => setGymName(e.target.value)}
                placeholder="your gym (optional)"
                disabled={status === "loading" || status === "success"}
                maxLength={120}
                className="px-5 py-3 rounded-full bg-surface text-ink placeholder:text-mute text-sm outline-none focus:ring-2 focus:ring-gold/40 transition-shadow disabled:opacity-50"
              />
            </form>

            {status === "success" && (
              <p className="mt-3 text-xs text-gold">
                You&rsquo;re on the list. We&rsquo;ll reach out when Spottr
                opens at your gym.
              </p>
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

        {/* ── Right: stylized phone mockup ── */}
        <div className="order-1 md:order-2 flex justify-center md:justify-end">
          <PhoneMockup shouldReduce={shouldReduce ?? false} />
        </div>

      </div>
    </section>
  );
}

// ─── Phone mockup composition ─────────────────────────────────────────────────
// Container is 300 × 580px — sized to hold the phone (260 × 510) plus room
// for the two floating cards that overlap the phone edges.
//
//   Notification (top-right): sits from x:108 to x:300, overlaps phone's
//   top-right corner. Appears to "pop out" of the screen.
//
//   Active badge (bottom-left): sits from x:0 to x:~180, overlaps phone's
//   lower-left edge at y:485-540.
//
function PhoneMockup({ shouldReduce }: { shouldReduce: boolean }) {
  return (
    <div className="relative" style={{ width: 300, height: 580 }}>

      {/* Ambient glow — warm gold wash behind the phone */}
      <div
        className="absolute rounded-full bg-gold/[0.07] blur-3xl pointer-events-none"
        style={{ inset: "48px 24px" }}
      />

      {/* ── Floating: reply notification (top-right) ── */}
      <motion.div
        className="absolute z-20"
        style={{ top: 8, right: 0 }}
        initial={
          shouldReduce
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 14, scale: 0.96 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.5, ease: EASE }}
      >
        <ReplyBubble />
      </motion.div>

      {/* ── Floating: active members badge (lower-left) ── */}
      <motion.div
        className="absolute z-20"
        style={{ bottom: 40, left: 0 }}
        initial={
          shouldReduce
            ? { opacity: 1, y: 0, scale: 1 }
            : { opacity: 0, y: 14, scale: 0.96 }
        }
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.85, duration: 0.5, ease: EASE }}
      >
        <ActiveBadge />
      </motion.div>

      {/* ── Phone ── */}
      <motion.div
        className="absolute z-10"
        style={{ left: 20, top: 48, width: 260, height: 510 }}
        initial={shouldReduce ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.8, ease: EASE }}
      >
        {/* Slow vertical float — starts after entrance finishes */}
        <motion.div
          className="w-full h-full"
          animate={shouldReduce ? {} : { y: [0, -10, 0] }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.2,
          }}
        >
          <PhoneShell />
        </motion.div>
      </motion.div>

    </div>
  );
}

// ─── Phone outer shell ────────────────────────────────────────────────────────
function PhoneShell() {
  return (
    /*
     * Outer: dark bezel + shadow + subtle edge highlight.
     * Inner: cream screen with overflow-hidden to clip app content.
     * p-[3.5px] simulates the glass-to-bezel transition.
     */
    <div className="w-full h-full rounded-[2.5rem] bg-[#1c1c1e] p-[3.5px] ring-[0.5px] ring-white/[0.08] shadow-[0_40px_80px_rgba(0,0,0,0.22),0_8px_24px_rgba(0,0,0,0.10)]">
      <div className="w-full h-full rounded-[2.25rem] bg-cream overflow-hidden flex flex-col">

        {/* Status bar */}
        <div className="flex items-center justify-between px-6 pt-[14px] pb-1 flex-shrink-0">
          <span className="text-[11px] font-semibold text-ink/70 tracking-tight">
            9:41
          </span>
          <StatusBarIcons />
        </div>

        {/* Dynamic island */}
        <div className="flex justify-center -mt-0.5 mb-1 flex-shrink-0">
          <div className="w-[88px] h-[24px] rounded-full bg-[#1c1c1e]" />
        </div>

        {/* App header */}
        <div className="px-5 pt-2 pb-2.5 flex-shrink-0">
          <p className="text-[9.5px] text-mute uppercase tracking-[0.16em] font-medium mb-0.5">
            Iron House Gym
          </p>
          <div className="flex items-center justify-between">
            <span className="text-[15px] font-semibold text-ink leading-none">
              Here now
            </span>
            <div className="inline-flex items-center gap-1.5 bg-surface rounded-full px-2.5 py-[5px]">
              <span className="w-[6px] h-[6px] rounded-full bg-sage inline-block flex-shrink-0" />
              <span className="text-[10px] font-medium text-mute leading-none">
                4 members
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-5 h-px bg-surface flex-shrink-0" />

        {/* Member list */}
        <div className="flex-1 px-3.5 py-3 flex flex-col gap-2 overflow-hidden">
          {MEMBERS.map((m, i) => (
            <MemberCard key={m.initials} member={m} index={i} />
          ))}
        </div>

        {/* Bottom tab bar */}
        <div className="flex-shrink-0 border-t border-surface/70 flex justify-around items-center px-3 pt-2.5 pb-5">
          {(["home", "users", "chat", "person"] as const).map((icon, i) => (
            <TabIcon key={icon} icon={icon} active={i === 0} />
          ))}
        </div>

      </div>
    </div>
  );
}

// ─── Status bar icons ─────────────────────────────────────────────────────────
function StatusBarIcons() {
  return (
    <div className="flex items-center gap-1.5">
      {/* Signal bars */}
      <div className="flex items-end gap-[2.5px]">
        {[3, 5, 7, 9].map((h, i) => (
          <div
            key={i}
            className="w-[2.5px] bg-ink/40 rounded-[1px]"
            style={{ height: h }}
          />
        ))}
      </div>
      {/* Wi-Fi */}
      <svg
        className="w-3 h-3 text-ink/40"
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="12" cy="20" r="1.5" fill="currentColor" />
      </svg>
      {/* Battery */}
      <svg
        className="w-[22px] h-[11px] text-ink/45"
        viewBox="0 0 22 11"
        fill="none"
        aria-hidden="true"
      >
        <rect
          x="0.5"
          y="0.5"
          width="18"
          height="10"
          rx="2.5"
          stroke="currentColor"
        />
        <rect x="2" y="2" width="14" height="7" rx="1.5" fill="currentColor" />
        <path d="M20 3.5v4a1.5 1.5 0 000-4z" fill="currentColor" />
      </svg>
    </div>
  );
}

// ─── Member card (inside phone screen) ───────────────────────────────────────
function MemberCard({ member, index }: { member: Member; index: number }) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className="flex items-center gap-2.5 bg-white/55 rounded-2xl px-3 py-2.5 border border-surface/50"
      initial={
        shouldReduce
          ? { opacity: 1, x: 0 }
          : { opacity: 0, x: 14 }
      }
      animate={{ opacity: 1, x: 0 }}
      transition={
        shouldReduce
          ? {}
          : { delay: 0.65 + index * 0.1, duration: 0.45, ease: EASE }
      }
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-surface flex-shrink-0 flex items-center justify-center border border-surface/80">
        <span className="text-[10px] font-semibold text-ink/55">
          {member.initials}
        </span>
      </div>

      {/* Name + goal */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-semibold text-ink leading-none mb-[3px]">
          {member.name}
        </p>
        <p className="text-[9.5px] text-mute truncate">{member.goal}</p>
      </div>

      {/* Vibe pill + open badge */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className={`text-[9px] font-semibold px-2 py-[3px] rounded-full ${member.vibeClass}`}
        >
          {member.vibe}
        </span>
        {member.open && (
          <span className="text-[9px] font-semibold px-2 py-[3px] rounded-full bg-sage/25 text-emerald-900">
            Open ✦
          </span>
        )}
      </div>
    </motion.div>
  );
}

// ─── Tab bar icon ─────────────────────────────────────────────────────────────
function TabIcon({
  icon,
  active,
}: {
  icon: "home" | "users" | "chat" | "person";
  active: boolean;
}) {
  const cls = `w-[18px] h-[18px] ${active ? "text-gold" : "text-ink/25"}`;
  return (
    <div className={`p-2 rounded-xl ${active ? "bg-gold/15" : ""}`}>
      {icon === "home" && (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
        </svg>
      )}
      {icon === "users" && (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
        </svg>
      )}
      {icon === "chat" && (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z"
            clipRule="evenodd"
          />
        </svg>
      )}
      {icon === "person" && (
        <svg className={cls} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
}

// ─── Floating: reply notification ────────────────────────────────────────────
function ReplyBubble() {
  return (
    <div className="w-[188px] bg-white rounded-2xl px-3.5 py-2.5 flex items-start gap-2.5 shadow-[0_8px_32px_rgba(43,43,43,0.10),0_1px_4px_rgba(43,43,43,0.06)]">
      {/* Maya's avatar */}
      <div className="w-8 h-8 rounded-full bg-sky flex-shrink-0 flex items-center justify-center">
        <span className="text-[9px] font-bold text-blue-900">MR</span>
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-ink leading-snug">
          Maya replied
        </p>
        <p className="text-[10px] text-mute leading-snug mt-[2px] truncate">
          &ldquo;Sure, mornings work!&rdquo;
        </p>
      </div>
    </div>
  );
}

// ─── Floating: active members badge ──────────────────────────────────────────
function ActiveBadge() {
  return (
    <div className="bg-white rounded-xl px-3 py-2.5 flex items-center gap-2.5 shadow-[0_4px_20px_rgba(43,43,43,0.09),0_1px_4px_rgba(43,43,43,0.04)]">
      {/* Stacked avatar circles */}
      <div className="flex -space-x-1.5 flex-shrink-0">
        {(["bg-sage", "bg-tan", "bg-sky"] as const).map((c, i) => (
          <div
            key={i}
            className={`w-5 h-5 rounded-full ${c} border-[2px] border-white`}
          />
        ))}
      </div>
      <div>
        <p className="text-[11px] font-semibold text-ink whitespace-nowrap leading-snug">
          3 open to chat
        </p>
        <p className="text-[9px] text-mute whitespace-nowrap leading-snug">
          at Iron House right now
        </p>
      </div>
    </div>
  );
}
