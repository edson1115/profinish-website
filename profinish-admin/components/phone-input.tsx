"use client";

import { useState } from "react";

export function PhoneInput({ name = "phone", required = false }: { name?: string, required?: boolean }) {
  const [phone, setPhone] = useState("");

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // 1. Strip everything except numbers from the input
    const rawValue = e.target.value.replace(/\D/g, "");
    
    // 2. Format the value dynamically based on length
    let formattedValue = "";
    if (rawValue.length < 4) {
      formattedValue = rawValue;
    } else if (rawValue.length < 7) {
      formattedValue = `(${rawValue.slice(0, 3)}) ${rawValue.slice(3)}`;
    } else {
      formattedValue = `(${rawValue.slice(0, 3)}) ${rawValue.slice(3, 6)}-${rawValue.slice(6, 10)}`;
    }

    // 3. Update state to reflect the formatted mask
    setPhone(formattedValue);
  };

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-400 mb-2">Phone Number</label>
      <input
        type="tel"
        name={name}
        value={phone}
        onChange={handlePhoneChange}
        required={required}
        autoComplete="tel"
        placeholder="(555) 555-5555"
        maxLength={14} // Locks input perfectly at (XXX) XXX-XXXX
        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff] transition-colors text-base sm:text-sm"
      />
    </div>
  );
}