import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ToastForm } from "@/components/toast-form";
import { SubmitActionButton } from "@/components/submit-action-button";
import { Suspense } from "react";

async function updatePassword(formData: FormData) {
  "use server";
  const password = formData.get("password") as string;
  
  if (!password || password.length < 6) {
    return { error: "Password must be at least 6 characters long." };
  }

  const supabase = await createClient();

  // Since the user is already authenticated by the invite link,
  // we just need to update their current session's user account with a new password.
  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return { error: error.message };
  }

  // Once successful, send them to the protected dashboard
  redirect("/protected");
}

async function UpdatePasswordContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // If they somehow land here without a session, send them to login
  if (!user) {
    redirect("/auth/login");
  }

  return (
      <div className="w-full max-w-md bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <h1 className="text-2xl font-bold mb-2 text-[#6e45ff]">Welcome to Profinish!</h1>
        <p className="text-sm text-gray-400 mb-8">
          Your account has been approved. Please set a secure password to finalize your setup.
        </p>
        
        <ToastForm action={updatePassword} successMessage="Password updated successfully!" className="flex flex-col gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">New Password</label>
            <input type="password" name="password" placeholder="••••••••" required minLength={6} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff]" />
          </div>
          
          <SubmitActionButton idleText="Save Password & Login" loadingText="Saving..." className="w-full py-3 bg-[#6e45ff] hover:bg-[#a990ff] text-white rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50" />
        </ToastForm>
      </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 text-white">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#6e45ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400 font-medium">Loading...</p>
        </div>
      }>
        <UpdatePasswordContent />
      </Suspense>
    </div>
  );
}