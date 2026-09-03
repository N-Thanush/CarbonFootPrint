import React, { useState, useEffect, useRef } from 'react';

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || sessionStorage.getItem('token'));
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  // Sync token state on open
  useEffect(() => {
    const currentToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    setToken(currentToken);
  }, [isOpen]);

  const isPostLogin = Boolean(token);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      if (isPostLogin) {
        setMessages([
          {
            sender: 'bot',
            text: 'Hello! 🌿 I am your Carbon Assistant. How can I help you with your carbon activity tracking, goals, or emissions today?',
            options: [
              'How to log an activity?',
              'How is carbon emission calculated?',
              'How to set a monthly goal?',
              'Top 5 recommendations & alerts',
              'Where to read articles?'
            ]
          }
        ]);
      } else {
        setMessages([
          {
            sender: 'bot',
            text: 'Welcome to Carbon Tracker! 🌍 Ask me anything about registration, login, features, or OAuth sign-in.',
            options: [
              'How do I register an account?',
              'Google & GitHub direct login',
              'Forgot or reset password?',
              'What features are in Carbon Tracker?'
            ]
          }
        ]);
      }
    }
  }, [isPostLogin, messages.length]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (query) => {
    const q = query.toLowerCase();

    // Pre-login responses
    if (q.includes('register') || q.includes('create account') || q.includes('sign up')) {
      return {
        text: 'To register manually, click "Create Account". Fill in Step 1 (Credentials), Step 2 (Profile Details), and Step 3 (Upload document proof like PAN or Driving License). After submission, an Admin will review your registration.',
        options: ['Google & GitHub direct login', 'Forgot or reset password?']
      };
    }

    if (q.includes('google') || q.includes('github') || q.includes('oauth') || q.includes('direct')) {
      return {
        text: 'With Google & GitHub Sign-In, you can log in with 1 click! Normal manual registration and admin approval are bypassed, and your account is automatically created & approved instantly.',
        options: ['How do I register an account?', 'What features are in Carbon Tracker?']
      };
    }

    if (q.includes('forgot') || q.includes('reset') || q.includes('password')) {
      return {
        text: 'If you forgot your password, click "Forgot Password?" on the Login page. Enter your email to receive a password reset link.',
        options: ['How do I register an account?', 'Google & GitHub direct login']
      };
    }

    if (q.includes('feature') || q.includes('what is') || q.includes('about')) {
      return {
        text: 'Carbon Tracker helps monitor, calculate, and reduce your carbon footprint! Features include Category Cards UX, Live Emission Calculation, Monthly Goals Progress, Top 5 Recommendations, and Sustainability Articles.',
        options: ['How do I register an account?', 'Google & GitHub direct login']
      };
    }

    // Post-login responses
    if (q.includes('log') || q.includes('activity') || q.includes('record')) {
      return {
        text: 'To log an activity: 1. Go to your Dashboard. 2. Click a Category Card (Transport, Electricity, Food, Shopping). 3. Select an Activity Type (e.g. Bus). 4. Enter quantity to view real-time emission calculation and click "Save Activity".',
        options: ['How is carbon emission calculated?', 'How to set a monthly goal?']
      };
    }

    if (q.includes('calculat') || q.includes('formula') || q.includes('factor')) {
      return {
        text: 'Carbon Emission is calculated automatically using: Total Emission (kg CO₂e) = Quantity × Emission Factor. Emission factors are configured by Admins based on IPCC, EPA, and DEFRA scientific standards.',
        options: ['How to log an activity?', 'Top 5 recommendations & alerts']
      };
    }

    if (q.includes('goal') || q.includes('target') || q.includes('budget')) {
      return {
        text: 'You can set monthly carbon limits under "Monthly Carbon Goals & Targets" tab. Set your target limit in kg CO₂e, and your dashboard will track your real-time progress bar with warning colors.',
        options: ['Top 5 recommendations & alerts', 'How to log an activity?']
      };
    }

    if (q.includes('recommend') || q.includes('alert') || q.includes('top 5') || q.includes('limit')) {
      return {
        text: 'The "Top 5 Emission Activities" section breaks down your highest carbon outputs. If your emissions cross monthly category limits, automated alerts will suggest eco-friendly habits like switching to public transit or plant-based meals.',
        options: ['How to set a monthly goal?', 'Where to read articles?']
      };
    }

    if (q.includes('article') || q.includes('hub') || q.includes('learn') || q.includes('read')) {
      return {
        text: 'Explore the "Sustainability Articles Hub" tab on your dashboard to read published articles on climate action, energy efficiency, and eco-friendly lifestyle tips curated by our Admin team.',
        options: ['How to log an activity?', 'Top 5 recommendations & alerts']
      };
    }

    // Default fallback
    return {
      text: "I'm here to assist! Try clicking one of the suggested topics below or ask about logging activities, carbon calculations, monthly goals, or sustainability articles.",
      options: isPostLogin
        ? ['How to log an activity?', 'How is carbon emission calculated?', 'How to set a monthly goal?']
        : ['How do I register an account?', 'Google & GitHub direct login', 'Forgot or reset password?']
    };
  };

  const handleSend = (textToSend) => {
    const query = textToSend || inputValue;
    if (!query || !query.trim()) return;

    // Add user message
    const userMsg = { sender: 'user', text: query };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');

    // Generate bot reply after short delay
    setTimeout(() => {
      const response = getBotResponse(query);
      setMessages(prev => [...prev, { sender: 'bot', text: response.text, options: response.options }]);
    }, 400);
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 99999, fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Trigger Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '30px',
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            border: 'none',
            boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.5), 0 8px 10px -6px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
          title="Carbon Assistant Chatbot"
        >
          💬
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div style={{
          width: '360px',
          height: '520px',
          borderRadius: '20px',
          backgroundColor: '#0F172A',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'popIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '1rem 1.25rem',
            background: 'linear-gradient(135deg, #10B981 0%, #047857 100%)',
            color: '#FFFFFF',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span style={{ fontSize: '1.4rem' }}>🌿</span>
              <div>
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Carbon Assistant</h4>
                <span style={{ fontSize: '0.72rem', opacity: 0.9 }}>
                  {isPostLogin ? '🟢 User Dashboard Helper' : '⚡ FAQ & Registration Helper'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                color: '#fff',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages List */}
          <div style={{ flex: 1, padding: '1rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  padding: '0.75rem 1rem',
                  borderRadius: msg.sender === 'user' ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  backgroundColor: msg.sender === 'user' ? '#10B981' : '#1E293B',
                  color: '#FFFFFF',
                  fontSize: '0.875rem',
                  lineHeight: '1.4',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                }}>
                  {msg.text}
                </div>

                {/* Option Pills */}
                {msg.options && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.6rem', maxWidth: '95%' }}>
                    {msg.options.map((opt, oIdx) => (
                      <button
                        key={oIdx}
                        onClick={() => handleSend(opt)}
                        style={{
                          background: 'rgba(16, 185, 129, 0.15)',
                          border: '1px solid rgba(16, 185, 129, 0.4)',
                          color: '#34D399',
                          borderRadius: '12px',
                          padding: '0.35rem 0.65rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        💡 {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            style={{
              padding: '0.75rem 1rem',
              backgroundColor: '#1E293B',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              gap: '0.5rem'
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question..."
              style={{
                flex: 1,
                backgroundColor: '#0F172A',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '0.5rem 0.85rem',
                color: '#FFFFFF',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                backgroundColor: '#10B981',
                border: 'none',
                borderRadius: '12px',
                color: '#FFFFFF',
                padding: '0 0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                fontSize: '0.85rem'
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
