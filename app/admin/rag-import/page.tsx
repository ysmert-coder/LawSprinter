/**
 * Admin RAG Import Page
 * 
 * Upload and process public legal documents for RAG system
 * Admin-only access
 */

import { requireAdmin } from '@/lib/middleware/adminCheck'
import RAGImportForm from './rag-import-form'

export default async function AdminRAGImportPage() {
  // Server-side admin check
  await requireAdmin()

  return (
    <div className="px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Hukuk Bilgi Bankası – RAG Import
        </h1>
        <p className="mt-2 text-gray-600">
          Kamuya açık hukuk dokümanlarını (kanun, içtihat, makale) sisteme ekleyin ve AI embedding'lerini oluşturun.
        </p>
      </div>

      {/* Info Card */}
      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <svg
            className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              RAG Sistemi Nasıl Çalışır?
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                <strong>1. Dosya Upload:</strong> PDF, DOCX veya TXT formatında doküman yükleyin
              </li>
              <li>
                <strong>2. Metin Çıkarma:</strong> Sistem dosya içeriğini otomatik okur
              </li>
              <li>
                <strong>3. Embedding Oluşturma:</strong> n8n ile AI embeddings üretilir (chunk'lara böler)
              </li>
              <li>
                <strong>4. Veritabanı:</strong> Vector search için Supabase'e kaydedilir
              </li>
              <li>
                <strong>5. Kullanım:</strong> Tüm AI asistanlar bu bilgi bankasından faydalanır
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Import Form */}
      <RAGImportForm />

      {/* Guidelines */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">📋 İçerik Yükleme Önerileri</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <h4 className="font-medium mb-2">✅ Uygun İçerikler:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Yargıtay kararları (emsal nitelikli)</li>
              <li>Kanun metinleri ve gerekçeleri</li>
              <li>Hukuk makaleleri ve doktrin</li>
              <li>İçtihat değerlendirmeleri</li>
              <li>Yasal rehberler ve dökümanlar</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">⚠️ Dikkat Edilmesi Gerekenler:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Kişisel veriler içermemeli (KVKK)</li>
              <li>Telif hakkı korumalı eserler yüklenememeli</li>
              <li>Minimum 100 karakter içerik gerekli</li>
              <li>Desteklenen formatlar: PDF, DOCX, TXT</li>
              <li>Maksimum dosya boyutu: 10MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

