import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Suspense } from "react";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { ToastForm } from "@/components/toast-form";
import { SubmitActionButton } from "@/components/submit-action-button";

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

    }
  }

  revalidatePath("/protected/shops");
}

async function addVendor(formData: FormData) {
  "use server";
  const shopName = formData.get("shopName") as string;
  const email = formData.get("email") as string;
  const serviceType = formData.get("serviceType") as string;

  if (!email) return { error: "Email is required" };

  try {
    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1. Invite the user via Supabase Auth (This sends a built-in Supabase invite email, bypassing Resend)
    const { data: authData } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
      data: { name: shopName },
      // Redirects the user here after they click the email link and authenticate
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/auth/update-password`,
    });

    // 2. Immediately create the shop record and link the auth_id
    const { error: dbError } = await supabaseAdmin.from("shops").insert({
      name: shopName,
      contact_email: email,
      service_type: serviceType || "General",
      status: "APPROVED",
      auth_id: authData?.user?.id || null,
    });

    if (dbError) return { error: dbError.message };

    revalidatePath("/protected/shops");
    return { success: true };
  } catch (error: any) {
    console.error("❌ Failed to add vendor", error);
    return { error: error.message || "Failed to add vendor." };
  }
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
        <h2 className="text-xl font-bold mb-4 text-[#6e45ff]">Add a New Vendor</h2>
        <p className="text-sm text-gray-400 mb-6">Directly add a new vendor (like glass or keys). This will create their account and automatically approve them.</p>
        <ToastForm action={addVendor} successMessage="Vendor added successfully!" className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-400 mb-2">Shop Name</label>
            <input type="text" name="shopName" placeholder="e.g. Bob's Keys" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff]" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-400 mb-2">Service Type</label>
            <input type="text" name="serviceType" placeholder="e.g. Glass, Keys, PDR" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff]" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-400 mb-2">Email Address</label>
            <input type="email" name="email" placeholder="shop@example.com" required className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#6e45ff]" />
          </div>
          <SubmitActionButton idleText="➕ Add Vendor" loadingText="Adding..." className="w-full md:w-auto px-8 py-3 bg-[#6e45ff] hover:bg-[#a990ff] text-white rounded-xl text-sm font-bold transition-all active:scale-95 disabled:opacity-50" />
        </ToastForm>
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
