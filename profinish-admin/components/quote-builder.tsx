"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const VEHICLES = [
  { id: "transit", title: "Light Duty Vans", desc: "2024 Transit, ProMaster", img: "https://images.unsplash.com/photo-1616432653765-1d48c081bd6b?q=80&w=600&auto=format&fit=crop" },
  { id: "f250", title: "Medium Duty Trucks", desc: "2023 F-250, 2024 Dodge 2500", img: "https://images.unsplash.com/photo-1555520935-71fc6a761e2e?q=80&w=600&auto=format&fit=crop" },
  { id: "freightliner", title: "Heavy Duty & Semis", desc: "2022 Freightliner, Peterbilt", img: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?q=80&w=600&auto=format&fit=crop" }
];

const SERVICES = [
  { id: "telematics", title: "Telematics & GPS" },
  { id: "dashcam", title: "Dashcams & Video" },
  { id: "battery", title: "Auxiliary Battery" },
  { id: "glass", title: "Glass & Windshield" },
  { id: "collision", title: "Collision Repair" },
  { id: "pdr", title: "Paintless Dent Repair" }
];

export function QuoteBuilder() {
  const [step, setStep] = useState(1);
  const [vehicle, setVehicle] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => setStep((s) => s + 1);
  const handleBack = () => setStep((s) => s - 1);

  const toggleService = (id: string) => {
    setServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulated submission for the frontend website
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(4);
    }, 1500);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-16 px-6">
      {/* Progress Bar (Hidden on Success Step) */}
      {step < 4 && (
        <div className="mb-12">
          <div className="flex justify-between mb-3 text-sm font-bold text-gray-500">
            <span className={step >= 1 ? "text-[#a990ff]" : ""}>1. Fleet Type</span>
            <span className={step >= 2 ? "text-[#a990ff]" : ""}>2. Upgrades</span>
            <span className={step >= 3 ? "text-[#a990ff]" : ""}>3. Estimate</span>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#6e45ff] to-[#3dfd98]"
              initial={{ width: "33%" }}
              animate={{ width: `${(step / 3) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>
      )}

      <div className="relative min-h-[350px]">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: VEHICLE TYPE */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-8 text-center">What type of vehicles are in your fleet?</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {VEHICLES.map((v) => (
                  <motion.button
                    key={v.id}
                    whileHover={{ scale: 1.02, y: -5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => { setVehicle(v.id); handleNext(); }}
                    className={`group relative overflow-hidden rounded-3xl border text-left transition-all duration-300 h-64 flex flex-col justify-end ${
                      vehicle === v.id
                        ? "border-[#6e45ff] shadow-[0_10px_30px_-10px_rgba(110,69,255,0.4)]"
                        : "bg-white/5 border-white/10 hover:border-[#6e45ff]/50"
                    }`}
                  >
                    {/* Background Image with Hover Zoom */}
                    <div 
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
                      style={{ backgroundImage: `url(${v.img})` }}
                    />
                    {/* Dark Gradient Overlay so text pops */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />
                    
                    <div className="relative z-10 p-6 w-full">
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-1">{v.title}</h3>
                      <p className="text-sm text-[#3dfd98] font-medium">{v.desc}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: SERVICES */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center"
            >
              <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-2 text-center">Select your required upgrades</h2>
              <p className="text-gray-400 mb-8 text-center">Choose all that apply for your estimate.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mb-10">
                {SERVICES.map((s) => {
                  const isSelected = services.includes(s.id);
                  return (
                    <motion.button
                      key={s.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleService(s.id)}
                      className={`p-6 rounded-2xl border text-center transition-all duration-300 ${
                        isSelected
                          ? "bg-[#6e45ff]/20 border-[#6e45ff] shadow-[0_0_20px_-5px_rgba(110,69,255,0.4)]"
                          : "bg-white/5 border-white/10 hover:border-[#6e45ff]/50"
                      }`}
                    >
                      <span className={`text-sm md:text-base font-bold ${isSelected ? "text-white" : "text-gray-400"}`}>
                        {s.title}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
              <div className="flex gap-4 w-full justify-center">
                <button onClick={handleBack} className="px-8 py-3 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Back</button>
                <button onClick={handleNext} disabled={services.length === 0} className="px-10 py-3 rounded-xl font-bold text-white bg-[#6e45ff] hover:bg-[#a990ff] transition-all disabled:opacity-50 shadow-[0_0_20px_-5px_#6e45ff]">
                  Continue to Estimate
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: CONTACT FORM */}
          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col items-center w-full"
            >
              <h2 className="text-3xl font-extrabold text-white mb-8 text-center">Where should we send your estimate?</h2>
              <form onSubmit={handleSubmit} className="w-full max-w-md space-y-5">
                <input type="text" name="name" placeholder="Full Name" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#6e45ff] transition-colors" />
                <input type="text" name="company" placeholder="Company / Fleet Name" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#6e45ff] transition-colors" />
                <input type="email" name="email" placeholder="Email Address" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#6e45ff] transition-colors" />
                <input type="tel" name="phone" placeholder="Phone Number" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-[#6e45ff] transition-colors" />
                
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={handleBack} className="px-6 py-4 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors">Back</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 py-4 rounded-xl font-bold text-black bg-[#3dfd98] hover:bg-[#a990ff] hover:text-white transition-all disabled:opacity-50">
                    {isSubmitting ? "Processing..." : "Get Instant Estimate"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center py-12"
            >
              <div className="w-24 h-24 bg-[#3dfd98]/20 text-[#3dfd98] rounded-full flex items-center justify-center text-4xl mb-6 border border-[#3dfd98]/50 shadow-[0_0_30px_-5px_#3dfd98]">
                ✓
              </div>
              <h2 className="text-3xl font-extrabold text-white mb-4">Request Received!</h2>
              <p className="text-gray-400 max-w-sm">Our dispatch team is reviewing your fleet requirements and will be in touch with your custom estimate shortly.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}