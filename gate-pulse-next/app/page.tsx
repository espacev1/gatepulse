import { Navbar } from "@/components/ui/navbar";
import { HeroSection } from "@/components/sections/hero";
import { InnovationSection } from "@/components/sections/innovation";
import { EcosystemSection } from "@/components/sections/ecosystem";
import { JourneySection } from "@/components/sections/journey";
import { ImpactSection } from "@/components/sections/impact";
import { CTASection } from "@/components/sections/cta";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-white selection:bg-[#003B8E] selection:text-white">
      <Navbar />
      <HeroSection />
      <InnovationSection />
      <EcosystemSection />
      <JourneySection />
      <ImpactSection />
      <CTASection />

      {/* Footer */}
      <footer className="bg-[#060E24] border-t border-white/[0.06]">
        <div className="container mx-auto px-6 max-w-7xl py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            {/* Brand */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#003B8E] to-[#0057D8] flex items-center justify-center text-white font-bold text-sm">
                VP
              </div>
              <div>
                <div className="font-bold text-white text-sm">VIT Pulse</div>
                <div className="text-white/30 text-[11px]">Vishnu Institute of Technology</div>
              </div>
            </div>

            {/* Links */}
            <nav className="flex flex-wrap gap-6 text-[12px] text-white/40 font-medium">
              {["Events", "Innovation", "Journey", "Impact", "Privacy Policy", "Contact"].map((link) => (
                <Link
                  key={link}
                  href={`#${link.toLowerCase().replace(" ", "-")}`}
                  className="hover:text-white/70 transition-colors"
                >
                  {link}
                </Link>
              ))}
            </nav>

            {/* Copyright */}
            <p className="text-[11px] text-white/25 font-medium">
              &copy; {new Date().getFullYear()} VIT Pulse · All rights reserved
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
