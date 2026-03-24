// app/auth/verify/page.tsx
import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4 relative overflow-hidden">
      {/* Background glow effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#6e45ff]/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-10 text-center backdrop-blur-xl relative z-10 shadow-2xl">
        <div className="w-20 h-20 bg-[#6e45ff]/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-[#6e45ff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-4">Check your inbox</h2>
        
        <p className="text-gray-400 mb-8 leading-relaxed">
          We've sent a verification link to your email address. 
          Please click the link to confirm your account and access the shop portal.
        </p>

        <div className="flex flex-col gap-4">
          <Link 
            href="/auth/login" 
            className="w-full py-4 bg-[#6e45ff] hover:bg-[#a990ff] text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(110,69,255,0.4)] hover:shadow-[0_0_30px_rgba(110,69,255,0.6)]"
          >
            Go to Login
          </Link>
          
          <p className="text-sm text-gray-500 mt-4">
            Didn't receive the email? Check your spam folder or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}
