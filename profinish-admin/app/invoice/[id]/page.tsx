import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import { PrintButton } from "./print-button";

async function InvoiceContent({ id }: { id: string }) {
  const supabase = await createClient();

  const { data: lead, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !lead) {
    return <div className="p-8 text-center text-red-500">Invoice not found or invalid ID.</div>;
  }

  if (!lead.final_price) {
    return <div className="p-8 text-center">A final price has not been set for this job yet.</div>;
  }

  return (
      <div className="max-w-4xl mx-auto bg-white p-12 md:p-16 shadow-xl print:shadow-none print:p-0 relative z-0">
        
        {lead.is_paid && (
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] pointer-events-none opacity-20 print:opacity-30 flex items-center justify-center z-[-1]">
            <span className="text-8xl font-black text-green-600 border-8 border-green-600 px-8 py-4 rounded-xl tracking-widest uppercase shadow-2xl">PAID</span>
          </div>
        )}
        
        {/* Header */}
        <div className="flex justify-between items-start mb-16 border-b pb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter text-black">Profinish</h1>
            <p className="text-gray-500 mt-1 font-medium tracking-widest uppercase text-xs">Premium Auto Network</p>
          </div>
          <div className="text-right">
            <h2 className="text-3xl font-light text-gray-300 mb-2">INVOICE</h2>
            <p className="text-gray-800 font-bold">#{lead.id.split('-')[0].toUpperCase()}</p>
            <p className="text-gray-500 text-sm mt-1">Date: {new Date().toLocaleDateString()}</p>
          </div>
        </div>

        {/* Customer & Vehicle Info */}
        <div className="grid grid-cols-2 gap-12 mb-12">
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Billed To</h3>
            <p className="text-lg font-bold text-black">{lead.customer_name}</p>
            <p className="text-gray-600">{lead.customer_email}</p>
            <p className="text-gray-600">{lead.customer_phone}</p>
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Vehicle Details</h3>
            <p className="text-lg font-bold text-black">{lead.vehicle_info || "Vehicle info not provided"}</p>
            {lead.vin && <p className="text-gray-600 font-mono text-sm mt-1">VIN: {lead.vin}</p>}
            {lead.license_plate && <p className="text-gray-600 font-mono text-sm mt-1">Plate: {lead.license_plate}</p>}
          </div>
        </div>

        {/* Line Items */}
        <div className="mb-16">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-black text-xs uppercase tracking-wider text-gray-500">
                <th className="pb-3 font-bold">Description of Service</th>
                <th className="pb-3 font-bold text-right">Total</th>
              </tr>
            </thead>
            <tbody className="text-black">
              <tr className="border-b border-gray-100">
                <td className="py-6 pr-4">
                  <p className="font-bold text-lg mb-1 uppercase">{lead.service_needed}</p>
                  <p className="text-gray-500 text-sm whitespace-pre-wrap">{lead.message || "Standard service implementation as requested."}</p>
                </td>
                <td className="py-6 font-bold text-xl text-right align-top">${lead.final_price.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        
        {/* Completion Report */}
        {lead.completion_report && (
          <div className="mb-16 bg-gray-50 p-6 rounded-lg border border-gray-100 print:bg-transparent print:border-none print:p-0">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Service Completion Report</h3>
            <p className="text-gray-800 whitespace-pre-wrap text-sm leading-relaxed">{lead.completion_report}</p>
          </div>
        )}

        {/* Footer & Legal Disclaimer */}
        <div className="mt-24 pt-8 border-t border-gray-200 text-gray-400 text-xs leading-relaxed text-justify">
          <p className="font-bold text-gray-500 mb-2 uppercase tracking-wider">Service Fulfillment Disclaimer</p>
          <p>Profinish operates as a premium B2B dispatch and coordination network. All physical repair, calibration, and detailing services are fulfilled by our exclusive network of certified, independent partner facilities. Profinish acts exclusively as the coordinating broker to ensure rigorous quality control, priority scheduling, and consolidated billing. For any inquiries regarding this invoice, please contact our dispatch team.</p>
        </div>
      </div>
  );
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-gray-50 py-10 print:py-0 print:bg-white text-black">
      {/* Print Button (Hidden when actually printing) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-end print:hidden px-8">
        <PrintButton />
      </div>

      <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading invoice data...</div>}>
        <InvoiceContent id={id} />
      </Suspense>
    </div>
  );
}