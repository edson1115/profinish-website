"use client";

export function PrintButton() {
  return (
    <button 
      onClick={() => window.print()} 
      className="px-6 py-2 bg-[#6e45ff] text-white font-bold rounded-lg shadow-md hover:bg-[#a990ff] transition-all"
    >
      Print / Save as PDF
    </button>
  );
}