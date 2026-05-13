"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function RateCardViewPage() {
  const params = useParams();
  const router = useRouter();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/ratecards/${params.id}`)
      .then((r) => r.json())
      .then(setCard)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;
  if (!card) return <div className="p-8 text-red-500">Rate card not found.</div>;

  return (
    <div className="max-w-3xl mx-auto p-6">
      <button onClick={() => router.back()} className="text-sm text-[#f47920] hover:underline mb-4">← Back</button>
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1e3a5f]">{card.clientName}</h1>
            <p className="text-sm text-gray-500">Template: {card.template?.name}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            card.status === "final" ? "bg-green-100 text-green-700" :
            card.status === "expired" ? "bg-red-100 text-red-700" :
            "bg-yellow-100 text-yellow-700"
          }`}>{card.status}</span>
        </div>

        {card.validUntil && (
          <p className="text-sm text-gray-500 mb-4">Valid until: {new Date(card.validUntil).toLocaleDateString()}</p>
        )}

        <div className="border-t pt-4">
          <h2 className="font-semibold text-[#1e3a5f] mb-2">Versions</h2>
          <div className="space-y-2">
            {card.versions?.map((v: any) => (
              <div key={v.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm">
                <span>v{v.version}</span>
                <span className="text-gray-500">{new Date(v.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
