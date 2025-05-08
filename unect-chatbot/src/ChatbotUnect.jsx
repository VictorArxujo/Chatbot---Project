import { useState } from "react";
import axios from "axios";
import "./App.css";

export default function ChatbotUnect({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:3001/chat", {
        prompt: input,
      });
      const botReply = { role: "bot", text: res.data.resposta };
      setMessages((prev) => [...prev, botReply]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: "Erro ao obter resposta." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setMessages([]);
    onClose();
  };

  return (
    <div className="chat-popup">
      <div className="chat-header">
        🐵 Unino Jr
        <div>
          <span className="chat-icon" onClick={() => setMinimized(!minimized)}>
            {minimized ? "🔼" : "🔽"}
          </span>
          <span className="chat-close" onClick={handleClose}>
            ×
          </span>
        </div>
      </div>

      {!minimized && (
        <>
          <div className="chat-container">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-message ${msg.role}`}>
                <p>{msg.text}</p>
              </div>
            ))}
            {loading && <p className="chat-message bot">Pensando...</p>}
          </div>
          <div className="input-container">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Digite sua pergunta..."
            />
            <button onClick={handleSend}>Enviar</button>
          </div>
        </>
      )}
    </div>
  );
}
