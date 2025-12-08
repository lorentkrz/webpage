"use client"

import { useEffect, useMemo, useState, useCallback, useRef, type CSSProperties, type FormEvent, type TouchEvent } from "react";
import type React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { getSupabaseClient } from "@/lib/supabaseClient";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const blurReveal = {
  initial: { opacity: 0, y: 16, filter: "blur(6px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-10%" },
};

const cardReveal = {
  initial: { opacity: 0, scale: 0.98, filter: "blur(8px)" },
  whileInView: { opacity: 1, scale: 1, filter: "blur(0px)" },
  viewport: { once: true, margin: "-10%" },
};

const SIGNAL_CARDS = [
  { label: "Venue live", headline: "124 inside | live now", description: "See real headcount before you head out.", accent: "#76e4f7" },
  { label: "Nearby", headline: "8 venues within 1 km", description: "See heat by distance and filter by vibe.", accent: "#d4ff00" },
  { label: "Chats inside", headline: "32 chats unlocked", description: "Message people already checked in after you verify.", accent: "#ff6b99" },
];

const FEATURE_CARDS = [
  { tag: "Live radar", title: "Heat + headcount, live", description: "Every venue, refreshed on the minute. See active counts on the map and who is heating up.", accent: "#76e4f7", meta: "Updated 2m ago" },
  { tag: "Check-in unlocks", title: "QR verified", description: "QR + device signals verify real people in real rooms. Message people inside only after you check in.", accent: "#d4ff00", meta: "Spoof-proofed" },
  { tag: "Blur control", title: "Privacy first", description: "Blur stays on until you connect. You decide who sees you once you are verified at the venue.", accent: "#b58bff", meta: "Safe by default" },
  { tag: "100s chats", title: "High intent only", description: "One credit, 100 seconds to make a move. No endless swiping or ghost feeds.", accent: "#ff6b99", meta: "Timer on" },
  { tag: "Host console", title: "Real-time controls", description: "Spotlight sets, tune cover, and see verified audience signals inside.", accent: "#8bffcc", meta: "Live controls" },
  { tag: "Geo check-ins", title: "Map + presence", description: "Geolocation-backed check-ins tie you to the venue. Map shows real counts before you move.", accent: "#ffc266", meta: "Precision locks" },
];

const UPCOMING_EVENTS = [
  { title: "Friday Night", date: "06 DEC", image: "https://images.unsplash.com/photo-1574391884720-bbc3740c59d1?w=800&h=1000&fit=crop", venue: "Main Hall", headcount: "124 inside" },
  { title: "Psycho Night", date: "13 DEC", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&h=1000&fit=crop", venue: "Underground", headcount: "89 inside" },
  { title: "Neon Dreams", date: "20 DEC", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=1000&fit=crop", venue: "Main Hall", headcount: "156 inside" },
];

const APP_SCREENS = [
  { id: "home", title: "Home", subtitle: "Live radar + heatmap", image: "/images/screenshot-20251206-234017-nataa.jpg", detail: "Live headcounts, vibe signals, and heat in one glance.", callouts: ["124 inside", "Vibe: High"] },
  { id: "discover", title: "Discover", subtitle: "Pick your move", image: "/images/screenshot-20251206-234030-nataa.jpg", detail: "Browse venues with verified counts, not flyers.", callouts: ["8 venues nearby", "Filter by vibe"] },
  { id: "map", title: "Live Map", subtitle: "Pins with proof", image: "/images/screenshot-20251206-233804-nataa.jpg", detail: "Real-time pins before you leave the house.", callouts: ["Pins with proof", "See heat before you go"] },
  { id: "scan", title: "Check-in", subtitle: "QR verification", image: "/images/screenshot-20251206-233814-nataa.jpg", detail: "Scan in-venue to unlock blur-off and messaging.", callouts: ["QR verified", "Blur off after check-in"] },
  { id: "messages", title: "Messages", subtitle: "100s chats", image: "/images/screenshot-20251206-233821-nataa.jpg", detail: "100-second chats keep intent high and ghosts out.", callouts: ["100-second timer", "Credits control access"] },
  { id: "venues", title: "Venues", subtitle: "Tonight's picks", image: "/images/screenshot-20251206-234022-nataa.jpg", detail: "Hosts spotlight sets and cover changes live.", callouts: ["See all tonight", "Host spotlight"] },
];

const nextWaveTarget = () => {
  const now = new Date();
  const year = now.getMonth() > 1 || (now.getMonth() === 1 && now.getDate() > 19) ? now.getFullYear() + 1 : now.getFullYear();
  return Date.UTC(year, 1, 19, 23, 59, 59);
};

function StatusChip({ label, color = "#a855f7" }: { label: string; color?: string }) {
  return (
    <motion.span
      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-white/80"
      style={{ color }}
      animate={{ boxShadow: ["0 0 0 0 rgba(255,255,255,0.18)", "0 0 0 8px rgba(255,255,255,0)"] }}
      transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, repeatType: "loop" }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </motion.span>
  );
}

type SparkButtonProps = Omit<React.ComponentProps<typeof motion.button>, 'onClick' | 'ref'> & {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  reduceMotion: boolean;
};

function SparkButton({
  children,
  onClick,
  className,
  disabled,
  reduceMotion,
  ...rest
}: SparkButtonProps) {
  const [sparks, setSparks] = useState<number[]>([]);
  const trigger = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!reduceMotion) {
      setSparks((prev) => [...prev, Date.now()].slice(-12));
      setTimeout(() => setSparks((prev) => prev.slice(1)), 500);
    }
    onClick?.(e);
  };
  return (
    <motion.button
      onClick={trigger}
      disabled={disabled}
      className={className}
      whileHover={reduceMotion ? undefined : { translateY: -2 }}
      whileTap={reduceMotion ? undefined : { translateY: 0 }}
      {...rest}
    >
      <span className="relative inline-flex items-center justify-center">
        {children as React.ReactNode}
        {!reduceMotion && sparks.map((spark) => (
          <motion.span
            key={spark}
            initial={{ opacity: 1, transform: 'scale(0)' }}
            animate={{ opacity: 0, transform: 'scale(1.5)' }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-white/20"
          >
            âœ¨
          </motion.span>
        ))}
      </span>
    </motion.button>
  );
}
function AppScreensSlider({ reduceMotion }: { reduceMotion: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<NodeJS.Timeout | null>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const goTo = useCallback((index: number) => { setDirection(index > activeIndex ? 1 : -1); setActiveIndex(index); }, [activeIndex]);
  const prev = useCallback(() => { setDirection(-1); setActiveIndex((p) => (p - 1 + APP_SCREENS.length) % APP_SCREENS.length); }, []);
  const next = useCallback(() => { setDirection(1); setActiveIndex((p) => (p + 1) % APP_SCREENS.length); }, []);
  const stopAutoplay = useCallback(() => {
    if (autoplayRef.current) {
      clearInterval(autoplayRef.current);
      autoplayRef.current = null;
    }
  }, []);
  const startAutoplay = useCallback(() => {
    if (reduceMotion) return;
    stopAutoplay();
    autoplayRef.current = setInterval(() => {
      setDirection(1);
      setActiveIndex((p) => (p + 1) % APP_SCREENS.length);
    }, 4200);
  }, [reduceMotion, stopAutoplay]);
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const inView = entries.some((e) => e.isIntersecting);
      if (inView) startAutoplay();
      else stopAutoplay();
    }, { threshold: 0.35 });
    if (sliderRef.current) observer.observe(sliderRef.current);
    return () => { observer.disconnect(); stopAutoplay(); };
  }, [startAutoplay, stopAutoplay]);
  const slideVariants = {
    enter: () => ({ opacity: 0, scale: 0.985 }),
    center: { opacity: 1, scale: 1 },
    exit: () => ({ opacity: 0, scale: 0.985 }),
  };
  const slideTransition = { duration: 0.3, ease: [0.4, 0.1, 0.2, 1] };
  const handleTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      delta < 0 ? next() : prev();
    }
    touchStartX.current = null;
  };
  const activeScreen = APP_SCREENS[activeIndex];

  return (
    <div
      className="relative w-full max-w-md will-change-transform"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseMove={(e) => {
        if (reduceMotion || typeof window === "undefined" || window.innerWidth < 900) return;
        const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * -8;
        setTilt({ x, y });
      }}
      onMouseLeave={() => {
        setTilt({ x: 0, y: 0 });
      }}
      style={{ transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)` }}
      ref={sliderRef}
    >
      <motion.div className="absolute -inset-10 rounded-full blur-3xl" style={{ background: "radial-gradient(circle, rgba(147,91,255,0.18) 0%, transparent 70%)" }} animate={{ opacity: [0.6, 0.9, 0.6] }} transition={{ duration: 6, repeat: Number.POSITIVE_INFINITY }} />
      <div className="relative mx-auto w-[260px] md:w-[300px]">
        <div className="relative rounded-[3rem] bg-gradient-to-b from-[#5b1bd6]/60 via-[#0c071a] to-[#0c071a] p-[3px] shadow-[0_30px_70px_rgba(54,16,114,0.45)]">
          <div className="relative overflow-hidden rounded-[2.8rem] bg-[#0a0a0f] p-2">
            <div className="absolute left-1/2 top-4 z-20 h-5 w-20 -translate-x-1/2 rounded-full bg-black" />
            <div className="relative aspect-[9/19.5] overflow-hidden rounded-[2.4rem] bg-[#0a0a0f]">
              <AnimatePresence initial={false} custom={direction} mode="wait">
                <motion.div key={activeIndex} custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={slideTransition} className="absolute inset-0">
                  <Image src={activeScreen.image} alt={activeScreen.title} fill sizes="(max-width: 768px) 260px, 300px" className="object-cover object-top" priority={activeIndex === 0} />
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-center gap-4">
          <motion.button onClick={prev} className="hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#231133] via-[#130b1f] to-[#241144] text-white shadow-[0_0_18px_rgba(147,91,255,0.45)] transition-transform" whileHover={reduceMotion ? undefined : { scale: 1.05 }} whileTap={reduceMotion ? undefined : { scale: 0.95 }}><ChevronLeft className="h-5 w-5" /></motion.button>
          <div className="flex gap-1.5">{APP_SCREENS.map((_, i) => <button key={i} onClick={() => goTo(i)} className={`h-1.5 rounded-full transition-all ${i === activeIndex ? "w-6 bg-[#a855f7]" : "w-2 bg-white/30"}`} />)}</div>
          <motion.button onClick={next} className="hidden md:flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-gradient-to-br from-[#231133] via-[#130b1f] to-[#241144] text-white shadow-[0_0_18px_rgba(147,91,255,0.45)] transition-transform" whileHover={reduceMotion ? undefined : { scale: 1.05 }} whileTap={reduceMotion ? undefined : { scale: 0.95 }}><ChevronRight className="h-5 w-5" /></motion.button>
        </div>
      </div>
      <motion.div key={APP_SCREENS[activeIndex].id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }} className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-br from-[#1a0f2b]/80 via-[#0c071a]/80 to-[#1a0f2b]/70 p-4 shadow-[0_18px_36px_rgba(53,16,109,0.35)]">
        <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-[#c084fc]">
          <span>{APP_SCREENS[activeIndex].subtitle}</span>
          <span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/70">Live</span>
        </div>
        <div className="mt-1 heading-font text-xl text-white">{APP_SCREENS[activeIndex].title}</div>
        <p className="text-sm text-white/70">{APP_SCREENS[activeIndex].detail}</p>
        {activeScreen.callouts?.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {activeScreen.callouts.map((pill) => (
              <span key={pill} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-white/80">{pill}</span>
            ))}
          </div>
        ) : null}
      </motion.div>
    </div>
  );
}
export default function Home() {
  const supabase = getSupabaseClient();
  const [waitlistForm, setWaitlistForm] = useState({ name: "", email: "" });
  const [waitlistState, setWaitlistState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [partnerForm, setPartnerForm] = useState({ venueName: "", contactName: "", email: "", city: "", role: "Owner" });
  const [partnerState, setPartnerState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [partnerError, setPartnerError] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" });
  const [contactState, setContactState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [contactError, setContactError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ days: "00", hours: "00", minutes: "00", seconds: "00" });
  const [navHidden, setNavHidden] = useState(false);
  const navHiddenRef = useRef(false);
  const lastScrollY = useRef(0);
  const targetTime = useMemo(() => nextWaveTarget(), []);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [emojiRunners, setEmojiRunners] = useState<Array<{ glyph: string; top: string; delay: number; duration: number; repeatDelay: number; direction: "ltr" | "rtl" }>>([]);
  const [allowRunners, setAllowRunners] = useState(true);
  const heroGlowPoints = useMemo(
    () =>
      Array.from({ length: 24 }, (_, i) => ({
        x: (i * 137) % 1200,
        y: (i * 211) % 700,
        duration: 11 + (i % 8),
        delay: (i % 6) * 0.7,
      })),
    []
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

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handlePrefers = () => setReduceMotion(mq.matches);
    handlePrefers();
    mq.addEventListener("change", handlePrefers);
    return () => mq.removeEventListener("change", handlePrefers);
  }, []);

  useEffect(() => {
    const checkWidth = () => setAllowRunners(true);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

      useEffect(() => {
    if (reduceMotion || !allowRunners) {
      setEmojiRunners([]);
      return;
    }
    const glyphs = ["✨", "🌙", "🌌", "⭐", "🌠", "🪐", "🌃"];
    const runners = Array.from({ length: 4 }, () => {
      const direction: "ltr" | "rtl" = Math.random() > 0.5 ? "ltr" : "rtl";
      return {
        glyph: glyphs[Math.floor(Math.random() * glyphs.length)],
        top: `${8 + Math.random() * 76}%`,
        delay: Math.random() * 2,
        duration: 3.5 + Math.random() * 2,
        repeatDelay: 1 + Math.random() * 2.5,
        direction,
      };
    });
    setEmojiRunners(runners);
  }, [reduceMotion, allowRunners]);

  useEffect(() => {
    lastScrollY.current = window.scrollY;
    const handleScroll = () => {
      const current = window.scrollY;
      const delta = current - lastScrollY.current;
      const scrollingDown = delta > 0;
      const scrollingUp = delta < 0;
      setShowBackToTop(current > 640);
      const doc = document.documentElement;
      const maxScroll = doc.scrollHeight - doc.clientHeight || 1;
      setScrollProgress(Math.min(1, Math.max(0, current / maxScroll)));
      let nextHidden = navHiddenRef.current;
      if (current <= 6 || scrollingUp) {
        nextHidden = false;
      } else if (scrollingDown) {
        nextHidden = true;
      }
      if (nextHidden !== navHiddenRef.current) {
        navHiddenRef.current = nextHidden;
        setNavHidden(nextHidden);
      }
      lastScrollY.current = current;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleWaitlistSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setWaitlistError(null);
    if (!EMAIL_REGEX.test(waitlistForm.email)) { setWaitlistError("Drop a valid email so we can ping you."); return; }
    setWaitlistState("loading");
    try {
      if (supabase) {
        const { error } = await supabase.from("waitlist").insert({ email: waitlistForm.email.toLowerCase(), name: waitlistForm.name || null, referral_count: 0 });
        if (error) throw error;
        fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: waitlistForm.name || "Waitlist", email: waitlistForm.email, message: `Waitlist signup from landing: ${waitlistForm.email}` }) }).catch(() => {});
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
    if (!EMAIL_REGEX.test(partnerForm.email)) { setPartnerError("Enter a valid contact email."); return; }
    setPartnerState("loading");
    try {
      if (supabase) {
        const { error } = await supabase.from("partners").insert({ venue_name: partnerForm.venueName, contact_name: partnerForm.contactName, email: partnerForm.email.toLowerCase(), city: partnerForm.city, role: partnerForm.role });
        if (error) throw error;
        fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: partnerForm.contactName || partnerForm.venueName, email: partnerForm.email, message: `Venue partner signup: ${partnerForm.venueName}, city: ${partnerForm.city}, role: ${partnerForm.role}, contact: ${partnerForm.contactName} <${partnerForm.email}>` }) }).catch(() => {});
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
    if (!EMAIL_REGEX.test(contactForm.email) || !contactForm.message.trim()) { setContactError("Add a valid email and a message."); return; }
    setContactState("loading");
    try {
      await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: contactForm.name || "Contact", email: contactForm.email, message: contactForm.message }) });
      setContactState("success");
      setContactForm({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      setContactError("Failed to send. Try again.");
      setContactState("error");
    }
  };

  const heroGradient: CSSProperties = useMemo(() => ({
    background: "radial-gradient(circle at 20% 24%, rgba(131,76,255,0.3), transparent 42%), radial-gradient(circle at 82% 20%, rgba(236,72,153,0.2), transparent 40%), radial-gradient(circle at 60% 72%, rgba(88,28,135,0.22), transparent 50%), linear-gradient(140deg, #04020a, #0a0416 55%, #05020f)",
  }), []);
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05060c] text-white scroll-smooth">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-24 -top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle,rgba(147,91,255,0.24),transparent_60%)] blur-3xl" />
        <div className="absolute right-0 top-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(236,72,153,0.18),transparent_55%)] blur-3xl" />
        <div className="absolute -bottom-24 left-10 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(111,66,193,0.18),transparent_55%)] blur-3xl" />
      </div>

      <header className={`fixed top-0 left-0 right-0 z-30 bg-gradient-to-b from-black/75 via-black/35 to-transparent backdrop-blur-lg shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out will-change-transform ${navHidden ? "-translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-b from-transparent via-black/25 to-black/60" />
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6 relative">
          <div className="heading-font text-lg bg-gradient-to-r from-purple-400 via-fuchsia-400 to-cyan-300 bg-clip-text text-transparent drop-shadow-[0_0_14px_rgba(168,85,247,0.45)]">NATAA</div>
          <div className="flex flex-1 justify-end">
            <nav className="flex w-full max-w-xl items-center gap-2 overflow-x-auto rounded-full border border-white/12 bg-black/30 backdrop-blur-lg px-2.5 py-2.5 text-[11px] uppercase tracking-[0.18em] text-white/90 shadow-[0_18px_40px_rgba(0,0,0,0.35)] shadow-inner no-scrollbar">
              <a className="hidden rounded-full border border-white/10 px-3.5 py-2.5 min-h-[44px] hover:border-[#d4ff00]/50 hover:text-[#d4ff00] md:inline" href="https://instagram.com/Nataa.app" target="_blank" rel="noreferrer">IG</a>
              <a className="rounded-full border border-white/10 px-3.5 py-2.5 min-h-[44px] hover:border-[#a855f7]/50 hover:text-[#d4ff00]" href="#events">Events</a>
              <a className="rounded-full border border-white/10 px-3.5 py-2.5 min-h-[44px] hover:border-[#a855f7]/50 hover:text-[#d4ff00]" href="#features">Features</a>
              <a className="rounded-full border border-white/10 px-3.5 py-2.5 min-h-[44px] hover:border-[#a855f7]/50 hover:text-[#d4ff00]" href="#download-apk">Download</a>
              <a className="rounded-full border border-white/10 px-3.5 py-2.5 min-h-[44px] hover:border-[#a855f7]/50 hover:text-[#d4ff00]" href="#venues">Venues</a>
              <a className="rounded-full border border-purple-400/60 bg-gradient-to-r from-purple-600 to-fuchsia-500 px-3.5 py-2.5 min-h-[44px] text-white shadow-[0_0_16px_rgba(147,91,255,0.4)]" href="#waitlist">Waitlist</a>
            </nav>
          </div>
        </div>
      </header>
      <main className="relative z-10 pt-20 md:pt-24">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-90" style={heroGradient} />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.06),transparent_45%)]" />
          {!reduceMotion ? (
            <div className="absolute inset-0">
              {heroGlowPoints.map((dot, i) => (
                <motion.div key={i} className="absolute h-1 w-1 rounded-full bg-cyan-300/30 will-change-transform" initial={{ x: dot.x, y: dot.y, opacity: 0 }} animate={{ y: -80, opacity: [0, 1, 0] }} transition={{ duration: dot.duration, repeat: Number.POSITIVE_INFINITY, delay: dot.delay, ease: "linear" }} />
              ))}
            </div>
          ) : null}

          <div className="relative mx-auto flex min-h-[80vh] max-w-6xl flex-col gap-12 px-4 py-14 md:flex-row md:items-start md:justify-between md:px-6 md:py-20">
            <div className="flex-1 space-y-6">
              <motion.div {...blurReveal} transition={{ duration: 0.7 }}>
                <h1 className="heading-font text-4xl leading-tight text-white md:text-6xl">Your nightlife wingman.</h1>
                <p className="max-w-2xl text-lg text-white/80">
                  <span className="heading-font text-xl text-white md:text-2xl">Check in, see who is around, connect.</span>
                  <br />
                  <span className="text-white/75 font-normal">Live radar, real headcounts, QR check-ins, blur until you choose, 100-second chats.</span>
                </p>
              </motion.div>

              <motion.div {...blurReveal} transition={{ duration: 0.7, delay: 0.05 }} className="flex flex-wrap gap-3 text-sm text-white/85">
                {["Live heatmap", "Verified check-ins", "100-second chats", "Host console"].map((pill) => (
                  <span key={pill} className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5">{pill}</span>
                ))}
              </motion.div>

              <motion.div {...blurReveal} transition={{ duration: 0.7, delay: 0.1 }} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/5 via-black/70 to-black/80 p-5 shadow-[0_30px_70px_rgba(0,0,0,0.4)] scroll-mt-24" id="waitlist">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="mono-font text-[12px] uppercase tracking-[0.18em] text-white/70">Beta Wave 01</div>
                  <div className="flex w-full flex-wrap justify-between gap-2 text-center text-white/80 sm:w-auto sm:justify-end">
                    {["days", "hours", "minutes", "seconds"].map((unit) => (
                      <div key={unit} className="min-w-[72px] flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-3 sm:min-w-[92px]">
                        <div className="heading-font text-lg text-white sm:text-xl">{(countdown as Record<string, string>)[unit]}</div>
                        <div className="mono-font text-[10px] uppercase tracking-[0.2em] text-white/50 sm:text-[11px]">{unit}</div>
                      </div>
                    ))}
                  </div>
                </div>
                <form onSubmit={handleWaitlistSubmit} className="mt-4 flex flex-col gap-3">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0" placeholder="Name (optional)" value={waitlistForm.name} onChange={(e) => setWaitlistForm((prev) => ({ ...prev, name: e.target.value }))} />
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0" placeholder="Email for the beta" value={waitlistForm.email} onChange={(e) => setWaitlistForm((prev) => ({ ...prev, email: e.target.value }))} required />
                  </div>
                  {waitlistError ? <p className="text-sm text-[#ff98a4]">{waitlistError}</p> : null}
                  {waitlistState === "success" ? <p className="text-sm text-[#d4ff00]">You are in. We will email your invite.</p> : (
                    <div className="flex flex-wrap items-center gap-3">
                    <SparkButton reduceMotion={reduceMotion} type="submit" disabled={waitlistState === "loading"} className="rounded-xl border border-purple-400/60 bg-gradient-to-r from-purple-600 to-fuchsia-500 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_18px_rgba(147,91,255,0.45)] disabled:opacity-60">{waitlistState === "loading" ? "Joining..." : "Join the waitlist"}</SparkButton>
                      <span className="mono-font text-xs uppercase tracking-[0.2em] text-white/60">No spam. Invite only.</span>
                    </div>
                )}
              </form>
            </motion.div>
            </div>

            <motion.div {...blurReveal} transition={{ duration: 0.8, delay: 0.1 }} className="flex flex-1 items-start justify-center md:justify-start md:pl-4">
              <AppScreensSlider reduceMotion={reduceMotion} />
            </motion.div>
          </div>
        </section>
        <section className="mx-auto max-w-6xl px-4 py-12 md:px-6 scroll-mt-24">
          <motion.h2 {...blurReveal} transition={{ duration: 0.7 }} className="heading-font mb-3 text-[32px] text-white md:text-[44px]">Signals at a glance.</motion.h2>
          <p className="mb-6 max-w-[70ch] text-white/75">Real headcount, who is close, and chats you unlock after you check in.</p>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 md:grid md:auto-rows-fr md:grid-cols-3 md:gap-6">
            {SIGNAL_CARDS.map((card, idx) => (
              <motion.div key={card.label} {...cardReveal} transition={{ duration: 0.6, delay: 0.04 * idx }} className="snap-center rounded-2xl border border-[#6b21a8]/40 bg-gradient-to-br from-[#1a0f2b]/80 via-[#0c071a]/90 to-[#1a0f2b]/80 p-4 shadow-[0_18px_40px_rgba(53,16,109,0.35)] min-h-[180px] flex h-full flex-col gap-2 flex-none w-[85%] md:w-auto">
                <div className="mono-font text-[11px] uppercase tracking-[0.18em]" style={{ color: card.accent }}>{card.label}</div>
                <h3 className="heading-font text-xl text-white">{card.headline}</h3>
                <p className="mt-2 text-sm text-white/65">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-4 py-14 md:px-6 scroll-mt-24">
          <motion.h2 {...blurReveal} transition={{ duration: 0.7 }} className="heading-font mb-3 text-[32px] text-white md:text-[44px]">Core features that are shipping.</motion.h2>
          <p className="mb-8 max-w-[70ch] text-white/75">Wave 01: live radar, verified check-ins, host controls. Ready now.</p>
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 md:grid md:auto-rows-fr md:grid-cols-3 md:gap-6">
            {FEATURE_CARDS.map((card, idx) => (
              <motion.div key={card.title} {...cardReveal} transition={{ duration: 0.6, delay: 0.04 * idx }} whileHover={reduceMotion ? undefined : { translateY: -6, borderColor: "rgba(212,255,0,0.35)" }} className="card-float snap-center rounded-2xl border border-white/10 bg-white/5 p-5 shadow-[0_18px_40px_rgba(0,0,0,0.35)] min-h-[240px] flex h-full flex-col justify-between flex-none w-[80%] md:w-auto">
                <div className="flex items-center justify-between">
                  <div className="mono-font text-[11px] uppercase tracking-[0.18em]" style={{ color: card.accent }}>{card.tag}</div>
                  <StatusChip label="Live" color={card.accent} />
                </div>
                <h3 className="heading-font text-xl text-white mt-2">{card.title}</h3>
                <p className="mt-2 text-sm text-white/70">{card.description}</p>
                <div className="mt-3 text-xs text-white/65">{card.meta}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="events" className="bg-[#060812] px-4 py-16 md:px-6 scroll-mt-24">
          <div className="mx-auto max-w-6xl">
            <motion.div {...blurReveal} transition={{ duration: 0.7 }} className="mb-8 flex flex-col gap-3">
              <p className="mono-font text-[11px] uppercase tracking-[0.2em] text-white/60">Events</p>
              <h2 className="heading-font text-[32px] text-white md:text-[44px]">Upcoming nights.</h2>
              <p className="max-w-[70ch] text-white/75">Real headcount and vibe per venue before you leave the house.</p>
            </motion.div>

            <div className="flex gap-5 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 md:grid md:auto-rows-fr md:grid-cols-3 md:gap-6">
              {UPCOMING_EVENTS.map((event, idx) => (
                <motion.div key={event.title} {...cardReveal} transition={{ duration: 0.6, delay: 0.05 * idx }} whileHover={reduceMotion ? undefined : { translateY: -8, borderColor: "rgba(212,255,0,0.35)" }} className="group relative flex h-full min-h-[320px] flex-col overflow-hidden snap-center rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-black/60 to-black/90 shadow-[0_25px_60px_rgba(0,0,0,0.45)] flex-none w-[82%] md:w-auto">
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <Image src={event.image} alt={event.title} fill sizes="(max-width: 768px) 82vw, 360px" className="object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
                    <div className="absolute right-4 top-4 flex flex-col gap-2">
                      <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs text-white/80 backdrop-blur-sm">{event.headcount}</div>
                      <StatusChip label="Now playing" color="#d4ff00" />
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col justify-between p-5">
                    <div>
                      <div className="text-sm text-white/70">{event.date}</div>
                      <h3 className="heading-font text-2xl text-white">{event.title}</h3>
                        <p className="text-white/60">{event.venue}</p>
                      </div>
                      <div className="mt-2 text-xs text-white/70">Live radar | Verified crowd</div>
                    </div>
                  </motion.div>
                ))}
              </div>
          </div>
        </section>
        <section id="download-apk" className="mx-auto max-w-6xl px-4 py-16 md:px-6 scroll-mt-24">
          <div className="rounded-3xl border border-white/10 bg-gradient-to-r from-white/5 via-black/60 to-white/5 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="heading-font text-3xl text-white">Download the Android beta.</h3>
                <p className="text-white/75">Direct APK download for Android. This is a non-production build and may have bugs; fixes are underway.</p>
                <p className="mt-2 text-sm text-white/60">Need help? contact@nataa.app</p>
              </div>
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/40 p-3">
                  <Image src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&color=ffffff&bgcolor=0b0d14&data=https%3A%2F%2Flimewire.com%2Fd%2F8RfgY%23fEFu7VVIlC" alt="APK QR" width={80} height={80} className="h-20 w-20 rounded-md border border-white/10 shadow-[0_12px_28px_rgba(0,0,0,0.35)]" />
                  <div className="text-xs text-white/70">Scan to download the APK directly to your Android device.</div>
                </div>
                <a href="https://limewire.com/d/8RfgY#fEFu7VVIlC" className="rounded-xl border border-[#d4ff00]/70 bg-[#d4ff00] px-4 py-3 text-xs font-semibold text-black shadow-[0_0_16px_rgba(212,255,0,0.45)]" download target="_blank" rel="noreferrer">Download Android APK</a>
              </div>
            </div>
          </div>
        </section>

        <section id="venues" className="bg-[#060812] px-4 py-16 md:px-6 scroll-mt-24">
          <div className="mx-auto max-w-6xl">
            <motion.div {...blurReveal} transition={{ duration: 0.7 }} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="mono-font text-[11px] uppercase tracking-[0.2em] text-white/60">Venues</p>
                <h2 className="heading-font text-[32px] text-white md:text-[44px]">Collaborate with us.</h2>
                <p className="max-w-[70ch] text-white/75">Wave 01 is open to a few venues. Push live cover, verify guests, and reach nearby people who are ready to move.</p>
              </div>
            </motion.div>

            <div className="mt-8 grid gap-6 md:grid-cols-[1.1fr_0.9fr]">
              <motion.div {...blurReveal} transition={{ duration: 0.7, delay: 0.05 }} className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
                <form className="space-y-3" onSubmit={handlePartnerSubmit}>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0" placeholder="Venue name" value={partnerForm.venueName} onChange={(e) => setPartnerForm((p) => ({ ...p, venueName: e.target.value }))} required />
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0" placeholder="Contact name" value={partnerForm.contactName} onChange={(e) => setPartnerForm((p) => ({ ...p, contactName: e.target.value }))} required />
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0" placeholder="Contact email" value={partnerForm.email} onChange={(e) => setPartnerForm((p) => ({ ...p, email: e.target.value }))} required />
                    <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0" placeholder="City" value={partnerForm.city} onChange={(e) => setPartnerForm((p) => ({ ...p, city: e.target.value }))} />
                  </div>
                  <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0" placeholder="Role (Owner, Manager, Promoter)" value={partnerForm.role} onChange={(e) => setPartnerForm((p) => ({ ...p, role: e.target.value }))} />
                  {partnerError ? <p className="text-sm text-[#ff98a4]">{partnerError}</p> : null}
                  {partnerState === "success" ? <p className="text-sm text-[#d4ff00]">Thanks. We will reach out within 24h.</p> : (
                    <div className="flex flex-wrap items-center gap-3">
                      <SparkButton type="submit" disabled={partnerState === "loading"} reduceMotion={reduceMotion} className="rounded-xl border border-[#76e4f7]/70 bg-[#76e4f7] px-5 py-3 text-sm font-semibold text-black shadow-[0_0_16px_rgba(118,228,247,0.4)] disabled:opacity-60">{partnerState === "loading" ? "Sending..." : "Partner with us"}</SparkButton>
                      <span className="mono-font text-xs uppercase tracking-[0.2em] text-white/60">We reply fast.</span>
                    </div>
                  )}
                </form>
              </motion.div>

              <motion.div {...blurReveal} transition={{ duration: 0.7, delay: 0.1 }} className="rounded-3xl border border-white/10 bg-black/60 p-5 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
                <div className="mono-font text-[11px] uppercase tracking-[0.2em] text-white/60">What venues get</div>
                <div className="mt-4 space-y-3">
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#1b0f2e]/80 via-[#0c071a]/80 to-[#1b0f2e]/80 p-4">
                    <div className="flex items-center justify-between text-sm text-white/70"><span>Live controls</span><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-[#76e4f7]">Dashboard</span></div>
                    <p className="mt-2 text-sm text-white/65">Update cover, wait, and spotlight sets instantly.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#241443]/80 via-[#0c071a]/80 to-[#241443]/80 p-4">
                    <div className="flex items-center justify-between text-sm text-white/70"><span>Verified audience</span><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-[#ff6b99]">Signal</span></div>
                    <p className="mt-2 text-sm text-white/65">QR + device verification keeps the headcount real.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-[#31185f]/80 via-[#0c071a]/80 to-[#31185f]/80 p-4">
                    <div className="flex items-center justify-between text-sm text-white/70"><span>Targeted boosts</span><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-[#d4ff00]">Reach</span></div>
                    <p className="mt-2 text-sm text-white/65">Push promos to people near your venue who already verified.</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-20 md:px-6 scroll-mt-24" id="contact">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-xl">
                <p className="mono-font text-[11px] uppercase tracking-[0.2em] text-white/60">Contact</p>
                <h3 className="heading-font text-[28px] text-white md:text-[34px]">Talk to the team.</h3>
                <p className="text-white/75 max-w-[70ch]">Questions, press, or partnerships? DM us on IG <a className="text-[#d4ff00]" href="https://instagram.com/Nataa.app" target="_blank" rel="noreferrer">@Nataa.app</a> or drop a note here.</p>
              </div>
              <form className="mt-4 w-full max-w-lg space-y-3" onSubmit={handleContactSubmit}>
                <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0" placeholder="Name" value={contactForm.name} onChange={(e) => setContactForm((p) => ({ ...p, name: e.target.value }))} />
                <input className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0" placeholder="Email" value={contactForm.email} onChange={(e) => setContactForm((p) => ({ ...p, email: e.target.value }))} required />
                <textarea className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none ring-0" placeholder="How can we help?" rows={4} value={contactForm.message} onChange={(e) => setContactForm((p) => ({ ...p, message: e.target.value }))} required />
                {contactError ? <p className="text-sm text-[#ff98a4]">{contactError}</p> : null}
                {contactState === "success" ? <p className="text-sm text-[#d4ff00]">Message sent. We will reply shortly.</p> : <SparkButton type="submit" disabled={contactState === "loading"} reduceMotion={reduceMotion} className="w-full rounded-xl border border-white/15 bg-white/10 px-5 py-3 text-sm font-semibold text-white shadow-[0_0_16px_rgba(255,255,255,0.15)] disabled:opacity-60">{contactState === "loading" ? "Sending..." : "Send message"}</SparkButton>}
              </form>
            </div>
          </div>
        </section>
      </main>

      {showBackToTop ? (
        <motion.button
          type="button"
          aria-label="Back to top"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full border border-white/15 bg-black/60 px-3.5 py-2 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.4)] backdrop-blur will-change-transform"
          whileHover={reduceMotion ? undefined : { scale: 1.05 }}
          whileTap={reduceMotion ? undefined : { scale: 0.97 }}
        >
          <span className="relative flex h-6 w-6 items-center justify-center">
            <svg viewBox="0 0 36 36" className="h-6 w-6">
              <circle cx="18" cy="18" r="16" stroke="rgba(255,255,255,0.15)" strokeWidth="2.5" fill="none" />
              <circle
                cx="18"
                cy="18"
                r="16"
                stroke="#d4ff00"
                strokeWidth="2.5"
                fill="none"
                strokeDasharray="100"
                strokeDashoffset={100 - scrollProgress * 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-xs">?</span>
          </span>
          Top
        </motion.button>
      ) : null}

      {!reduceMotion && allowRunners && emojiRunners.length ? (
        <div className="pointer-events-none fixed inset-0 z-10">
          {emojiRunners.map((runner, i) => {
            const startX = runner.direction === "ltr" ? "-15%" : "115%";
            const endX = runner.direction === "ltr" ? "115%" : "-15%";
            return (
              <motion.span
                key={runner.glyph + i}
                className="absolute text-lg"
                style={{ top: runner.top }}
                initial={{ x: startX, opacity: 0 }}
                animate={{ x: endX, opacity: [0, 1, 1, 0] }}
                transition={{ duration: runner.duration, delay: runner.delay, repeat: Number.POSITIVE_INFINITY, ease: [0.4, 0.1, 0.2, 1], repeatDelay: runner.repeatDelay }}
                aria-hidden
              >
                {runner.glyph}
              </motion.span>
            );
          })}
        </div>
      ) : null}

      <footer className="border-t border-white/10 bg-black/70 px-4 py-8 text-sm text-white/60 md:px-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="heading-font text-white">NATAA</div>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#events" className="hover:text-white">Events</a>
            <a href="#features" className="hover:text-white">Features</a>
            <a href="#download-apk" className="hover:text-white">Download</a>
            <a href="#venues" className="hover:text-white">Venues</a>
            <a href="#contact" className="hover:text-white">Contact</a>
          </div>
          <div className="text-xs text-white/50">(c) 2024 NATAA. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
}




















