"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

export function InnovationSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  // Parallax for the images
  const y1 = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["10%", "-10%"]);

  return (
    <section 
      id="innovation"
      ref={containerRef}
      className="py-32 bg-white relative overflow-hidden"
    >
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Section Header */}
        <div className="mb-24 md:mb-32 max-w-3xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-4xl md:text-5xl lg:text-7xl font-bold tracking-tighter text-[var(--color-brand-text)]"
          >
            Pioneering the Next Generation of Campus Innovation.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-6 text-xl text-slate-500 max-w-2xl font-medium"
          >
            Experience a curated ecosystem of hackathons, expert-led workshops, and groundbreaking student research.
          </motion.p>
        </div>

        {/* Editorial Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 items-center">
          
          {/* Left Column (Image 1) */}
          <div className="md:col-span-7 relative h-[60vh] md:h-[80vh] w-full rounded-3xl overflow-hidden group">
            <motion.div 
              style={{ y: y1 }}
              className="absolute inset-[-10%] w-[120%] h-[120%] bg-slate-100"
            >
              {/* Premium Placeholder for Image */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-200 to-slate-100 flex items-center justify-center">
                <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-80 mix-blend-multiply grayscale-[20%]" />
              </div>
            </motion.div>
            
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            
            <div className="absolute bottom-8 left-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
              <h3 className="text-2xl font-bold">National Hackathons</h3>
              <p className="text-white/80">36-hour coding sprints</p>
            </div>
          </div>

          {/* Right Column */}
          <div className="md:col-span-5 flex flex-col gap-12 md:gap-24">
            
            {/* Text Block */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="text-2xl md:text-3xl font-bold text-[var(--color-brand-text)] tracking-tight mb-4">
                Where ideas transform into reality
              </h3>
              <p className="text-slate-500 text-lg leading-relaxed">
                Our innovation labs provide the infrastructure and mentorship required for students to push boundaries. From AI modeling to robotics, we foster an environment of relentless curiosity.
              </p>
            </motion.div>

            {/* Image 2 */}
            <div className="relative h-[40vh] md:h-[50vh] w-full rounded-3xl overflow-hidden group">
              <motion.div 
                style={{ y: y2 }}
                className="absolute inset-[-10%] w-[120%] h-[120%] bg-slate-100"
              >
                {/* Premium Placeholder for Image */}
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-brand-surface)] to-white flex items-center justify-center">
                  <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1515187029135-18ee286d815b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-90 mix-blend-multiply grayscale-[10%]" />
                </div>
              </motion.div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="absolute bottom-6 left-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 translate-y-4 group-hover:translate-y-0">
                <h3 className="text-xl font-bold">Expert Workshops</h3>
                <p className="text-white/80 text-sm">Industry-led sessions</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
