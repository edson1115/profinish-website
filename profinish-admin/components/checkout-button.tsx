"use client";

import { useState } from "react";
import { toast } from "sonner";

interface CheckoutButtonProps {
  leadId: string;
  amount: number; // Your commission amount
}

export default function CheckoutButton({ leadId, amount }: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generateLink = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ leadId, amount }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to generate payment link");
      }

      if (data.url) {
        setPaymentUrl(data.url);
        toast.success("Payment link generated!");
      }
    } catch (error: any) {
      console.error("Error generating checkout link:", error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (paymentUrl) {
      navigator.clipboard.writeText(paymentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {!paymentUrl ? (
        <button
          onClick={generateLink}
          disabled={isLoading || amount <= 0}
          className="inline-flex items-center justify-center rounded-xl bg-[#6e45ff] px-6 py-3 text-sm font-bold text-white transition-all hover:bg-[#a990ff] focus:outline-none focus:ring-2 focus:ring-[#6e45ff] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(110,69,255,0.3)]"
        >
          {isLoading ? "Generating Link..." : `Generate Link to Collect $${amount.toFixed(2)}`}
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-[#3dfd98] font-medium">Link Generated! Send this to the shop:</p>
          <div className="flex items-center gap-2">
            <input 
              type="text" 
              readOnly 
              value={paymentUrl} 
              className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-[#3dfd98]"
            />
            <button 
              onClick={copyToClipboard}
              className="px-4 py-2 bg-[#3dfd98]/10 text-[#3dfd98] hover:bg-[#3dfd98]/20 border border-[#3dfd98]/20 rounded-lg text-sm font-bold transition-all"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}