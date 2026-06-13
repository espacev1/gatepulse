import { Navbar } from "@/components/ui/navbar";
import { HeroSection } from "@/components/sections/hero";
import { InnovationSection } from "@/components/sections/innovation";
import { EcosystemSection } from "@/components/sections/ecosystem";
import { JourneySection } from "@/components/sections/journey";
import { ImpactSection } from "@/components/sections/impact";
import { CTASection } from "@/components/sections/cta";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[var(--color-brand-background)] selection:bg-[var(--color-brand-primary)] selection:text-white">
      <Navbar />
      <HeroSection />
      <InnovationSection />
      <EcosystemSection />
      <JourneySection />
      <ImpactSection />
      <CTASection />
      
      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-100 text-center">
        <p className="text-slate-500 text-sm">
          &copy; {new Date().getFullYear()} VIT-PULSE, Vishnu Institute of Technology. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
