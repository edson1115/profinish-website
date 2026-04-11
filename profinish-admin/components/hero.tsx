"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export function Hero() {
  return (
    <div className="relative w-full py-32 flex flex-col items-center justify-center overflow-hidden">
      {/* Fleet Background Image with Dark Fade */}
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1586864387465-b7787f7d1b37?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-luminosity" />
      <div className="absolute inset-0 bg-gradient-to-b from-black via-black/80 to-black" />

      {/* Background Ambient Glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 2, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6e45ff]/30 blur-[150px] rounded-full pointer-events-none"
      />

      <div className="relative z-10 text-center px-6 max-w-5xl mx-auto flex flex-col items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, type: "spring", stiffness: 100 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#6e45ff]/10 border border-[#6e45ff]/30 text-[#a990ff] text-sm font-bold tracking-wide mb-8 uppercase"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#a990ff] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#a990ff]"></span>
          </span>
          B2B Fleet Optimization
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4, type: "spring", stiffness: 100 }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60"
        >
          Premium Fleet <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6e45ff] to-[#a990ff]">
            Solutions
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6, type: "spring", stiffness: 100 }}
          className="text-xl md:text-2xl text-gray-400 max-w-3xl mb-12 leading-relaxed"
        >
          The trusted dispatch network for collision repair, high-tech vehicle integrations, and commercial fleet management.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.8, type: "spring", stiffness: 100 }}
          className="flex flex-col sm:flex-row gap-6 w-full justify-center"
        >
          <Link href="https://profinish-admin.vercel.app/auth/login">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full sm:w-auto px-10 py-4 bg-[#6e45ff] text-white rounded-2xl font-bold text-lg shadow-[0_0_40px_-10px_#6e45ff] transition-all"
            >
              Partner Login
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}