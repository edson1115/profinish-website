"use client";

import { toast } from "sonner";
import { ReactNode } from "react";

export function ToastForm({
  action,
  children,
  successMessage,
  className
}: {
  action: (formData: FormData) => Promise<any>;
  children: ReactNode;
  successMessage: string;
  className?: string;
}) {
  return (
    <form
      action={async (formData) => {
        const result = await action(formData);
        if (result?.error) {
          toast.error(result.error);
        } else {
          toast.success(successMessage);
        }
      }}
      className={className}
    >
      {children}
    </form>
  );
}