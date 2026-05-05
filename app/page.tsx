'use client';

import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function Chat() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat();

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    sendMessage({ text: input }); 
    setInput('');
  };

  return (
    <div className="flex flex-col w-full h-screen bg-gray-950 text-gray-100 font-sans">
      {/* Header */}
      <header className="p-6 border-b border-gray-800 bg-gray-900 shadow-sm flex items-center justify-center">
        <h1 className="text-xl font-semibold tracking-wide text-white">
          <span className="text-blue-500">Seminaire.com</span> AI Concierge
        </h1>
      </header>
      
      {/* Chat History Window */}
      <div className="flex-1 overflow-auto p-6 max-w-4xl mx-auto w-full flex flex-col space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-12 h-12 mb-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            <p className="text-lg">Where is your next team offsite?</p>
          </div>
        )}
        
        {messages.map((m) => (
          <div key={m.id} className={`p-4 rounded-2xl shadow-md ${m.role === 'user' ? 'bg-blue-600 text-white ml-auto max-w-[75%] rounded-tr-sm' : 'bg-gray-800 border border-gray-700 text-gray-200 mr-auto max-w-[75%] rounded-tl-sm'}`}>
            <span className="font-bold text-xs uppercase tracking-wider block mb-2 opacity-70">
              {m.role === 'user' ? 'You' : 'Concierge'}
            </span>
            <span className="whitespace-pre-wrap leading-relaxed text-sm">
              {m.parts.map((part, index) => {
                if (part.type === 'text') {
                  return <span key={index}>{part.text}</span>;
                }
                return null;
              })}
            </span>
          </div>
        ))}
      </div>

      {/* Input Form */}
      <div className="p-4 bg-gray-900 border-t border-gray-800">
        <form onSubmit={handleCustomSubmit} className="max-w-4xl mx-auto flex gap-3 relative">
          <input
            className="w-full bg-gray-950 border border-gray-700 text-white px-5 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-500 transition-all"
            value={input}
            placeholder="E.g., I need a 2-day offsite near Paris for 15 people..."
            onChange={(e) => setInput(e.target.value)}
          />
          <button type="submit" disabled={!input.trim()} className="absolute right-2 top-2 bottom-2 bg-blue-600 text-white px-6 rounded-lg hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium">
            Send
          </button>
        </form>
      </div>
    </div>
  );
}