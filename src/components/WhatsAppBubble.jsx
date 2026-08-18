import { useState } from 'react';
import { WHATSAPP_NUMBER } from '../data/links';
import { trackWhatsAppClick } from '../lib/analytics';

export default function WhatsAppBubble({ message = "Hi! I'm interested in bulk pricing for Avani Agro products." }) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Save Lead to Backend (Picky Assist + Database)
      await fetch('/api/save-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'Agro_WhatsApp_Bubble',
          page: window.location.href,
          inquiry: message
        })
      });

      // 2. Track analytics event
      trackWhatsAppClick('smart_bubble', message);

      // 3. Open WhatsApp
      const contextualMessage = `Namaste! My name is ${formData.name}. ${message}`;
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(contextualMessage)}`;
      window.open(url, '_blank');
      
      setIsOpen(false);
    } catch (err) {
      console.error('Lead Capture Failed:', err);
      // Still open WhatsApp even if capture fails so we don't lose the user
      const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        id="whatsapp-bubble"
        aria-label="Chat on WhatsApp"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 24px rgba(37,211,102,0.5)',
          zIndex: 9999,
          border: 'none',
          cursor: 'pointer',
          animation: 'wa-pulse 2.5s infinite',
          transition: 'transform 0.2s ease',
        }}
        onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.12)'}
        onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
      >
        <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </button>

      {/* Overlay Form */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            background: 'white',
            padding: '32px',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '400px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
            position: 'relative',
            animation: 'slideUp 0.3s ease-out'
          }}>
            <button 
              onClick={() => setIsOpen(false)}
              style={{ position: 'absolute', top: 16, right: 16, border: 'none', background: 'none', fontSize: 24, cursor: 'pointer' }}
            >
              &times;
            </button>

            <h3 style={{ margin: '0 0 8px', color: '#1a1a1a', fontSize: '24px' }}>Quick Inquiry</h3>
            <p style={{ margin: '0 0 24px', color: '#666', fontSize: '14px' }}>
              Enter your details to start chatting with our Sales Team.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#333' }}>FULL NAME</label>
                <input
                  required
                  type="text"
                  placeholder="Enter your name"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px' }}
                />
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: '600', color: '#333' }}>WHATSAPP NUMBER</label>
                <input
                  required
                  type="tel"
                  placeholder="+91 00000 00000"
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #ddd', fontSize: '16px' }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  color: 'white',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading ? 'Connecting...' : 'Start WhatsApp Chat'}
              </button>
            </form>
          </div>
        </div>
      )}

      <style>{`
        @keyframes wa-pulse {
          0%, 100% { box-shadow: 0 4px 24px rgba(37,211,102,0.5); }
          50% { box-shadow: 0 4px 36px rgba(37,211,102,0.8), 0 0 0 10px rgba(37,211,102,0.1); }
        }
        @keyframes slideUp {
          from { transform: translateY(50px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
