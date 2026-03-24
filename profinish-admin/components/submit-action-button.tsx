"use client";

import { useFormStatus } from "react-dom";

export function SubmitActionButton({ 
  idleText, 
  loadingText, 
  className 
}: { 
  idleText: string; 
  loadingText: string; 
  className?: string;
}) {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" disabled={pending} className={className}>
      {pending ? loadingText : idleText}
    </button>
  );
}