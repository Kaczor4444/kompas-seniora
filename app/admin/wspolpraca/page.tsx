"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface PartnerInquiry {
  id: number;
  name: string;
  email: string;
  organization: string;
  partnerType: string;
  phone: string | null;
  message: string;
  status: string;
  createdAt: string;
}

export default function PartnerInquiriesPage() {
  const [inquiries, setInquiries] = useState<PartnerInquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchInquiries();
  }, []);

  const fetchInquiries = async () => {
    try {
      const response = await fetch("/api/wspolpraca");
      const data = await response.json();
      
      if (data.success) {
        setInquiries(data.data);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError("Nie udało się załadować zgłoszeń");
    } finally {
      setLoading(false);
    }
  };

  const partnerTypeLabels: Record<string, string> = {
    mops: "MOPS / OPS",
    facility: "Placówka DPS/ŚDS",
    association: "Stowarzyszenie",
    other: "Inne"
  };

  const statusLabels: Record<string, string> = {
    new: "Nowe",
    contacted: "Skontaktowano",
    completed: "Zakończone",
    archived: "Archiwum"
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4">
            <Link href="/admin" className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Zgłoszenia Współpracy
              </h1>
              <p className="text-gray-600 mt-1">
                {inquiries.length} {inquiries.length === 1 ? 'zgłoszenie' : 'zgłoszeń'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {inquiries.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <p className="text-gray-600">Brak zgłoszeń współpracy</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Kontakt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organizacja
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Typ
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Wiadomość
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inquiries.map((inquiry) => (
                    <tr key={inquiry.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(inquiry.createdAt).toLocaleDateString("pl-PL")}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {inquiry.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          <a href={`mailto:${inquiry.email}`} className="hover:text-emerald-600">
                            {inquiry.email}
                          </a>
                        </div>
                        {inquiry.phone && (
                          <div className="text-sm text-gray-500">
                            <a href={`tel:${inquiry.phone}`} className="hover:text-emerald-600">
                              {inquiry.phone}
                            </a>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {inquiry.organization}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800">
                          {partnerTypeLabels[inquiry.partnerType] || inquiry.partnerType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          inquiry.status === 'new' ? 'bg-blue-100 text-blue-800' :
                          inquiry.status === 'contacted' ? 'bg-yellow-100 text-yellow-800' :
                          inquiry.status === 'completed' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {statusLabels[inquiry.status] || inquiry.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                        <div className="line-clamp-2">
                          {inquiry.message}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
