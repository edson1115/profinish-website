import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { Suspense } from "react";
import { ToastForm } from "@/components/toast-form";
import { SubmitActionButton } from "@/components/submit-action-button";

async function submitEstimate(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const shopCost = formData.get("shop_cost") as string;
  const supabase = await createClient();

  // Update the lead with the shop's estimate and change status to QUOTED
  const { error } = await supabase.from("leads").update({
    shop_cost: parseFloat(shopCost),
    status: "QUOTED",
  }).eq("id", leadId);
  
  if (error) return { error: error.message };

  revalidatePath("/shops/dashboard");
  return { success: true };
}

async function submitEstimateLink(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const estimateUrl = formData.get("estimate_url") as string;
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ estimate_url: estimateUrl }).eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/shops/dashboard");
  return { success: true };
}

async function submitShopPaymentLink(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const paymentUrl = formData.get("shop_payment_url") as string;
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ shop_payment_url: paymentUrl }).eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/shops/dashboard");
  return { success: true };
}

async function submitFinalPhotosLink(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const finalPhotosUrl = formData.get("final_photos_url") as string;
  const supabase = await createClient();
  const { error } = await supabase.from("leads").update({ final_photos_url: finalPhotosUrl }).eq("id", leadId);
  if (error) return { error: error.message };
  revalidatePath("/shops/dashboard");
  return { success: true };
}

async function ShopDashboardContent({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const resolvedParams = await searchParams;
  const filter = resolvedParams?.filter || 'pending';
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // 1. Find the shop record that belongs to this logged-in user
  const { data: shop } = await supabase
    .from("shops")
    .select("id, name, status")
    .eq("auth_id", user.id)
    .maybeSingle(); // Prevents crashing if the auth user isn't linked to a shop yet

  // If they are linked but not approved yet, block access
  if (shop?.status === "PENDING") {
    return (
      <div className="flex flex-col min-h-screen w-full">
        <div className="flex-1 w-full flex flex-col gap-8 p-8 max-w-5xl mx-auto">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Shop Portal</h1>
            <LogoutButton />
          </div>
          <div className="p-12 border border-yellow-400/20 rounded-2xl bg-yellow-400/5 text-center mt-8">
            <h2 className="text-2xl font-bold text-yellow-400 mb-2">Account Pending Approval</h2>
            <p className="text-gray-400">Your shop account is currently under review by an administrator. Check back soon!</p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Fetch leads assigned to this specific shop that need a quote
  let leads: any[] = [];
  if (shop) {
    let query = supabase.from("leads").select("*").eq("shop_id", shop.id).order("created_at", { ascending: false });

    if (filter === 'pending') {
      query = query.eq("status", "PENDING_QUOTES");
    } else if (filter === 'active') {
      query = query.in("status", ["QUOTED", "APPROVED", "DISPATCHED"]);
    } else if (filter === 'completed') {
      query = query.eq("status", "COMPLETED");
    }
    
    const { data } = await query;
    
    leads = data || [];
  }

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex-1 w-full flex flex-col gap-8 p-8 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Shop Portal</h1>
          <p className="text-slate-400 mt-1">{shop ? `Welcome, ${shop.name}` : 'No shop profile linked.'}</p>
        </div>
        <LogoutButton />
      </div>
      
      {/* Status Filters */}
      <div className="flex overflow-x-auto bg-black/40 border border-white/10 rounded-xl p-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        <Link href="/shops/dashboard?filter=pending" className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all ${filter === 'pending' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Needs Quote</Link>
        <Link href="/shops/dashboard?filter=active" className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all ${filter === 'active' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Active Jobs</Link>
        <Link href="/shops/dashboard?filter=completed" className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all ${filter === 'completed' ? 'bg-[#3dfd98]/20 text-[#3dfd98] shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>Completed</Link>
        <Link href="/shops/dashboard?filter=all" className={`px-4 py-2 whitespace-nowrap rounded-lg text-sm font-bold transition-all ${filter === 'all' ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}>All Leads</Link>
      </div>

      <div className="grid gap-6">
        {leads.length === 0 ? (
          <div className="p-8 border border-white/10 rounded-xl bg-black/20 text-center">
            <p className="text-gray-400">No leads currently assigned to you for estimation.</p>
          </div>
        ) : (
          leads.map((lead) => (
            <div key={lead.id} className="p-6 border border-white/10 rounded-2xl bg-white/5 backdrop-blur-md flex flex-col md:flex-row justify-between gap-6">
              <div>
                <h2 className="text-xl font-bold text-white mb-2">{lead.vehicle_info || "Vehicle Info Pending"}</h2>
                <p className="text-sm text-[#3dfd98] font-bold uppercase tracking-widest">{lead.service_needed}</p>
                <p className="text-gray-400 text-sm mt-2 max-w-lg">{lead.message}</p>

                {/* Show damage photos so the shop can accurately estimate */}
                {lead.image_urls && lead.image_urls.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4">
                    {lead.image_urls.map((url: string, i: number) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer" className="block w-20 h-20 rounded-lg overflow-hidden border border-white/10 bg-black">
                        <img src={url} alt={`Damage ${i+1}`} className="w-full h-full object-cover hover:scale-110 transition-transform duration-300" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
              
              {lead.status === "PENDING_QUOTES" ? (
                <ToastForm action={submitEstimate} successMessage="Quote submitted successfully!" className="flex flex-col gap-3 min-w-[250px]">
                  <input type="hidden" name="leadId" value={lead.id} />
                  <label className="text-sm text-gray-400">Your Estimate ($)</label>
                  <input type="number" step="0.01" name="shop_cost" required className="bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-[#6e45ff]" placeholder="0.00" />
                  <SubmitActionButton idleText="Submit Quote" loadingText="Submitting..." className="w-full px-4 py-2 bg-[#6e45ff] text-white rounded-xl font-bold hover:bg-[#a990ff] transition-all disabled:opacity-50" />
                </ToastForm>
              ) : (
                <div className="flex flex-col items-end gap-3 min-w-[300px] justify-center w-full md:w-auto">
                  <span className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest ${
                    lead.status === 'APPROVED' ? 'bg-[#3dfd98]/20 text-[#3dfd98] border border-[#3dfd98]/30' :
                    lead.status === 'QUOTED' ? 'bg-[#6e45ff]/20 text-[#a990ff] border border-[#6e45ff]/30' : 
                    'bg-white/10 text-white border border-white/20'
                  }`}>
                    Status: {lead.status}
                  </span>
                  {lead.shop_cost && (
                    <div className="text-right mt-2">
                      <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Your Estimate</p>
                      <p className="text-3xl font-bold text-[#3dfd98]">${lead.shop_cost}</p>
                    </div>
                  )}

                  {/* Upload link & Schedule Info if APPROVED */}
                  {lead.status === 'APPROVED' && (
                    <div className="w-full mt-4 p-5 bg-black/30 border border-white/10 rounded-xl text-left">
                      {!lead.estimate_url ? (
                        <ToastForm action={submitEstimateLink} successMessage="Estimate link shared!" className="flex flex-col gap-2">
                          <input type="hidden" name="leadId" value={lead.id} />
                          <label className="text-xs text-gray-400 font-bold uppercase">Share Official Estimate Link</label>
                          <input type="url" name="estimate_url" required placeholder="https://your-pos.com/..." className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#6e45ff] text-sm" />
                          <SubmitActionButton idleText="Send to Profinish" loadingText="Sending..." className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all mt-1 disabled:opacity-50" />
                        </ToastForm>
                      ) : (
                        <div>
                          <p className="text-xs text-gray-500 font-bold uppercase mb-1">Official Estimate Shared</p>
                          <a href={lead.estimate_url} target="_blank" className="text-[#6e45ff] hover:text-[#a990ff] text-sm font-medium truncate block max-w-[250px] underline">{lead.estimate_url}</a>
                        </div>
                      )}
                      
                      {(lead.schedule_date || lead.schedule_time || lead.schedule_location) && (
                        <div className="mt-5 pt-4 border-t border-white/10">
                          <p className="text-xs text-[#3dfd98] font-bold uppercase mb-3">Confirmed Schedule</p>
                          {lead.schedule_date && <p className="text-sm text-white mb-1 flex items-center gap-2"><span className="text-lg">📅</span> {lead.schedule_date}</p>}
                          {lead.schedule_time && <p className="text-sm text-white mb-1 flex items-center gap-2"><span className="text-lg">⏰</span> {lead.schedule_time}</p>}
                          {lead.schedule_location && <p className="text-sm text-white flex items-center gap-2"><span className="text-lg">📍</span> {lead.schedule_location}</p>}
                        </div>
                      )}

                      {/* Final Photos Upload */}
                      {!lead.final_photos_url ? (
                        <ToastForm action={submitFinalPhotosLink} successMessage="Final photos submitted!" className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
                          <label className="text-xs text-gray-400 font-bold uppercase">Share Final Repair Photos (Link)</label>
                          <input type="url" name="final_photos_url" required placeholder="https://drive.google.com/..." className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#6e45ff] text-sm" />
                          <SubmitActionButton idleText="Submit Final Photos" loadingText="Submitting..." className="px-4 py-2 bg-[#6e45ff] hover:bg-[#a990ff] text-white text-xs font-bold rounded-lg transition-all mt-1 shadow-[0_0_10px_rgba(110,69,255,0.2)] disabled:opacity-50" />
                        </ToastForm>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-xs text-[#3dfd98] font-bold uppercase mb-1">Final Photos Submitted</p>
                          <a href={lead.final_photos_url} target="_blank" className="text-white hover:text-[#a990ff] text-sm font-medium break-all underline">{lead.final_photos_url}</a>
                        </div>
                      )}

                      {/* Shop Payment Link Upload */}
                      {!lead.shop_payment_url ? (
                        <ToastForm action={submitShopPaymentLink} successMessage="Payment link shared!" className="flex flex-col gap-2 mt-4 pt-4 border-t border-white/10">
                          <label className="text-xs text-gray-400 font-bold uppercase">Share Customer Payment Link</label>
                          <input type="url" name="shop_payment_url" required placeholder="https://checkout.square.site/..." className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#3dfd98] text-sm" />
                          <SubmitActionButton idleText="Submit Payment Link" loadingText="Submitting..." className="px-4 py-2 bg-[#3dfd98]/20 hover:bg-[#3dfd98]/30 text-[#3dfd98] text-xs font-bold rounded-lg transition-all mt-1 shadow-[0_0_10px_rgba(61,253,152,0.1)] disabled:opacity-50" />
                        </ToastForm>
                      ) : (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-xs text-[#3dfd98] font-bold uppercase mb-1">Payment Link Shared</p>
                          <a href={lead.shop_payment_url} target="_blank" className="text-white hover:text-[#a990ff] text-sm font-medium break-all underline">{lead.shop_payment_url}</a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
    </div>
  );
}

export default function ShopDashboard(props: { searchParams: Promise<{ filter?: string }> }) {
  return (
    <Suspense fallback={
      <div className="flex-1 w-full flex items-center justify-center min-h-[50vh] text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#6e45ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400 font-medium">Loading Shop Portal...</p>
        </div>
      </div>
    }>
      <ShopDashboardContent searchParams={props.searchParams} />
    </Suspense>
  );
}
