// c:\Users\Edson\Website\profinish-admin\app\protected\page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { revalidatePath } from "next/cache";

// Server Action to assign a shop to a lead
async function assignShopToLead(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const shopId = formData.get("shopId") as string;
  
  if (!shopId) {
    console.log("⚠️ No shop selected");
    return;
  }

  const supabase = await createClient();

  // Assign the shop and update the status so the shop knows it needs a quote
  const { error } = await supabase.from("leads").update({ shop_id: shopId, status: "PENDING_QUOTES" }).eq("id", leadId);

  if (error) {
    console.error("❌ Supabase Update Error:", error);
  } else {
    console.log("✅ Successfully assigned shop!");
  }

  revalidatePath("/protected");
}

async function DashboardContent({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const resolvedParams = await searchParams;
  const filter = resolvedParams?.filter || 'all';
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch the user's profile to determine their role and associated shop
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Redirect shop users to their dedicated portal
  if (profile?.role === 'shop') {
    redirect("/shops/dashboard");
  }

  // Build the leads query
  let query = supabase.from("leads").select("*").order("created_at", { ascending: false });

  // Apply the paid/unpaid filter
  if (filter === 'paid') {
    query = query.eq("is_paid", true);
  } else if (filter === 'unpaid') {
    query = query.not("is_paid", "eq", true);
  }

  const { data: leads, error } = await query;

  // Fetch approved shops to populate the dropdown
  const { data: shops } = await supabase.from("shops").select("id, name").eq("status", "APPROVED");

  // Calculate total profit for admin
  let totalProfit = 0;
  let pendingProfit = 0;
  if (profile?.role !== 'shop') {
    const { data: paidLeads } = await supabase.from("leads").select("final_price, shop_cost").eq("is_paid", true);
    if (paidLeads) {
      totalProfit = paidLeads.reduce((sum, lead) => sum + ((lead.final_price || 0) - (lead.shop_cost || 0)), 0);
    }
    
    const { data: unpaidLeads } = await supabase.from("leads").select("final_price, shop_cost").not("is_paid", "eq", true);
    if (unpaidLeads) {
      pendingProfit = unpaidLeads.reduce((sum, lead) => sum + ((lead.final_price || 0) - (lead.shop_cost || 0)), 0);
    }
  }

  // Log any errors to your VS Code terminal to help with debugging
  if (error) {
    console.error("Supabase Error fetching leads:", error);
  }

  // Display any Supabase errors directly on the screen!
  if (error) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto px-6 py-12 text-white">
        <div className="bg-red-500/20 border border-red-500 rounded-3xl p-8">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Supabase Error!</h2>
          <pre className="bg-black/50 p-4 rounded-xl overflow-x-auto font-mono text-sm">{JSON.stringify(error, null, 2)}</pre>
          <p className="mt-4 text-gray-300">Copy this error and paste it here so we can fix it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8 px-6 py-12 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold tracking-tight">Dispatch Dashboard</h1>
        <div className="flex items-center gap-6">
          
          <div className="flex bg-black/40 border border-white/10 rounded-xl p-1">
            <Link href="/protected" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>All</Link>
            <Link href="/protected?filter=unpaid" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'unpaid' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Unpaid</Link>
            <Link href="/protected?filter=paid" className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === 'paid' ? 'bg-[#3dfd98]/20 text-[#3dfd98] shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Paid</Link>
          </div>

          <Link 
            href="/protected/shops" 
            className="inline-flex items-center justify-center rounded-xl bg-white/10 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/20 border border-white/10 shadow-sm"
          >
            Manage Shops
          </Link>
          <div className="text-sm text-gray-400">
            Logged in as <span className="font-bold text-white">{user.email}</span>
          </div>
        </div>
      </div>

      {profile?.role !== 'shop' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#3dfd98]/10 border border-[#3dfd98]/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(61,253,152,0.1)] backdrop-blur-xl flex flex-col justify-center">
            <p className="text-[#3dfd98] text-xs font-bold uppercase tracking-widest mb-1">Total Profit (Paid)</p>
            <p className="text-3xl font-black text-white">${totalProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
          <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-2xl p-6 shadow-[0_0_20px_rgba(250,204,21,0.1)] backdrop-blur-xl flex flex-col justify-center">
            <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-1">Pending Profit</p>
            <p className="text-3xl font-black text-white">${pendingProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          </div>
        </div>
      )}

      <div className="bg-white/5 border border-white/10 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-white/10 bg-black/40 font-semibold text-gray-300">
            <tr>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5">Customer Info</th>
              <th className="px-6 py-5">Service</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Assign Shop</th>
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
                  {lead.is_paid && (
                    <span className="ml-2 px-2 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-md text-[10px] font-black uppercase tracking-widest">
                      PAID
                    </span>
                  )}
                </td>
                <td className="px-6 py-5">
              <form action={assignShopToLead} className="flex items-center gap-2">
                    <input type="hidden" name="leadId" value={lead.id} />
                    <select 
                      name="shopId"
                      defaultValue={lead.shop_id || ""} 
                      className="bg-black/50 border border-white/10 text-white text-sm rounded-lg focus:ring-[#6e45ff] focus:border-[#6e45ff] block w-full p-2.5"
                    >
                      <option value="" disabled>Select a Shop Partner</option>
                      {shops?.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                <button type="submit" className="px-3 py-2 bg-[#6e45ff] hover:bg-[#a990ff] text-white text-xs font-bold rounded-lg transition-all shadow-[0_0_10px_rgba(110,69,255,0.2)]">
                  Save
                </button>
                  </form>
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

export default function ProtectedPage(props: { searchParams: Promise<{ filter?: string }> }) {
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
      <DashboardContent searchParams={props.searchParams} />
    </Suspense>
  );
}
