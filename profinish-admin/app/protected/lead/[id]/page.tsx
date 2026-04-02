// c:\Users\Edson\Website\profinish-admin\app\protected\lead\[id]\page.tsx

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import CheckoutButton from "@/components/checkout-button";
import { SubmitActionButton } from "@/components/submit-action-button";
import { ToastForm } from "@/components/toast-form";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

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
  const shopId = formData.get("shop_id") as string;

  const supabase = await createClient();
  await supabase.from("leads").update({ 
    status: "PENDING_QUOTES",
    shop_id: shopId || null 
  }).eq("id", leadId);
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
  revalidatePath("/protected");
  redirect("/protected");
}

async function updateSchedule(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const schedule_date = formData.get("schedule_date") as string;
  const schedule_time = formData.get("schedule_time") as string;
  const schedule_location = formData.get("schedule_location") as string;
  
  const supabase = await createClient();
  await supabase.from("leads").update({
    schedule_date,
    schedule_time,
    schedule_location
  }).eq("id", leadId);
  revalidatePath("/protected");
  redirect("/protected");
}

async function saveCompletionReport(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const report = formData.get("completion_report") as string;
  
  const supabase = await createClient();
  await supabase.from("leads").update({ completion_report: report }).eq("id", leadId);
  revalidatePath(`/protected/lead/${leadId}`);
}

async function togglePaidStatus(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const currentPaidStatus = formData.get("is_paid") === "true";
  
  const supabase = await createClient();
  await supabase.from("leads").update({ is_paid: !currentPaidStatus }).eq("id", leadId);
  revalidatePath(`/protected/lead/${leadId}`);
}

async function emailCustomerInvoice(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const customerEmail = formData.get("customerEmail") as string;
  const customerName = formData.get("customerName") as string;
  const shopPaymentUrl = formData.get("shopPaymentUrl") as string;
  
  try {
    const invoiceUrl = `https://profinish-admin.vercel.app/invoice/${leadId}`;
    
    let paymentHtml = "";
    if (shopPaymentUrl) {
      paymentHtml = `<p style="margin-top: 24px;"><a href="${shopPaymentUrl}" style="display:inline-block;padding:12px 24px;background-color:#6e45ff;color:white;text-decoration:none;border-radius:8px;font-weight:bold;">Pay Shop Directly</a></p>`;
    }
    
    const { data, error } = await resend.emails.send({
      from: "Profinish <onboarding@resend.dev>",
      to: [customerEmail],
      subject: "Your Profinish Service Invoice",
      html: `<p>Hi <strong>${customerName}</strong>,</p><p>Thank you for choosing Profinish! Your service is complete and your invoice is ready.</p><p><a href="${invoiceUrl}" style="display:inline-block;padding:12px 24px;background-color:#3dfd98;color:#020204;text-decoration:none;border-radius:8px;font-weight:bold;margin-top:16px;">View & Print Invoice</a></p>${paymentHtml}`,
    });
    
    if (error) {
      console.error("❌ Resend API Error:", error);
      return { error: error.message };
    } else {
      console.log("✅ Invoice emailed to customer!", data);
    }
  } catch (error: any) {
    console.error("❌ Failed to send invoice email", error);
    return { error: error.message || "An unknown error occurred while sending the email." };
  }
  
  revalidatePath(`/protected/lead/${leadId}`);
  return { success: true };
}

async function decodeVin(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const vin = formData.get("vin") as string;
  
  if (!vin || vin.length !== 17) return;
  
  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`);
    const data = await response.json();
    
    let year = "", make = "", model = "", trim = "";
    data.Results.forEach((item: any) => {
      if (item.Variable === "Model Year") year = item.Value || "";
      if (item.Variable === "Make") make = item.Value || "";
      if (item.Variable === "Model") model = item.Value || "";
      if (item.Variable === "Trim") trim = item.Value || "";
    });
    
    const vehicleInfo = `${year} ${make} ${model} ${trim}`.trim();
    
    const supabase = await createClient();
    await supabase.from("leads").update({ vin, vehicle_info: vehicleInfo }).eq("id", leadId);
    revalidatePath(`/protected/lead/${leadId}`);
  } catch (err) {
    console.error("Failed to decode VIN:", err);
  }
}

async function generateAIEstimate(formData: FormData) {
  "use server";
  const leadId = formData.get("leadId") as string;
  const supabase = await createClient();

  const { data: lead } = await supabase.from("leads").select("image_urls, vehicle_info, service_needed, message").eq("id", leadId).single();
  if (!lead || !lead.image_urls || lead.image_urls.length === 0) return;

  const OpenAI = (await import("openai")).default;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const content: any[] = [
    { type: "text", text: `Please provide a rough repair estimate based on these images. Service requested: ${lead.service_needed}. Vehicle: ${lead.vehicle_info || "Unknown"}. Customer notes: ${lead.message || "None"}. Give a brief analysis of the damage, estimated repair time, and a suggested price range in dollars.` }
  ];

  for (const url of lead.image_urls) {
    content.push({ type: "image_url", image_url: { url } });
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content }],
      max_tokens: 500,
    });

    const aiEstimate = response.choices[0].message.content;
    await supabase.from("leads").update({ ai_estimate: aiEstimate }).eq("id", leadId);
    revalidatePath(`/protected/lead/${leadId}`);
  } catch (err) {
    console.error("OpenAI Error:", err);
  }
}

// --- Content Component ---
async function LeadDetailsContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  const commission = (lead?.final_price || 0) - (lead?.shop_cost || 0);
  const assignedShop = shops?.find(s => s.id === lead.shop_id);

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

      {/* Vehicle Info & VIN Decoder */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl mt-2">
        <h2 className="text-xl font-bold mb-6 text-yellow-400">Vehicle Information</h2>
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-1">
            <p className="text-sm text-gray-500 mb-1">Decoded Vehicle Details</p>
            <p className="font-bold text-white text-xl">{lead.vehicle_info || "No vehicle info yet."}</p>
            {lead.vin && <p className="text-sm text-gray-400 mt-1 font-mono">VIN: {lead.vin}</p>}
            {lead.license_plate && <p className="text-sm text-gray-400 mt-1 font-mono">License Plate: {lead.license_plate}</p>}
          </div>
          <form action={decodeVin} className="flex gap-3 items-end md:w-1/2">
            <input type="hidden" name="leadId" value={lead.id} />
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-400 mb-2">Enter VIN to Decode</label>
              <input type="text" name="vin" defaultValue={lead.vin || ''} placeholder="17-Digit VIN" required minLength={17} maxLength={17} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-yellow-400 uppercase font-mono" />
            </div>
            <button type="submit" className="px-6 py-3 bg-yellow-400/10 text-yellow-400 hover:bg-yellow-400/20 border border-yellow-400/20 rounded-xl font-bold transition-all shadow-[0_0_15px_rgba(250,204,21,0.2)] active:scale-95">
              Decode
            </button>
          </form>
        </div>
      </div>

      {/* Job Scheduling & Customer Estimate */}
      <div className="grid md:grid-cols-2 gap-6 mt-2">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">Job Scheduling</h2>
            <p className="text-sm text-gray-400 mb-6">Set the confirmed date, time, and location to share with the shop.</p>
          </div>
          
          {lead.estimate_url && (
            <div className="mb-6 p-4 bg-[#6e45ff]/10 border border-[#6e45ff]/20 rounded-xl">
              <p className="text-xs text-[#a990ff] font-bold uppercase mb-2 tracking-wider">Shop's Official Estimate</p>
              <a href={lead.estimate_url} target="_blank" className="text-white hover:text-[#a990ff] font-medium break-all underline decoration-white/30 underline-offset-2">{lead.estimate_url}</a>
            </div>
          )}
          
          {lead.final_photos_url && (
            <div className="mb-6 p-4 bg-[#3dfd98]/10 border border-[#3dfd98]/20 rounded-xl">
              <p className="text-xs text-[#3dfd98] font-bold uppercase mb-2 tracking-wider">Shop's Final Photos</p>
              <a href={lead.final_photos_url} target="_blank" className="text-white hover:text-[#3dfd98] font-medium break-all underline decoration-white/30 underline-offset-2">{lead.final_photos_url}</a>
            </div>
          )}
          
          {lead.shop_payment_url && (
            <div className="mb-6 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-xl">
              <p className="text-xs text-yellow-400 font-bold uppercase mb-2 tracking-wider">Shop's Customer Payment Link</p>
              <a href={lead.shop_payment_url} target="_blank" className="text-white hover:text-yellow-400 font-medium break-all underline decoration-white/30 underline-offset-2">{lead.shop_payment_url}</a>
            </div>
          )}

          <form action={updateSchedule} className="flex flex-col gap-4">
            <input type="hidden" name="leadId" value={lead.id} />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Date</label>
                <input type="date" name="schedule_date" defaultValue={lead.schedule_date || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff] color-scheme-dark" />
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Time</label>
                <input type="time" name="schedule_time" defaultValue={lead.schedule_time || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff] color-scheme-dark" />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-500 mb-1">Location</label>
              <input type="text" name="schedule_location" placeholder="e.g. Shop Address or Mobile Drop-off" defaultValue={lead.schedule_location || ''} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff]" />
            </div>
            <button type="submit" className="w-full mt-2 px-8 py-3 bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-xl font-bold transition-all active:scale-95">
              Save Schedule & Notify Shop
            </button>
          </form>
        </div>
      </div>

      {/* Damage Photos Section */}
      {lead.image_urls && lead.image_urls.length > 0 && (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl mt-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white">Damage Photos</h2>
            <form action={generateAIEstimate}>
              <input type="hidden" name="leadId" value={lead.id} />
              <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-[#6e45ff] to-[#a990ff] text-white rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(110,69,255,0.3)] hover:shadow-[0_0_25px_rgba(110,69,255,0.5)] transition-all flex items-center gap-2 active:scale-95">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                Ask AI for Estimate
              </button>
            </form>
          </div>
          <div className="flex flex-wrap gap-4">
            {lead.image_urls.map((url: string, i: number) => (
              <a key={i} href={url} target="_blank" rel="noreferrer" className="group relative rounded-xl overflow-hidden border border-white/10 w-32 h-32 block bg-black shadow-lg">
                <img src={url} alt={`Damage photo ${i + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
              </a>
            ))}
          </div>

          {/* AI Estimate Result */}
          {lead.ai_estimate && (
            <div className="bg-[#6e45ff]/10 border border-[#6e45ff]/30 rounded-2xl p-6 mt-6">
              <h3 className="text-[#a990ff] font-bold flex items-center gap-2 mb-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                AI Assistant Analysis
              </h3>
              <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                {lead.ai_estimate}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6 mt-2">
        {/* Dispatch Controls */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold mb-4 text-white">Dispatch Controls</h2>
            <p className="text-sm text-gray-400 mb-6">Select a partner shop to request a quote or dispatch this job.</p>
          </div>
          <form action={dispatchToShop} className="flex flex-col gap-4">
            <input type="hidden" name="leadId" value={lead.id} />
            <select 
              name="shop_id" 
              defaultValue={lead.shop_id || ""}
              required 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff]">
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
          
          {assignedShop && (
            <div className="mb-6 p-4 bg-[#6e45ff]/10 border border-[#6e45ff]/20 rounded-xl">
              <p className="text-sm text-[#a990ff] mb-1 font-semibold uppercase tracking-wider">Assigned Vendor</p>
              <p className="text-xl font-bold text-white">{assignedShop.name}</p>
            </div>
          )}

          <form action={updateFinancials} className="flex flex-col gap-4">
            <input type="hidden" name="leadId" value={lead.id} />
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm text-gray-500 mb-1">Shop Cost (To Us)</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-gray-400">$</span>
                <input type="number" step="0.01" name="shop_cost" defaultValue={lead.shop_cost || ''} readOnly className="w-full bg-black/50 border border-white/10 rounded-xl pl-8 pr-4 py-3 text-gray-400 cursor-not-allowed focus:outline-none" placeholder="Pending..." />
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
            
            {/* Show the calculated profit margin if both numbers exist */}
            {lead.shop_cost > 0 && lead.final_price > 0 && (
              <div className="p-4 rounded-xl bg-[#3dfd98]/10 border border-[#3dfd98]/20 flex justify-between items-center mt-2">
                <span className="text-[#3dfd98] font-bold">Your Profit Margin:</span>
                <span className="text-[#3dfd98] font-bold text-xl">${commission.toFixed(2)}</span>
              </div>
            )}
            
            <button type="submit" className="w-full mt-2 px-8 py-3 bg-[#3dfd98]/10 text-[#3dfd98] hover:bg-[#3dfd98]/20 border border-[#3dfd98]/20 rounded-xl font-bold transition-all active:scale-95">
              Save Financials
            </button>
          </form>

          {/* Generate Customer Invoice Button */}
          {lead.final_price > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col gap-4">
              <h3 className="text-white font-bold">Customer Documents & Report</h3>
              
              <form action={saveCompletionReport} className="flex flex-col gap-3 mb-2">
                <input type="hidden" name="leadId" value={lead.id} />
                <label className="text-sm text-gray-400">Final Completion Report (Shows on Invoice)</label>
                <textarea 
                  name="completion_report" 
                  defaultValue={lead.completion_report || ''} 
                  rows={3} 
                  placeholder="e.g., Successfully repaired front bumper. ADAS calibration completed and passed." 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff]"
                ></textarea>
                <button type="submit" className="w-full px-8 py-2 bg-white/10 text-white hover:bg-white/20 border border-white/20 rounded-xl text-sm font-bold transition-all active:scale-95">
                  Save Report
                </button>
              </form>

              <form action={togglePaidStatus} className="w-full">
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="is_paid" value={String(lead.is_paid || false)} />
                <button type="submit" className={`w-full mb-2 text-center px-8 py-3 border rounded-xl text-sm font-bold transition-all active:scale-95 ${lead.is_paid ? 'bg-[#3dfd98]/20 text-[#3dfd98] border-[#3dfd98]/30 hover:bg-[#3dfd98]/30' : 'border-white/20 hover:bg-white/10 text-white'}`}>
                  {lead.is_paid ? '✅ Invoice Marked as PAID (Click to Undo)' : 'Mark Invoice as PAID'}
                </button>
              </form>

              <ToastForm action={emailCustomerInvoice} successMessage="Invoice emailed successfully!" className="w-full">
                <input type="hidden" name="leadId" value={lead.id} />
                <input type="hidden" name="customerEmail" value={lead.customer_email} />
                <input type="hidden" name="customerName" value={lead.customer_name} />
                <input type="hidden" name="shopPaymentUrl" value={lead.shop_payment_url || ""} />
                <SubmitActionButton 
                  idleText="✉️ Email Invoice to Customer"
                  loadingText="✉️ Sending Email..."
                  className="w-full mb-2 text-center px-8 py-3 bg-[#6e45ff]/20 text-[#a990ff] hover:bg-[#6e45ff]/30 border border-[#6e45ff]/30 rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </ToastForm>

              <a 
                href={`/invoice/${lead.id}`} 
                target="_blank" 
                className="w-full text-center px-8 py-3 border border-white/20 hover:bg-white/10 text-white rounded-xl font-bold transition-all active:scale-95"
              >
                View / Print Customer Invoice
              </a>
            </div>
          )}

          {/* Generate Payment Link for Shop */}
          {lead.status === 'COMPLETED' && commission > 0 && (
            <div className="mt-8 pt-6 border-t border-white/10">
              <h3 className="text-white font-bold mb-4">Payment Collection</h3>
              <CheckoutButton leadId={lead.id} amount={commission} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Main Page Wrapper ---
export default function LeadDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
      <LeadDetailsContent params={params} />
    </Suspense>
  );
}
