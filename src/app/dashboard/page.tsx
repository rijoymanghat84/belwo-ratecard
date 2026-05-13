import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <Image src="/belwo-logo.png" alt="BelWo" width={120} height={30} />
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Dashboard</h1>
      </div>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="text-3xl font-bold text-[#1e3a5f]">—</div>
          <div className="text-sm text-gray-500 mt-1">Rate Cards</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="text-3xl font-bold text-[#f47920]">—</div>
          <div className="text-sm text-gray-500 mt-1">Invoices</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="text-3xl font-bold text-[#2c5282]">—</div>
          <div className="text-sm text-gray-500 mt-1">Fixed Bids</div>
        </div>
      </div>
      <div className="space-y-2">
        <Link href="/ratecards/new" className="block p-4 bg-[#1e3a5f] text-white rounded-lg hover:bg-[#2c5282] transition-colors font-medium">
          + Create New Rate Card
        </Link>
        <Link href="/admin/presets" className="block p-4 bg-white border rounded-lg hover:border-[#f47920] text-gray-700 transition-colors">
          Manage Rate Presets
        </Link>
        <Link href="/admin/templates" className="block p-4 bg-white border rounded-lg hover:border-[#f47920] text-gray-700 transition-colors">
          Edit Templates
        </Link>
      </div>
    </div>
  );
}
