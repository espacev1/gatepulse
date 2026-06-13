"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";

const features = [
  {
    label: "Research & Dev",
    title: "Where ideas become reality",
    body: "Our innovation labs provide the infrastructure and mentorship for students to push every boundary — from AI modeling and robotics to biotech and clean energy.",
  },
  {
    label: "Industry Bridge",
    title: "Real-world partnerships",
    body: "Expert-led masterclasses, industry mentors, and live project opportunities connect every student directly to the companies that will shape tomorrow.",
  },
];

function ParallaxImage({
  y,
  imageUrl,
  label,
  sublabel,
  className = "",
}: {
  y: ReturnType<typeof useTransform>;
  imageUrl: string;
  label: string;
  sublabel: string;
  className?: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-3xl group ${className}`}>
      {/* Image layer with parallax */}
      <motion.div
        style={{ y }}
        className="absolute inset-[-12%] w-[124%] h-[124%]"
      >
        <div
          className="w-full h-full bg-cover bg-center scale-105 group-hover:scale-110 transition-transform duration-700"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      </motion.div>

      {/* Gradient overlay — always visible */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/80 via-[#0F172A]/20 to-transparent" />

      {/* Noise texture */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMDAiIGhlaWdodD0iMzAwIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuNjUiIG51bU9jdGF2ZXM9IjMiIHN0aXRjaFRpbGVzPSJzdGl0Y2giLz48L2ZpbHRlcj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsdGVyPSJ1cmwoI25vaXNlKSIvPjwvc3ZnPg==')]" />

      {/* Label chip */}
      <div className="absolute top-5 left-5">
        <span className="glass px-3 py-1.5 rounded-full text-[11px] font-semibold text-white/90 tracking-wide uppercase">
          {sublabel}
        </span>
      </div>

      {/* Bottom content */}
      <div className="absolute bottom-6 left-6 right-6">
        <motion.h3
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-xl font-bold text-white mb-1 tracking-tight"
        >
          {label}
        </motion.h3>
      </div>
    </div>
  );
}

export function InnovationSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  const rawY1 = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const rawY2 = useTransform(scrollYProgress, [0, 1], ["8%", "-8%"]);
  const y1 = useSpring(rawY1, { stiffness: 60, damping: 20 });
  const y2 = useSpring(rawY2, { stiffness: 60, damping: 20 });

  const headingY = useTransform(scrollYProgress, [0, 0.5], ["20px", "0px"]);
  const headingOpacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <section
      id="innovation"
      ref={containerRef}
      className="py-32 md:py-48 bg-white relative overflow-hidden"
    >
      {/* Subtle background accent */}
      <div className="absolute top-0 right-0 w-[40%] h-[60%] bg-[radial-gradient(ellipse_at_top_right,rgba(0,87,216,0.04),transparent)] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[40%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.04),transparent)] pointer-events-none" />

      <div className="container mx-auto px-6 max-w-7xl">

        {/* Section header */}
        <motion.div
          style={{ y: headingY, opacity: headingOpacity }}
          className="mb-24 md:mb-32"
        >
          <motion.span
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] uppercase text-[#003B8E] mb-5"
          >
            <span className="w-6 h-px bg-[#003B8E]" />
            Campus Innovation
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="text-[clamp(2.2rem,5vw,5rem)] font-bold tracking-tighter text-[#0F172A] leading-[1.0] max-w-3xl"
          >
            Pioneering the next generation of campus{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#003B8E] to-[#0057D8]">
              innovation.
            </span>
          </motion.h2>
        </motion.div>

        {/* Main editorial layout — image-heavy, asymmetric */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start mb-24">

          {/* Large primary image */}
          <div className="md:col-span-7">
            <ParallaxImage
              y={y1}
              imageUrl="https://images.unsplash.com/photo-1531482615713-2afd69097998?q=80&w=2070&auto=format&fit=crop"
              label="National Hackathons"
              sublabel="36-hour sprints"
              className="h-[55vh] md:h-[70vh]"
            />
          </div>

          {/* Right column: text + small image */}
          <div className="md:col-span-5 flex flex-col gap-8 md:pt-16">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.7, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="group"
              >
                <span className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#0057D8] mb-2 block">
                  {f.label}
                </span>
                <h3 className="text-xl md:text-2xl font-bold text-[#0F172A] tracking-tight mb-3">
                  {f.title}
                </h3>
                <p className="text-slate-500 leading-relaxed text-[15px]">{f.body}</p>
                <div className="mt-4 h-px w-full bg-slate-100 group-hover:bg-[#003B8E]/20 transition-colors duration-300" />
              </motion.div>
            ))}

            <div className="mt-4">
              <ParallaxImage
                y={y2}
                imageUrl="https://images.unsplash.com/photo-1591453089816-0fbb971b454c?q=80&w=2070&auto=format&fit=crop"
                label="Expert Workshops"
                sublabel="Industry-led"
                className="h-[36vh] md:h-[40vh]"
              />
            </div>
          </div>
        </div>

        {/* Bottom scroll reveal — three column stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-slate-100 rounded-3xl overflow-hidden border border-slate-100">
          {[
            { value: "50+", label: "Workshops yearly", desc: "Expert-led industry sessions" },
            { value: "12+", label: "Innovation labs", desc: "State-of-the-art facilities" },
            { value: "200+", label: "Industry partners", desc: "Direct recruitment pipelines" },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white px-8 py-10 hover:bg-[#F5F8FC] transition-colors duration-200 group cursor-default"
            >
              <div className="text-4xl md:text-5xl font-bold text-[#003B8E] tracking-tighter mb-2">
                {stat.value}
              </div>
              <div className="text-sm font-bold text-[#0F172A] mb-1">{stat.label}</div>
              <div className="text-xs text-slate-500">{stat.desc}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
