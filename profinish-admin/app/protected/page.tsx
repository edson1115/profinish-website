// c:\Users\Edson\Website\profinish-admin\app\protected\page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

async function DashboardContent() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch the leads from your database, newest first
  const { data: leads, error } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8 px-6 py-12 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Dispatch Dashboard</h1>
        <div className="text-sm text-gray-400">
          Logged in as <span className="font-bold text-white">{user.email}</span>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-black/40 font-semibold text-gray-300">
            <tr>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Customer Info</th>
              <th className="px-6 py-5">Service</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {leads?.map((lead) => (
              <tr key={lead.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-5 whitespace-nowrap text-gray-400">
                  {new Date(lead.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-5">
                  <div className="font-bold text-base text-white">{lead.customer_name}</div>
                  <div className="text-gray-400 mt-1 flex items-center gap-3">
                    <span>{lead.customer_phone || "No phone"}</span>
                  </div>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className="px-3 py-1.5 bg-[#6e45ff]/10 text-[#a990ff] border border-[#6e45ff]/20 rounded-full text-xs font-bold uppercase tracking-widest">
                    {lead.service_needed}
                  </span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap">
                  <span className="px-3 py-1.5 bg-[#3dfd98]/10 text-[#3dfd98] border border-[#3dfd98]/20 rounded-full text-xs font-bold uppercase tracking-widest">
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-5 whitespace-nowrap text-right">
                  <Link 
                    href={`/protected/lead/${lead.id}`}
                    className="inline-block px-5 py-2.5 bg-[#6e45ff] text-white rounded-xl text-xs font-bold hover:bg-[#a990ff] transition-all shadow-[0_0_15px_rgba(110,69,255,0.3)] hover:shadow-[0_0_25px_rgba(110,69,255,0.5)] hover:-translate-y-0.5"
                  >
                    View & Dispatch
                  </Link>
                </td>
              </tr>
            ))}
            {(!leads || leads.length === 0) && (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-gray-400 text-lg">
                  No leads found. Waiting for new submissions!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function ProtectedPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 w-full flex items-center justify-center min-h-[50vh] text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#6e45ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400 font-medium">Loading Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
