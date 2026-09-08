import { useState } from 'react';
import { api } from '../api.js';

const SUGGESTIONS = [
  'How much have I spent in total?',
  'What is my biggest spending category?',
  'Any patterns in my spending I should know about?',
];

export default function AiChat() {
  const [messages, setMessages] = useState([]); // { role: 'user' | 'ai', text }
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(q) {
    if (!q.trim() || loading) return;
    setMessages((prev) => [...prev, { role: 'user', text: q }]);
    setQuestion('');
    setLoading(true);

    try {
      const { answer } = await api.askAi(q);
      setMessages((prev) => [...prev, { role: 'ai', text: answer }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'ai', text: err.message }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    ask(question);
  }

  return (
    <div className="chat-panel">
      <h2 className="panel-title">Ask about your spending</h2>
      <p className="chat-hint">
        This asks Claude to read your own expense records and answer in plain English. Try:{' '}
        {SUGGESTIONS.map((s, i) => (
          <span key={s}>
            <button
              type="button"
              className="icon-btn"
              style={{ color: 'var(--slate)', textDecoration: 'underline', padding: 0 }}
              onClick={() => ask(s)}
            >
              {s}
            </button>
            {i < SUGGESTIONS.length - 1 ? ' · ' : ''}
          </span>
        ))}
      </p>

      {messages.length > 0 && (
        <div className="chat-thread">
          {messages.map((m, i) => (
            <div key={i} className={`chat-bubble ${m.role === 'user' ? 'user' : 'ai'}`}>
              {m.text}
            </div>
          ))}
          {loading && <div className="chat-bubble ai loading">Thinking…</div>}
        </div>
      )}

      <form className="chat-input-row" onSubmit={handleSubmit}>
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask a question about your expenses…"
        />
        <button className="btn btn-primary" type="submit" disabled={loading} style={{ width: 'auto' }}>
          Ask
        </button>
      </form>
    </div>
  );
}
