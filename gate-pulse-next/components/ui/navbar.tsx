"use client";

import { motion, useScroll, useMotionValueEvent, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { name: "Events", href: "#events" },
  { name: "Innovation", href: "#innovation" },
  { name: "Journey", href: "#journey" },
  { name: "Impact", href: "#impact" },
];

// Magnetic button effect hook
function useMagneticEffect() {
  const ref = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onMouseMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) * 0.25;
      const dy = (e.clientY - cy) * 0.25;
      el.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    const onMouseLeave = () => {
      el.style.transform = "translate(0px, 0px)";
      el.style.transition = "transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)";
    };
    const onMouseEnter = () => {
      el.style.transition = "transform 0.1s linear";
    };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
    el.addEventListener("mouseenter", onMouseEnter);
    return () => {
      el.removeEventListener("mousemove", onMouseMove);
      el.removeEventListener("mouseleave", onMouseLeave);
      el.removeEventListener("mouseenter", onMouseEnter);
    };
  }, []);

  return ref;
}

export function Navbar() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeLink, setActiveLink] = useState<string | null>(null);
  const ctaRef = useMagneticEffect();

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    setIsScrolled(latest > 40);
    if (latest > 150 && latest > previous) {
      setHidden(true);
      setMobileMenuOpen(false);
    } else {
      setHidden(false);
    }
  });

  return (
    <>
      <motion.header
        variants={{ visible: { y: 0 }, hidden: { y: "-110%" } }}
        animate={hidden ? "hidden" : "visible"}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 inset-x-0 z-50 w-full"
      >
        {/* Pill nav container */}
        <div className={cn(
          "mx-auto transition-all duration-500 ease-out",
          isScrolled
            ? "max-w-5xl mt-3 px-4"
            : "max-w-7xl mt-0 px-6"
        )}>
          <div className={cn(
            "flex items-center justify-between transition-all duration-500",
            isScrolled
              ? "glass rounded-2xl px-5 py-3 shadow-[0_8px_32px_rgba(0,59,142,0.10)] border border-white/40"
              : "bg-transparent py-5"
          )}>
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 group z-50 relative">
              <div className="relative w-8 h-8 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#003B8E] via-[#0057D8] to-[#003B8E] transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm tracking-tight">
                  VP
                </div>
              </div>
              <span className="font-bold text-[15px] tracking-tight text-[#0F172A]">
                VIT <span className="text-[#003B8E]">Pulse</span>
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  onMouseEnter={() => setActiveLink(link.name)}
                  onMouseLeave={() => setActiveLink(null)}
                  className="relative px-4 py-2 text-[13px] font-medium text-slate-600 hover:text-[#003B8E] transition-colors duration-200 rounded-xl"
                >
                  {activeLink === link.name && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-slate-100 rounded-xl"
                      initial={false}
                      transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                    />
                  )}
                  <span className="relative z-10">{link.name}</span>
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/auth"
                className="text-[13px] font-medium text-slate-500 hover:text-[#003B8E] transition-colors px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                ref={ctaRef}
                href="/auth"
                className="group inline-flex items-center gap-1.5 px-5 py-2 bg-[#003B8E] text-white rounded-xl text-[13px] font-semibold transition-all duration-200 hover:bg-[#0057D8] hover:shadow-[0_4px_20px_rgba(0,87,216,0.4)] active:scale-95"
              >
                Get Started
                <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Mobile Toggle */}
            <button
              className="md:hidden p-2 -mr-1 rounded-xl hover:bg-slate-100 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <motion.div
                animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
                transition={{ duration: 0.2 }}
              >
                {mobileMenuOpen ? <X size={20} className="text-slate-800" /> : <Menu size={20} className="text-slate-800" />}
              </motion.div>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="fixed inset-x-4 top-20 z-40 glass rounded-2xl p-6 shadow-[0_16px_48px_rgba(0,0,0,0.12)] border border-white/50"
          >
            <nav className="flex flex-col gap-1 mb-6">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    className="flex items-center justify-between px-4 py-3 rounded-xl text-slate-700 font-medium hover:bg-slate-50 hover:text-[#003B8E] transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                    <ArrowRight size={14} className="text-slate-400" />
                  </Link>
                </motion.div>
              ))}
            </nav>
            <div className="flex flex-col gap-2">
              <Link
                href="/auth"
                className="text-center py-3 rounded-xl border border-slate-200 text-slate-700 font-medium text-sm hover:bg-slate-50 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
              <Link
                href="/auth"
                className="text-center py-3 rounded-xl bg-[#003B8E] text-white font-semibold text-sm hover:bg-[#0057D8] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
