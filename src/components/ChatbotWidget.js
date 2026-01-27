"use client";

import { useState } from "react";

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "👋 Hi! Ask me anything related to admissions.", sender: "bot" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;

    const userMsg = { id: Date.now(), text: input, sender: "user" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        text: "Thanks for your question! Our team will get back to you shortly.",
        sender: "bot",
      };
      setMessages((prev) => [...prev, botMsg]);
    }, 500);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary text-white px-4 py-3 rounded-full shadow-lg flex items-center space-x-2 hover:bg-blue-700 transition"
      >
        <span>💬</span>
        <span className="hidden md:block">Ask any question</span>
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-80 bg-white rounded-xl shadow-2xl flex flex-col">
          <div className="bg-primary text-white p-4 rounded-t-xl font-semibold flex justify-between items-center">
            Smart Admission Chatbot
            <button onClick={() => setIsOpen(false)} className="text-white hover:opacity-80">
              ✕
            </button>
          </div>

          <div className="p-4 h-64 overflow-y-auto text-sm space-y-2 bg-gray-50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-lg max-w-xs ${
                    msg.sender === "user"
                      ? "bg-primary text-white"
                      : "bg-white text-gray-600 border border-gray-200"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <div className="flex border-t bg-white">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type your question..."
              className="flex-1 px-3 py-2 text-sm focus:outline-none"
            />
            <button
              onClick={handleSend}
              className="bg-primary text-white px-4 hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
