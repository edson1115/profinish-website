import { QuoteBuilder } from "@/components/quote-builder";

export default function QuotePage() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-12 flex flex-col items-center">
      <div className="text-center mb-8 px-6">
        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Build Your Custom Quote</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">Select your fleet vehicles and desired upgrades to get an instant estimate sent to your dispatch team.</p>
      </div>
      
      <QuoteBuilder />
    </div>
  );
}