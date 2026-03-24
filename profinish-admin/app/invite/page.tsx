// app/invite/page.tsx
import Link from "next/link";

export default function CustomerInvitePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#6e45ff]/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-10 backdrop-blur-xl relative z-10 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            Profinish
          </h1>
          <p className="text-gray-400">
            Create your customer account to track estimates, approve repairs, and manage your vehicles.
          </p>
        </div>

        {/* You will attach your Server Action or Supabase signup function to this form */}
        <form className="flex flex-col gap-5">
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-300">First Name</label>
              <input 
                type="text" 
                name="firstName"
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6e45ff] focus:ring-1 focus:ring-[#6e45ff] transition-all"
                placeholder="John"
              />
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-gray-300">Last Name</label>
              <input 
                type="text" 
                name="lastName"
                required
                className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6e45ff] focus:ring-1 focus:ring-[#6e45ff] transition-all"
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Email Address</label>
            <input 
              type="email" 
              name="email"
              required
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6e45ff] focus:ring-1 focus:ring-[#6e45ff] transition-all"
              placeholder="john@example.com"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-300">Choose a Password</label>
            <input 
              type="password" 
              name="password"
              required
              className="w-full px-4 py-3 bg-black/50 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#6e45ff] focus:ring-1 focus:ring-[#6e45ff] transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            className="w-full py-4 mt-4 bg-[#6e45ff] hover:bg-[#a990ff] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(110,69,255,0.4)] hover:shadow-[0_0_30px_rgba(110,69,255,0.6)]"
          >
            Create Account
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-8">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-[#a990ff] hover:text-white transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
