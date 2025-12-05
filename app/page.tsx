"use client";

import { useEffect, useMemo, useState, type CSSProperties, type FormEvent } from "react";
import { motion } from "framer-motion";
import { getSupabaseClient } from "@/lib/supabaseClient";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blurReveal = {
  initial: { opacity: 0, y: 16, filter: "blur(6px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-10%" },
};

const FEATURE_CARDS = [
  {
    tag: "Live radar",
    title: "Heat + headcount, live",
    description: "Every venue, refreshed on the minute. See active counts on the map and who’s heating up.",
    accent: "#76e4f7",
  },
  {
    tag: "Check-in unlocks",
    title: "QR verified",
    description: "QR + device signals verify real people in real rooms. Message people inside only after you check in.",
    accent: "#d4ff00",
  },
  {
    tag: "Blur control",
    title: "Privacy first",
    description: "Blur stays on until you connect. You decide who sees you once you’re verified at the venue.",
    accent: "#b58bff",
  },
  {
    tag: "100s chats",
    title: "High intent only",
    description: "One credit, 100 seconds to make a move. No endless swiping or ghost feeds.",
    accent: "#ff6b99",
  },
  {
    tag: "Host console",
    title: "Real-time controls",
    description: "Spotlight sets, tune cover, and see verified audience signals inside.",
    accent: "#8bffcc",
  },
  {
    tag: "Geo check-ins",
    title: "Map + presence",
    description: "Geolocation-backed check-ins tie you to the venue. Map shows real counts before you move.",
    accent: "#ffc266",
  },
];

const PROBLEM_SOLUTIONS = [
  { problem: "Static flyers and DMs", solution: "A live radar with heat and real headcounts on the map. No guessing.", accent: "#76e4f7" },
  { problem: "Fakes and no-shows", solution: "QR + device verification. Blur-on-until-connection keeps safety first and real.", accent: "#d4ff00" },
  { problem: "Dead feeds and spam", solution: "Time-boxed 100-second chats + credits to keep the feed moving with intent.", accent: "#ff6b99" },
  { problem: "Hosts in the dark", solution: "Hosts push updates instantly and see verified audience signals before opening the rope.", accent: "#b58bff" },
];

const VENUE_POINTS = [
  "Push live cover, waits, and set changes.",
  "Verify check-ins with QR + device signals.",
  "See intent: credits, chats, and live presence.",
  "Reach only the audience that is in or near your venue.",
];

const TESTIMONIALS = [
  { quote: "Finally, a nightlife feed that feels alive, not a flyer archive.", name: "Pilot guest", role: "Beta user" },
  { quote: "The check-in verification killed 90% of the spoofing we dealt with.", name: "Venue host", role: "Pilot venue" },
];

const ROADMAP = [
  { phase: "Wave 01", location: "Kosovo", detail: "Invite-only beta. Live radar + 100s chats + QR check-ins.", accent: "#d4ff00" },
  { phase: "Wave 02", location: "EU cities", detail: "More venues, host console v2, credits marketplace.", accent: "#76e4f7" },
  { phase: "Wave 03", location: "Global", detail: "Open waitlist, automation for hosts, deeper safety signals.", accent: "#ff6b99" },
];

const nextWaveTarget = () => {
  const now = new Date();
  const year = now.getMonth() > 1 || (now.getMonth() === 1 && now.getDate() > 19) ? now.getFullYear() + 1 : now.getFullYear();
  // Feb is month index 1; use end of day UTC.
  return Date.UTC(year, 1, 19, 23, 59, 59);
};

export default function Home() {
  const supabase = getSupabaseClient();

  const [waitlistForm, setWaitlistForm] = useState({ name: "", email: "" });
  const [waitlistState, setWaitlistState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const [partnerForm, setPartnerForm] = useState({
    venueName: "",
    contactName: "",
    email: "",
    city: "",
    role: "Owner",
  });
  const [partnerState, setPartnerState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [partnerError, setPartnerError] = useState<string | null>(null);

  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactState, setContactState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [contactError, setContactError] = useState<string | null>(null);

  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const targetTime = useMemo(() => nextWaveTarget(), []);

  const heroGradient: CSSProperties = useMemo(
    () => ({
      background:
        "radial-gradient(circle at 15% 20%, rgba(118,228,247,0.18), transparent 38%), radial-gradient(circle at 80% 15%, rgba(255,107,153,0.16), transparent 35%), radial-gradient(circle at 65% 70%, rgba(212,255,0,0.12), transparent 42%), #05060c",
    }),
    [],
  );

  useEffect(() => {
    const tick = () => {
      const now = Date.now();
      const delta = Math.max(targetTime - now, 0);
      const days = Math.floor(delta / (1000 * 60 * 60 * 24));
      const hours = Math.floor((delta / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((delta / (1000 * 60)) % 60);
      const seconds = Math.floor((delta / 1000) % 60);
      const fmt = (n: number) => n.toString().padStart(2, "0");
      setCountdown({ days: fmt(days), hours: fmt(hours), minutes: fmt(minutes), seconds: fmt(seconds) });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetTime]);

  const handleWaitlistSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWaitlistError(null);
    if (!EMAIL_REGEX.test(waitlistForm.email)) {
      setWaitlistError("Drop a valid email so we can ping you.");
      return;
    }
    setWaitlistState("loading");
    try {
      if (supabase) {
        const { error } = await supabase.from("waitlist").insert({
          email: waitlistForm.email.toLowerCase(),
          name: waitlistForm.name || null,
          referral_count: 0,
        });
        if (error) throw error;

        // optional email notification
        fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: waitlistForm.name || "Waitlist",
            email: waitlistForm.email,
            message: `Waitlist signup from landing: ${waitlistForm.email}`,
          }),
        }).catch(() => {});
      }
      setWaitlistState("success");
    } catch (err) {
      console.error(err);
      setWaitlistError("Something glitched. Try again in a beat.");
      setWaitlistState("error");
    }
  };

  const handlePartnerSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPartnerError(null);
    if (!EMAIL_REGEX.test(partnerForm.email)) {
      setPartnerError("Enter a valid contact email.");
      return;
    }
    setPartnerState("loading");
    try {
      if (supabase) {
        const { error } = await supabase.from("partners").insert({
          venue_name: partnerForm.venueName,
          contact_name: partnerForm.contactName,
          email: partnerForm.email.toLowerCase(),
          city: partnerForm.city,
          role: partnerForm.role,
        });
        if (error) throw error;

        fetch("/api/contact", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: partnerForm.contactName || partnerForm.venueName,
            email: partnerForm.email,
            message: `Venue partner signup: ${partnerForm.venueName}, city: ${partnerForm.city}, role: ${partnerForm.role}, contact: ${partnerForm.contactName} <${partnerForm.email}>`,
          }),
        }).catch(() => {});
      }
      setPartnerState("success");
    } catch (err) {
      console.error(err);
      setPartnerError("Could not save. Try again shortly.");
      setPartnerState("error");
    }
  };

  const handleContactSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setContactError(null);
    if (!EMAIL_REGEX.test(contactForm.email) || !contactForm.message.trim()) {
      setContactError("Add a valid email and a message.");
      return;
    }
    setContactState("loading");
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: contactForm.name || "Contact",
          email: contactForm.email,
          message: contactForm.message,
        }),
      });
      setContactState("success");
    } catch (err) {
      console.error(err);
      setContactError("Failed to send. Try again.");
      setContactState("error");
    }
  };

  return (
    <div className="min-h-screen bg-[#05060c] text-white">
      <header className="sticky top-0 z-30 border-b border-white/5 bg-black/75 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="heading-font text-lg text-[#d4ff00] drop-shadow-[0_0_14px_rgba(212,255,0,0.45)]">NATAA</div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-white/70">
            <a
              className="hidden rounded-full border border-white/10 px-3 py-1.5 md:inline hover:text-[#d4ff00]"
              href="https://instagram.com/Nataa.app"
              target="_blank"
              rel="noreferrer"
            >
              IG @Nataa.app
            </a>
            <a className="rounded-full border border-white/10 px-3 py-1.5 hover:text-[#d4ff00]" href="#download-apk">
              Download APK
            </a>
            <a className="rounded-full border border-white/10 px-3 py-1.5 hover:text-[#d4ff00]" href="#venues">
              For venues
            </a>
            <a className="rounded-full border border-[#d4ff00]/60 bg-[#d4ff00] px-3 py-1.5 text-black shadow-[0_0_16px_rgba(212,255,0,0.4)]" href="#waitlist">
              Join waitlist
            </a>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-90" style={heroGradient} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.06),transparent_45%)]" />
          <div className="relative mx-auto flex min-h-[70vh] max-w-6xl flex-col gap-10 px-4 py-14 md:flex-row md:items-center md:px-6 md:py-20">
            <div className="flex-1 space-y-6">
              <motion.div {...blurReveal} transition={{ duration: 0.7 }}>
                <p className="mono-font mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/70">
                  Coming soon · Kosovo first
                  <span className="h-2 w-2 rounded-full bg-[#d4ff00] shadow-[0_0_10px_rgba(212,255,0,0.8)]" />
                </p>
                <h1 className="heading-font text-4xl leading-tight text-white md:text-5xl">Nightlife with live proof. No more guessing.</h1>
                <p className="max-w-2xl text-lg text-white/75">
                  Live radar with real headcounts. QR-verified check-ins. Blur until you connect. Message people inside once you’re in, with 100-second chats.
                </p>
              </motion.div>

              <motion.div {...blurReveal} transition={{ duration: 0.7, delay: 0.05 }} className="flex flex-wrap gap-3 text-sm text-white/70">
                <span className="rounded-full border border-white/10 px-3 py-1">Live heatmap</span>
                <span className="rounded-full border border-white/10 px-3 py-1">Verified check-ins</span>
                <span className="rounded-full border border-white/10 px-3 py-1">100-second chats</span>
                <span className="rounded-full border border-white/10 px-3 py-1">Host controls</span>
              </motion.div>

              <motion.div {...blurReveal} transition={{ duration: 0.7, delay: 0.1 }} className="flex flex-col gap-3">
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-black/70 to-black/80 p-5 shadow-[0_30px_70px_rgba(0,0,0,0.4)]" id="waitlist">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="mono-font text-[12px] uppercase tracking-[0.18em] text-white/70">Beta Wave 01</div>
                    <div className="flex w-full flex-wrap justify-between gap-2 text-center text-white/80 sm:w-auto sm:justify-end">
                      {(["days", "hours", "minutes", "seconds"] as const).map((unit) => (
                        <div
                          key={unit}
                          className="flex-1 min-w-[70px] rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:min-w-[88px]"
                        >
                          <div className="heading-font text-lg text-white sm:text-xl">{countdown[unit]}</div>
                          <div className="mono-font text-[10px] uppercase tracking-[0.2em] text-white/50 sm:text-[11px]">
                            {unit}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <form onSubmit={handleWaitlistSubmit} className="mt-4 flex flex-col gap-3">
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <input
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0"
                        placeholder="Name (optional)"
                        value={waitlistForm.name}
                        onChange={(e) => setWaitlistForm((prev) => ({ ...prev, name: e.target.value }))}
                      />
                      <input
                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0"
                        placeholder="Email for the beta"
                        value={waitlistForm.email}
                        onChange={(e) => setWaitlistForm((prev) => ({ ...prev, email: e.target.value }))}
                        required
                      />
                    </div>
                    {waitlistError ? <p className="text-sm text-[#ff98a4]">{waitlistError}</p> : null}
                    {waitlistState === "success" ? (
                      <p className="text-sm text-[#d4ff00]">You’re in. We’ll email your invite.</p>
                    ) : (
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="submit"
                          disabled={waitlistState === "loading"}
                          className="rounded-xl border border-[#d4ff00]/70 bg-[#d4ff00] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_16px_rgba(212,255,0,0.45)] disabled:opacity-60"
                        >
                          {waitlistState === "loading" ? "Joining..." : "Join the waitlist"}
                        </button>
                        <span className="mono-font text-xs uppercase tracking-[0.2em] text-white/60">No spam. Invite only.</span>
                      </div>
                    )}
                  </form>
                </div>
              </motion.div>
            </div>

            <motion.div
              {...blurReveal}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="relative flex-1 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.45)]"
            >
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,rgba(118,228,247,0.12),transparent_45%),radial-gradient(circle_at_75%_65%,rgba(255,107,153,0.12),transparent_40%)] opacity-60" />
              <div className="relative space-y-4">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-white/60">
                  <span>What’s shipping</span>
                  <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-[#d4ff00]">Wave 01</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {FEATURE_CARDS.slice(0, 4).map((card) => (
                    <div key={card.title} className="rounded-2xl border border-white/10 bg-black/60 p-4">
                      <div className="mono-font text-[11px] uppercase tracking-[0.18em]" style={{ color: card.accent }}>
                        {card.tag}
                      </div>
                      <h3 className="heading-font text-lg text-white">{card.title}</h3>
                      <p className="mt-2 text-sm text-white/65">{card.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6">
          <motion.h2 {...blurReveal} transition={{ duration: 0.7 }} className="heading-font mb-3 text-3xl text-white md:text-4xl">
            Signals at a glance.
          </motion.h2>
          <p className="mb-6 max-w-3xl text-white/70">What you see before you move: headcounts, proximity, and chats you can unlock after check-in.</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <div className="mono-font text-[11px] uppercase tracking-[0.18em] text-[#76e4f7]">Venue live</div>
              <h3 className="heading-font text-xl text-white">124 inside · live now</h3>
              <p className="mt-2 text-sm text-white/65">See real headcount before you head out.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <div className="mono-font text-[11px] uppercase tracking-[0.18em] text-[#d4ff00]">Nearby</div>
              <h3 className="heading-font text-xl text-white">8 venues in 1 km</h3>
              <p className="mt-2 text-sm text-white/65">See heat by distance and filter by vibe.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <div className="mono-font text-[11px] uppercase tracking-[0.18em] text-[#ff6b99]">Chats inside</div>
              <h3 className="heading-font text-xl text-white">32 chats unlocked</h3>
              <p className="mt-2 text-sm text-white/65">Message people already checked in after you verify.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <motion.h2 {...blurReveal} transition={{ duration: 0.7 }} className="heading-font mb-3 text-3xl text-white md:text-4xl">
            Why Nataa solves the night.
          </motion.h2>
          <p className="mb-8 max-w-3xl text-white/70">
            The night is live, but information is stuck in flyers and chats. We give guests and hosts the same real-time signal so everyone moves with intent.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {PROBLEM_SOLUTIONS.map((item, idx) => (
              <motion.div
                key={item.problem}
                {...blurReveal}
                transition={{ duration: 0.6, delay: 0.05 * idx }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
              >
                <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/60">Problem</div>
                <h3 className="heading-font text-xl text-white">{item.problem}</h3>
                <p className="mt-2 text-sm text-white/65">
                  <span className="font-semibold" style={{ color: item.accent }}>
                    Our fix:
                  </span>{" "}
                  {item.solution}
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <motion.h2 {...blurReveal} transition={{ duration: 0.7 }} className="heading-font mb-3 text-3xl text-white md:text-4xl">
            Core features that are shipping.
          </motion.h2>
          <p className="mb-8 max-w-3xl text-white/70">From radar to host controls, here is what is in Wave 01.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {FEATURE_CARDS.map((card, idx) => (
              <motion.div
                key={card.title}
                {...blurReveal}
                transition={{ duration: 0.6, delay: 0.04 * idx }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
              >
                <div className="mono-font text-[11px] uppercase tracking-[0.18em]" style={{ color: card.accent }}>
                  {card.tag}
                </div>
                <h3 className="heading-font text-xl text-white">{card.title}</h3>
                <p className="mt-2 text-sm text-white/65">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <motion.h2 {...blurReveal} transition={{ duration: 0.7 }} className="heading-font mb-3 text-3xl text-white md:text-4xl">
            How the app works.
          </motion.h2>
          <p className="mb-8 max-w-3xl text-white/70">Three steps: see the signal, check in, and connect with the people already inside.</p>
          <div className="grid gap-4 md:grid-cols-3">
            <motion.div {...blurReveal} transition={{ duration: 0.6, delay: 0.02 }} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <div className="mono-font text-[11px] uppercase tracking-[0.18em] text-[#76e4f7]">1 · Radar</div>
              <h3 className="heading-font text-xl text-white">See live headcounts</h3>
              <p className="mt-2 text-sm text-white/65">Open the map, see how many are inside each venue, and what’s heating up nearby.</p>
            </motion.div>
            <motion.div {...blurReveal} transition={{ duration: 0.6, delay: 0.06 }} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <div className="mono-font text-[11px] uppercase tracking-[0.18em] text-[#d4ff00]">2 · Check in</div>
              <h3 className="heading-font text-xl text-white">Verify at the door</h3>
              <p className="mt-2 text-sm text-white/65">Scan QR + geolocation to unlock the venue room. Blur stays on until you connect.</p>
            </motion.div>
            <motion.div {...blurReveal} transition={{ duration: 0.6, delay: 0.1 }} className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]">
              <div className="mono-font text-[11px] uppercase tracking-[0.18em] text-[#ff6b99]">3 · Connect</div>
              <h3 className="heading-font text-xl text-white">Chat with 100s</h3>
              <p className="mt-2 text-sm text-white/65">Message people already inside; 100-second chats keep things moving and intentional.</p>
            </motion.div>
          </div>
        </section>

        <section className="bg-[#060812] px-4 py-16 md:px-6" id="venues">
          <div className="mx-auto max-w-6xl">
            <motion.div {...blurReveal} transition={{ duration: 0.7 }} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mono-font text-[11px] uppercase tracking-[0.2em] text-white/60">Venues</p>
                <h2 className="heading-font text-3xl text-white md:text-4xl">Collaborate with us.</h2>
                <p className="max-w-2xl text-white/70">
                  We are onboarding select venues for the first wave. Push live updates, verify guests, and convert the right audience.
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm text-white/70">
                {VENUE_POINTS.map((point) => (
                  <span key={point} className="rounded-full border border-white/10 px-3 py-1">
                    {point}
                  </span>
                ))}
              </div>
            </motion.div>

            <div className="mt-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <motion.div
                {...blurReveal}
                transition={{ duration: 0.7, delay: 0.05 }}
                className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.35)]"
              >
                <form className="space-y-3" onSubmit={handlePartnerSubmit}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0"
                      placeholder="Venue name"
                      value={partnerForm.venueName}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, venueName: e.target.value }))}
                      required
                    />
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0"
                      placeholder="Contact name"
                      value={partnerForm.contactName}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, contactName: e.target.value }))}
                      required
                    />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0"
                      placeholder="Contact email"
                      value={partnerForm.email}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, email: e.target.value }))}
                      required
                    />
                    <input
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0"
                      placeholder="City"
                      value={partnerForm.city}
                      onChange={(e) => setPartnerForm((p) => ({ ...p, city: e.target.value }))}
                    />
                  </div>
                  <input
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0"
                    placeholder="Role (Owner, Manager, Promoter)"
                    value={partnerForm.role}
                    onChange={(e) => setPartnerForm((p) => ({ ...p, role: e.target.value }))}
                  />
                  {partnerError ? <p className="text-sm text-[#ff98a4]">{partnerError}</p> : null}
                  {partnerState === "success" ? (
                    <p className="text-sm text-[#d4ff00]">Thanks. We will reach out within 24h.</p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={partnerState === "loading"}
                        className="rounded-xl border border-[#76e4f7]/70 bg-[#76e4f7] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_16px_rgba(118,228,247,0.4)] disabled:opacity-60"
                      >
                        {partnerState === "loading" ? "Sending..." : "Partner with us"}
                      </button>
                      <span className="mono-font text-xs uppercase tracking-[0.2em] text-white/60">We reply fast.</span>
                    </div>
                  )}
                </form>
              </motion.div>

              <motion.div
                {...blurReveal}
                transition={{ duration: 0.7, delay: 0.1 }}
                className="rounded-3xl border border-white/10 bg-black/60 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.35)]"
              >
                <div className="mono-font text-[11px] uppercase tracking-[0.2em] text-white/60">What venues get</div>
                <div className="mt-3 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>Live controls</span>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-[#76e4f7]">Dashboard</span>
                    </div>
                    <p className="mt-2 text-sm text-white/65">Update cover, wait, and host notes in real time.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>Verified audience</span>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-[#ff6b99]">Signal</span>
                    </div>
                    <p className="mt-2 text-sm text-white/65">QR + device verification reduces spoofing and no-shows.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center justify-between text-sm text-white/70">
                      <span>Higher intent</span>
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-[#d4ff00]">100s chats</span>
                    </div>
                    <p className="mt-2 text-sm text-white/65">Time-boxed chats + credits keep the feed active and focused.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <motion.h2 {...blurReveal} transition={{ duration: 0.7 }} className="heading-font mb-3 text-3xl text-white md:text-4xl">
            What early users say.
          </motion.h2>
          <div className="grid gap-4 md:grid-cols-2">
            {TESTIMONIALS.map((t, idx) => (
              <motion.div
                key={t.quote}
                {...blurReveal}
                transition={{ duration: 0.6, delay: 0.05 * idx }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
              >
                <p className="text-sm text-white/80">“{t.quote}”</p>
                <div className="mt-3 text-sm text-white/60">
                  {t.name} · {t.role}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14 md:px-6">
          <motion.h2 {...blurReveal} transition={{ duration: 0.7 }} className="heading-font mb-3 text-3xl text-white md:text-4xl">
            Roadmap
          </motion.h2>
          <div className="grid gap-4 md:grid-cols-3">
            {ROADMAP.map((r, idx) => (
              <motion.div
                key={r.phase}
                {...blurReveal}
                transition={{ duration: 0.6, delay: 0.05 * idx }}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-[0_18px_40px_rgba(0,0,0,0.35)]"
              >
                <div className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em]" style={{ color: r.accent }}>
                  {r.phase}
                </div>
                <h3 className="heading-font text-xl text-white">{r.location}</h3>
                <p className="mt-2 text-sm text-white/65">{r.detail}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-16 md:px-6" id="download-apk">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 via-black/60 to-white/5 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="heading-font text-2xl text-white">Download the Android beta.</h3>
                <p className="text-white/70">Direct APK download for Android. This is a non-production build and may have bugs; fixes are underway.</p>
                <p className="mt-2 text-white/60 text-sm">Need help? contact@nataa.app</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=ffffff&bgcolor=0b0d14&data=https%3A%2F%2Flimewire.com%2Fd%2F8RfgY%23fEFu7VVIlC"
                    alt="APK QR"
                    className="h-20 w-20 rounded-md border border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.35)]"
                  />
                  <div className="text-xs text-white/70">Scan to download the APK directly to your Android device.</div>
                </div>
                <a
                  href="https://limewire.com/d/8RfgY#fEFu7VVIlC"
                  className="rounded-xl border border-[#d4ff00]/70 bg-[#d4ff00] px-4 py-2.5 text-xs font-semibold text-black shadow-[0_0_16px_rgba(212,255,0,0.45)]"
                  download
                  target="_blank"
                  rel="noreferrer"
                >
                  Download Android APK
                </a>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6" id="contact">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-xl">
                <p className="mono-font text-[11px] uppercase tracking-[0.2em] text-white/60">Contact</p>
                <h3 className="heading-font text-2xl text-white">Talk to the team.</h3>
                <p className="text-white/70">
                  Questions, press, or partnerships? DM us on IG <a className="text-[#d4ff00]" href="https://instagram.com/Nataa.app" target="_blank" rel="noreferrer">@Nataa.app</a> or drop a note here.
                </p>
              </div>
              <form className="mt-4 w-full max-w-lg space-y-3" onSubmit={handleContactSubmit}>
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0"
                  placeholder="Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))}
                />
                <input
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0"
                  placeholder="Email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
                <textarea
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0"
                  placeholder="How can we help?"
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))}
                  required
                />
                {contactError ? <p className="text-sm text-[#ff98a4]">{contactError}</p> : null}
                {contactState === "success" ? (
                  <p className="text-sm text-[#d4ff00]">Message sent. We’ll reply shortly.</p>
                ) : (
                  <button
                    type="submit"
                    disabled={contactState === "loading"}
                    className="w-full rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_16px_rgba(255,255,255,0.15)] disabled:opacity-60"
                  >
                    {contactState === "loading" ? "Sending..." : "Send message"}
                  </button>
                )}
              </form>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
