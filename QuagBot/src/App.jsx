import { useState } from 'react';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Sidebar from './components/Sidebar';
import ChatWindow from './components/ChatWindow';
import './App.css';

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    text: "Hi! I'm your assistant. Ask me anything to get started.",
  },
];

function App() {
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);

  function handleSend(text) {
    const userMessage = { id: crypto.randomUUID(), role: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Placeholder response logic. Swap this out for a real API call,
    // e.g. `await fetch('/api/chat', { method: 'POST', body: ... })`.
    setTimeout(() => {
      const botMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: "This is a placeholder response. Connect a backend to make me smarter.",
      };
      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 700);
  }

  return (
    <div className="app-shell">
      <Navbar />

      <div className="app-body">
        <Sidebar side="left" title="Menu">
          <p className="widget-placeholder">Navigation or conversation list goes here.</p>
        </Sidebar>

        <main className="app-main">
          <ChatWindow
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
          />
        </main>

        <Sidebar side="right" title="Details">
          <p className="widget-placeholder">Context, settings, or tools go here.</p>
        </Sidebar>
      </div>

      <Footer />
    </div>
  );
}

export default App;
