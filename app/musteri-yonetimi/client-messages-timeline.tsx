'use client'

import { useState, useEffect } from 'react'

interface ClientMessagesTimelineProps {
  clientId: string
}

interface Message {
  id: string
  direction: 'inbound' | 'outbound'
  channel: string
  message_text: string
  created_at: string
}

export default function ClientMessagesTimeline({ clientId }: ClientMessagesTimelineProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState({
    channel: 'note',
    message_text: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchMessages()
  }, [clientId])

  const fetchMessages = async () => {
    setLoading(true)

    try {
      const response = await fetch(`/api/clients/${clientId}/messages`)

      if (!response.ok) {
        throw new Error('Mesajlar yüklenemedi')
      }

      const data = await response.json()
      setMessages(data)
    } catch (err) {
      console.error('Messages fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newMessage.message_text.trim()) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/clients/${clientId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          direction: 'outbound',
          channel: newMessage.channel,
          message_text: newMessage.message_text,
        }),
      })

      if (!response.ok) {
        throw new Error('Mesaj eklenemedi')
      }

      setNewMessage({ channel: 'note', message_text: '' })
      fetchMessages()
    } catch (err) {
      console.error('Add message error:', err)
      alert('Mesaj eklenirken bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  const getChannelIcon = (channel: string) => {
    const icons: Record<string, JSX.Element> = {
      whatsapp: (
        <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      ),
      email: (
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      portal: (
        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      note: (
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      sms: (
        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
    }

    return icons[channel] || icons.note
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Mesaj / Not Timeline</h3>

      {/* New Message Form */}
      <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kanal
            </label>
            <select
              value={newMessage.channel}
              onChange={(e) => setNewMessage({ ...newMessage, channel: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            >
              <option value="note">Not (Dahili)</option>
              <option value="portal">Portal Mesajı</option>
              <option value="email">E-posta</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mesaj / Not
            </label>
            <textarea
              rows={3}
              value={newMessage.message_text}
              onChange={(e) => setNewMessage({ ...newMessage, message_text: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="Mesajınızı yazın..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? 'Ekleniyor...' : 'Mesaj / Not Ekle'}
          </button>
        </div>
      </form>

      {/* Messages Timeline */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-2"></div>
          <p className="text-sm text-gray-600">Yükleniyor...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">Henüz mesaj veya not yok</p>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.direction === 'inbound' ? 'flex-row' : 'flex-row-reverse'
              }`}
            >
              {/* Icon */}
              <div className="flex-shrink-0 mt-1">
                {getChannelIcon(message.channel)}
              </div>

              {/* Message Content */}
              <div
                className={`flex-1 p-3 rounded-lg ${
                  message.direction === 'inbound'
                    ? 'bg-gray-100'
                    : 'bg-indigo-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-gray-600">
                    {message.channel.toUpperCase()}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleString('tr-TR')}
                  </span>
                </div>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">
                  {message.message_text}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

