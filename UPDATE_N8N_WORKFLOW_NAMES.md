# 🔄 n8n Workflow İsimlerini Güncelleme

## 📋 İsim Eşleştirmesi

| Workflow ID | Eski İsim (İngilizce) | Yeni İsim (Türkçe) | Proje Sayfası |
|-------------|----------------------|-------------------|---------------|
| `T3BRaUc3hEH3CNIC` | Case Assistant | **Dava Asistanı** | `/dava-asistani` |
| `11GxCm1xFjcLtQqA` | Strategy Generator | **Strateji Merkezi** | `/dava-strateji-merkezi` |
| `OdA7OWGcZtwIWPfi` | LawSprinter - Draft Generator (Dilekçe Taslak) | **Dilekçe Üretici** | `/dilekce-uretici` |
| `RNJCkHVq85WfyaEm` | LawSprinter - Draft Reviewer (Taslak İnceleyici) | **Dilekçe İnceleme** | `/dilekce-inceleme` |
| `wZJdz8VwRfvl7QLX` | LawSprinter - Generate Embeddings (RAG) | **RAG Embedding Üretici** | `/admin/rag-import` |
| `Xon8XOlPEcBtmMqH` | Training Content Generator | **Eğitim İçerik Üretici** | (gelecek) |
| `067TCkF9XgVXA3Hr` | Client Status Notify | **Müvekkil Durum Bildirimi** | (otomasyon) |
| `hktFU8I39VYbiWDy` | Hearing Followup | **Duruşma Takibi** | (otomasyon) |
| `i9DEi8wolT8WjOFF` | Invoice Reminder | **Fatura Hatırlatıcı** | (otomasyon) |
| `p5m6MSBQQPvaGBtZ` | Contract Analyze | **Sözleşme Analizi** | `/contracts` |

---

## 🚀 Manuel Güncelleme Adımları

n8n UI'da her workflow için:

1. **Workflow'u aç**
2. Sağ üstteki **workflow adına tıkla**
3. **Yeni Türkçe ismi yaz**
4. **Save** (Ctrl+S)

---

## 🔧 Otomatik Güncelleme (n8n API ile)

n8n API kullanarak toplu güncelleme yapabilirsin. Ama şu an n8n MCP'nin `update` fonksiyonu sadece tam workflow güncelleme yapıyor, isim değişikliği için tüm node'ları tekrar göndermek gerekiyor.

**En kolay yöntem**: n8n UI'dan manuel güncelle (5 dakika sürer).

---

## 📝 Güncelleme Sonrası Kontrol Listesi

- [ ] Dava Asistanı
- [ ] Strateji Merkezi
- [ ] Dilekçe Üretici
- [ ] Dilekçe İnceleme
- [ ] RAG Embedding Üretici
- [ ] Eğitim İçerik Üretici
- [ ] Müvekkil Durum Bildirimi
- [ ] Duruşma Takibi
- [ ] Fatura Hatırlatıcı
- [ ] Sözleşme Analizi

---

## ⚠️ Önemli Notlar

1. **Webhook URL'leri değişmez** - Sadece workflow isimleri değişir
2. **Environment variables'ları güncelleme** - Render'daki env değişkenleri aynı kalır
3. **Active/Inactive durumu korunur** - Workflow'ların aktif/pasif durumu değişmez
4. **Node'lar etkilenmez** - Sadece workflow başlığı değişir

---

## 🎯 Neden Türkçe İsimler?

- ✅ Ekip üyeleri için daha anlaşılır
- ✅ Proje sayfalarıyla tutarlılık
- ✅ Hata ayıklama sırasında kolaylık
- ✅ Dokümantasyon ile uyum

