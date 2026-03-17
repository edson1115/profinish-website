// c:\Users\Edson\Website\profinish-admin\app\protected\lead\[id]\page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";

// --- Server Actions ---
async function updateStatus(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const newStatus = formData.get("status") as string;
  const supabase = await createClient();
  await supabase.from("leads").update({ status: newStatus }).eq("id", leadId);
  revalidatePath(`/protected/lead/${leadId}`);
}

async function dispatchToShop(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const supabase = await createClient();
  await supabase.from("leads").update({ status: "PENDING_QUOTES" }).eq("id", leadId);
  revalidatePath(`/protected/lead/${leadId}`);
}

async function updateFinancials(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const finalPrice = formData.get("final_price") as string;
  const shopCost = formData.get("shop_cost") as string;
  const supabase = await createClient();
  await supabase.from("leads").update({
    final_price: finalPrice ? parseFloat(finalPrice) : null,
    shop_cost: shopCost ? parseFloat(shopCost) : null,
  }).eq("id", leadId);
  revalidatePath(`/protected/lead/${leadId}`);
}

// --- Content Component ---
async function LeadDetailsContent({ id }: { id: string }) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch the specific lead
  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  // Fetch available shops for the dispatch dropdown
  const { data: shops } = await supabase
    .from("shops")
    .select("*")
    .order("name");

  if (error || !lead) {
    return (
      <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8 px-6 py-12 text-white">
        <h1 className="text-3xl font-bold">Lead not found</h1>
        <Link href="/protected" className="text-[#6e45ff] hover:underline font-bold mt-4">
          &larr; Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col gap-8 px-6 py-12 text-white">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/protected" className="text-sm font-bold text-[#6e45ff] hover:text-[#a990ff] transition-colors flex items-center gap-2 mb-4">
            &larr; Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold tracking-tight">Lead Details</h1>
        </div>
        
        <form action={updateStatus} className="flex items-center gap-3">
          <input type="hidden" name="leadId" value={lead.id} />
          <select 
            name="status" 
            defaultValue={lead.status} 
            className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white text-sm font-bold uppercase tracking-widest focus:outline-none focus:border-[#6e45ff]"
          >
            <option value="NEW">NEW</option>
            <option value="PENDING_QUOTES">PENDING QUOTES</option>
            <option value="QUOTED">QUOTED</option>
            <option value="APPROVED">APPROVED</option>
            <option value="DISPATCHED">DISPATCHED</option>
            <option value="COMPLETED">COMPLETED</option>
          </select>
          <button type="submit" className="px-4 py-2 bg-[#3dfd98]/10 text-[#3dfd98] hover:bg-[#3dfd98]/20 border border-[#3dfd98]/20 rounded-xl text-sm font-bold transition-all">
            Save
          </button>
        </form>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-6 text-[#6e45ff]">Customer Info</h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <p className="text-sm text-gray-500 mb-1">Name</p>
              <p className="font-medium text-white text-lg">{lead.customer_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Email</p>
              <p className="font-medium text-white text-lg">
                <a href={`mailto:${lead.customer_email}`} className="hover:text-[#6e45ff] transition-colors">{lead.customer_email}</a>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Phone</p>
              <p className="font-medium text-white text-lg">
                <a href={`tel:${lead.customer_phone}`} className="hover:text-[#6e45ff] transition-colors">{lead.customer_phone || "N/A"}</a>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Submitted On</p>
              <p className="font-medium text-white">{new Date(lead.created_at).toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-6 text-[#3dfd98]">Service Details</h2>
          <div className="space-y-4 text-gray-300">
            <div>
              <p className="text-sm text-gray-500 mb-1">Service Needed</p>
              <p className="font-bold text-white text-xl uppercase tracking-wide">{lead.service_needed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Message / Notes</p>
              <div className="bg-black/40 p-4 rounded-xl border border-white/5 whitespace-pre-wrap mt-2 text-sm leading-relaxed">
                {lead.message || "No additional notes provided."}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-2">
        {/* Dispatch Controls */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">Dispatch Controls</h2>
            <p className="text-sm text-gray-400 mb-6">Select a partner shop to request a quote or dispatch this job.</p>
          </div>
          <form action={dispatchToShop} className="flex flex-col gap-4">
            <input type="hidden" name="leadId" value={lead.id} />
            <select name="shop_id" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff]">
              <option value="">Select a Shop Partner...</option>
              {shops?.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name} ({shop.service_type})
                </option>
              ))}
            </select>
            
            <button type="submit" className="w-full px-8 py-3 bg-[#6e45ff] text-white rounded-xl font-bold hover:bg-[#a990ff] transition-all shadow-[0_0_15px_rgba(110,69,255,0.3)] hover:shadow-[0_0_25px_rgba(110,69,255,0.5)] active:scale-95">
              Request Quote
            </button>
          </form>
        </div>

        {/* Financials & Quotes */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <h2 className="text-xl font-bold mb-4 text-[#3dfd98]">Financials & Quotes</h2>
          <p className="text-sm text-gray-400 mb-6">Track shop costs and final customer quotes here.</p>
          
          <form action={updateFinancials} className="flex flex-col gap-4">
            <input type="hidden" name="leadId" value={lead.id} />
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-500 mb-1">Shop Cost (To Us)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">$</span>
                  <input type="number" step="0.01" name="shop_cost" defaultValue={lead.shop_cost || ''} className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-[#3dfd98]" placeholder="0.00" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-sm text-gray-500 mb-1">Final Price (To Customer)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">$</span>
                  <input type="number" step="0.01" name="final_price" defaultValue={lead.final_price || ''} className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-white focus:outline-none focus:border-[#3dfd98]" placeholder="0.00" />
                </div>
              </div>
            </div>
            
            <button type="submit" className="w-full mt-2 px-8 py-3 bg-[#3dfd98]/10 text-[#3dfd98] hover:bg-[#3dfd98]/20 border border-[#3dfd98]/20 rounded-xl font-bold transition-all active:scale-95">
              Save Financials
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// --- Main Page Wrapper ---
export default async function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <Suspense fallback={
      <div className="flex-1 w-full flex items-center justify-center min-h-[50vh] text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#6e45ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400 font-medium">Loading Lead Details...</p>
        </div>
      </div>
    }>
      <LeadDetailsContent id={id} />
    </Suspense>
  );
}
