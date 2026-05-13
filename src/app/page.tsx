import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
      <div className="text-center max-w-lg px-6">
        <Image src="/belwo-logo.png" alt="BelWo" width={160} height={40} className="mx-auto mb-6" priority />
        <h1 className="text-4xl font-bold text-[#1e3a5f] mb-3">Rate Card Generator</h1>
        <p className="text-gray-500 mb-8 text-lg">Configure, generate, and manage rate cards for your account team.</p>
        <div className="flex flex-col gap-3 w-64 mx-auto">
          <Link href="/ratecards/new" className="py-3 px-6 bg-[#1e3a5f] text-white rounded-lg font-medium hover:bg-[#2c5282] transition-colors text-center">
            Create Rate Card
          </Link>
          <Link href="/dashboard" className="py-3 px-6 bg-white border rounded-lg text-gray-700 font-medium hover:border-[#f47920] transition-colors text-center">
            Dashboard
          </Link>
          <Link href="/admin/presets" className="py-3 px-6 bg-white border rounded-lg text-gray-700 font-medium hover:border-[#f47920] transition-colors text-center">
            Manage Presets
          </Link>
          <Link href="/admin/templates" className="py-3 px-6 bg-white border rounded-lg text-gray-700 font-medium hover:border-[#f47920] transition-colors text-center">
            Edit Templates
          </Link>
        </div>
      </div>
    </div>
  );
}
