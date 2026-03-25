import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

async function updateShopStatus(formData: FormData) {
  "use server";
  const shopId = formData.get("shopId") as string;
  const newStatus = formData.get("status") as string;
  
  const supabase = await createClient();
  const { error } = await supabase.from("shops").update({ status: newStatus }).eq("id", shopId);

  if (error) {
    console.error("Error updating shop status:", error);
  } else if (newStatus === 'APPROVED') {
    // 1. Fetch the shop's email and name so we can notify them
    const { data: shop } = await supabase
      .from("shops")
      .select("name, contact_email, auth_id")
      .eq("id", shopId)
      .single();

    if (shop?.contact_email) {
      console.log(`✅ Ready to send approval email to: ${shop.contact_email}`);
      
      // Auto-confirm the user's email in Supabase Auth so they can log in immediately
      if (shop.auth_id) {
        const supabaseAdmin = createAdminClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        await supabaseAdmin.auth.admin.updateUserById(shop.auth_id, { email_confirm: true });
      }

      // 2. Send the email using a provider like Resend
      try {
        const { data, error } = await resend.emails.send({
          from: "Profinish <onboarding@resend.dev>",
          to: [shop.contact_email],
          subject: "Your Shop Account is Approved!",
          html: `<p>Hi <strong>${shop.name}</strong>,</p><p>Great news! Your account has been approved by the Profinish administrator.</p><p>You can now log in to the shop portal to view and estimate leads.</p><p><a href="https://profinish-admin.vercel.app/auth/login" style="display:inline-block;padding:12px 24px;background-color:#6e45ff;color:white;text-decoration:none;border-radius:8px;font-weight:bold;margin-top:16px;">Log In to Shop Portal</a></p>`,
        });
        
        if (error) {
          console.error("❌ Resend API Error:", error);
        } else {
          console.log("✅ Approval email sent!", data);
        }
      } catch (error) {
        console.error("❌ Failed to send email", error);
      }
    }
  }

  revalidatePath("/protected/shops");
}

async function ShopsManagementContent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Fetch all shops
  const { data: shops } = await supabase
    .from("shops")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col gap-8 px-6 py-12 text-white">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Shop Management</h1>
        <Link href="/protected" className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-all">
          &larr; Back to Dashboard
        </Link>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-gray-400">
                <th className="pb-4 font-medium">Shop Name</th>
                <th className="pb-4 font-medium">Service Type</th>
                <th className="pb-4 font-medium">Auth Linked?</th>
                <th className="pb-4 font-medium">Status</th>
                <th className="pb-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {shops?.map((shop) => (
                <tr key={shop.id} className="border-b border-white/5 last:border-0">
                  <td className="py-4 font-bold">{shop.name}</td>
                  <td className="py-4 text-gray-300">{shop.service_type || "N/A"}</td>
                  <td className="py-4 text-gray-500 font-mono text-xs">
                    {shop.auth_id ? <span className="text-[#3dfd98]">Yes</span> : "No"}
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      shop.status === 'APPROVED' ? 'bg-[#3dfd98]/20 text-[#3dfd98]' :
                      shop.status === 'PENDING' ? 'bg-yellow-400/20 text-yellow-400' :
                      'bg-gray-500/20 text-gray-400'
                    }`}>
                      {shop.status || 'APPROVED'} {/* Default older records to APPROVED */}
                    </span>
                  </td>
                  <td className="py-4 flex justify-end">
                    <form action={updateShopStatus} className="flex gap-2">
                      <input type="hidden" name="shopId" value={shop.id} />
                      <input type="hidden" name="status" value={shop.status !== 'APPROVED' ? 'APPROVED' : 'PENDING'} />
                      {shop.status !== 'APPROVED' ? (
                        <button type="submit" className="px-4 py-2 bg-[#6e45ff] hover:bg-[#a990ff] text-white text-xs font-bold rounded-lg transition-all">
                          Approve Shop
                        </button>
                      ) : (
                        <button type="submit" className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-lg transition-all">
                          Revoke Access
                        </button>
                      )}
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ShopsManagementPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 w-full flex items-center justify-center min-h-[50vh] text-white">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-8 w-8 text-[#6e45ff]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-400 font-medium">Loading Shops...</p>
        </div>
      </div>
    }>
      <ShopsManagementContent />
    </Suspense>
  );
}
