"use server";

import { createClient } from "@supabase/supabase-js";

export async function submitLead(payload: any) {
  try {
    // Use the admin client to bypass RLS (since anonymous website visitors submit this)
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.from("leads").insert({
      customer_name: payload.name,
      customer_email: payload.email,
      customer_phone: payload.phone,
      vehicle_info: payload.vehicle,
      service_needed: payload.services.join(", "),
      message: payload.company ? `Company/Fleet: ${payload.company}` : null,
      status: "NEW",
    });

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error("Failed to submit lead:", error);
    return { error: error.message || "Failed to submit request" };
  }
}