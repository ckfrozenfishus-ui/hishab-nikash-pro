import { useState, useRef, useEffect } from 'react';
import { useCompany } from '../contexts/CompanyContext';
import { aiChat, aiExtractInvoice, getAiSessions, getAiSessionMessages } from '../lib/api';
import AppShell from '../components/layout/AppShell';
import { useNavigate } from 'react-router-dom';
import { PaperPlaneRight, Robot, Plus, Image, SpinnerGap, ClockCounterClockwise, Lightning, ChartBar, Users, Package, Receipt } from '@phosphor-icons/react';

const SUGGESTIONS = [
  { icon: ChartBar, label: 'Summarize sales this month', prompt: 'Summarize my sales performance this month including total sales, top customers, and trends.' },
  { icon: Users, label: 'Show overdue customers', prompt: 'Which customers have overdue invoices? List them with amounts and days overdue.' },
  { icon: Receipt, label: 'Compare expenses by month', prompt: 'Compare my expenses from last month vs this month. Which categories increased?' },
  { icon: Package, label: 'Low stock items', prompt: 'What items are currently low on stock and need to be reordered?' },
  { icon: Lightning, label: 'Cash flow analysis', prompt: 'Analyze my cash flow. What are the main inflows and outflows?' },
  { icon: Receipt, label: 'Top selling products', prompt: 'What are my top 5 selling products by revenue and quantity?' },
];

export default function AIAssistant() {
  const { selectedCompany } = useCompany();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [sessions, setSessions] = useState([]);
  const [showSessions, setShowSessions] = useState(false);
  const [showImageUpload, setShowImageUpload] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    getAiSessions().then(res => setSessions(res.data)).catch(() => {});
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text) => {
    const msg = text || input;
    if (!msg.trim() || loading) return;
    const newMessages = [...messages, { role: 'user', content: msg }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    try {
      const res = await aiChat({ message: msg, session_id: sessionId || undefined, company_id: selectedCompany?.company_id || '' });
      setSessionId(res.data.session_id);
      setMessages([...newMessages, { role: 'assistant', content: res.data.response }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = () => {
    setMessages([]);
    setSessionId('');
    setShowSessions(false);
  };

  const handleLoadSession = async (sid) => {
    try {
      const res = await getAiSessionMessages(sid);
      setMessages(res.data.map(m => ({ role: m.role, content: m.content })));
      setSessionId(sid);
      setShowSessions(false);
    } catch (err) { console.error(err); }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setExtracting(true);
    setMessages([...messages, { role: 'user', content: `Uploading invoice image: ${file.name}` }]);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await aiExtractInvoice(formData);
      const data = res.data.extracted_data;
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `**Invoice data extracted successfully!**\n\n${data.raw_response ? data.raw_response : `- **Customer:** ${data.customer_name || 'N/A'}\n- **Date:** ${data.invoice_date || 'N/A'}\n- **Items:** ${(data.items || []).length} line items\n- **Total:** $${(data.total || 0).toLocaleString()}\n\nClick "Create Invoice" below to use this data.`}`,
        extractedData: data.raw_response ? null : data
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to extract invoice data. Please try a clearer image.' }]);
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreateFromExtracted = (data) => {
    navigate('/sales/new', { state: { extractedData: data } });
  };

  return (
    <AppShell>
      <div data-testid="ai-assistant-page" className="flex h-[calc(100vh-8rem)] gap-4">
        {/* Sidebar - Sessions */}
        <div className={`${showSessions ? 'w-72' : 'w-0'} transition-all overflow-hidden flex-shrink-0`}>
          <div className="rounded-2xl h-full overflow-y-auto p-4" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ fontFamily: 'Manrope, sans-serif', color: '#191C1E' }}>Chat History</h3>
              <button onClick={handleNewChat} className="p-1 rounded hover:bg-[#F2F4F6]" style={{ color: '#0037B0' }}><Plus size={16} /></button>
            </div>
            <div className="space-y-1">
              {sessions.map(s => (
                <button key={s.session_id} onClick={() => handleLoadSession(s.session_id)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors ${sessionId === s.session_id ? 'bg-[#F2F4F6]' : 'hover:bg-[#F7F9FB]'}`}>
                  <p className="font-medium truncate" style={{ color: '#191C1E' }}>{s.preview}</p>
                  <p className="mt-0.5" style={{ color: '#434655' }}>{s.message_count} messages</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0037B0, #1D4ED8)' }}>
                <Robot size={22} color="white" />
              </div>
              <div>
                <h1 className="text-lg font-bold" style={{ fontFamily: 'Manrope, sans-serif', color: '#191C1E' }}>AI Assistant</h1>
                <p className="text-xs" style={{ color: '#434655' }}>{selectedCompany?.name || 'Select a company'} — GPT-5.2</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button data-testid="ai-history-btn" onClick={() => setShowSessions(!showSessions)}
                className="p-2 rounded-lg hover:bg-white transition-colors" style={{ color: '#434655' }}>
                <ClockCounterClockwise size={20} />
              </button>
              <button data-testid="ai-new-chat" onClick={handleNewChat}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-white"
                style={{ background: 'linear-gradient(135deg, #0037B0, #1D4ED8)' }}>
                <Plus size={14} /> New Chat
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 rounded-2xl overflow-y-auto p-6 space-y-4 mb-4" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full">
                <Robot size={48} style={{ color: '#C4C5D7' }} />
                <h2 className="text-lg font-semibold mt-4 mb-2" style={{ fontFamily: 'Manrope, sans-serif', color: '#191C1E' }}>How can I help?</h2>
                <p className="text-sm mb-8 text-center max-w-md" style={{ color: '#434655' }}>Ask about sales, expenses, inventory, or upload an invoice image to extract data.</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 w-full max-w-2xl">
                  {SUGGESTIONS.map(s => {
                    const Icon = s.icon;
                    return (
                      <button key={s.label} onClick={() => handleSend(s.prompt)}
                        className="text-left p-3 rounded-xl transition-colors hover:bg-[#F7F9FB]" style={{ border: '1px solid #E6E8EA' }}>
                        <Icon size={18} style={{ color: '#0037B0' }} />
                        <p className="text-xs font-medium mt-2" style={{ color: '#191C1E' }}>{s.label}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.role === 'user' ? '' : ''}`}
                    style={{
                      background: msg.role === 'user' ? '#0037B0' : '#F2F4F6',
                      color: msg.role === 'user' ? '#FFFFFF' : '#191C1E'
                    }}>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                    {msg.extractedData && (
                      <button onClick={() => handleCreateFromExtracted(msg.extractedData)}
                        className="mt-2 px-3 py-1.5 rounded-lg text-xs font-medium text-white"
                        style={{ background: '#16a34a' }}>
                        Create Invoice from Data
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl px-4 py-3" style={{ background: '#F2F4F6' }}>
                  <SpinnerGap size={18} className="animate-spin" style={{ color: '#0037B0' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="rounded-2xl p-3 flex items-center gap-2" style={{ background: '#FFFFFF', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            <button data-testid="ai-upload-image" onClick={() => fileInputRef.current?.click()}
              disabled={extracting}
              className="p-2.5 rounded-lg transition-colors hover:bg-[#F2F4F6]" style={{ color: extracting ? '#C4C5D7' : '#434655' }}>
              <Image size={20} />
            </button>
            <input data-testid="ai-chat-input" type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your business..."
              className="flex-1 px-3 py-2.5 text-sm rounded-lg focus:outline-none"
              style={{ background: '#F7F9FB', color: '#191C1E' }} />
            <button data-testid="ai-send-btn" onClick={() => handleSend()} disabled={loading || !input.trim()}
              className="p-2.5 rounded-lg transition-opacity"
              style={{ background: 'linear-gradient(135deg, #0037B0, #1D4ED8)', opacity: loading || !input.trim() ? 0.5 : 1 }}>
              <PaperPlaneRight size={18} color="white" />
            </button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
