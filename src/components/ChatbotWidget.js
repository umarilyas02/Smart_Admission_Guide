"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Sparkles, ChevronDown, Bot } from "lucide-react";

const WELCOME_MSG = {
  id: "welcome",
  role: "assistant",
  text: "Hello! I'm **SAG AI**, your smart admission guide.\n\nI can help you with:\n• University merits & eligibility\n• Entry test preparation (ECAT, MDCAT, NET)\n• Scholarships & fees\n• Program & campus info\n\nWhat would you like to know?",
};

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-purple-400 animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function MessageBubble({ msg }) {
  const isUser = msg.role === "user";

  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, i) =>
      p.startsWith("**") && p.endsWith("**") ? (
        <strong key={i}>{p.slice(2, -2)}</strong>
      ) : (
        <span key={i}>{p}</span>
      )
    );
  };

  const lines = (msg.text || "").split("\n");

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-gradient-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm"
            : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm"
        }`}
      >
        {lines.map((line, i) => (
          <p key={i} className={line === "" ? "h-2" : ""}>
            {renderText(line)}
          </p>
        ))}
        {msg.time && (
          <p className={`text-xs mt-1 ${isUser ? "text-purple-200 text-right" : "text-gray-400"}`}>
            {msg.time}
          </p>
        )}
      </div>
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center shrink-0 mt-0.5 shadow text-gray-600 text-xs font-bold">
          U
        </div>
      )}
    </div>
  );
}

export default function ChatbotWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MSG]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const getTime = () =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  const buildHistory = (msgs) =>
    msgs
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({ role: m.role, content: m.text }));

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isTyping) return;

    const userMsg = { id: Date.now(), role: "user", text, time: getTime() };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput("");
    setIsTyping(true);

    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;

      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: buildHistory(updatedMsgs) }),
      });

      const data = await res.json();
      const botMsg = {
        id: Date.now() + 1,
        role: "assistant",
        text: data.message || "Sorry, something went wrong.",
        time: getTime(),
      };
      setMessages((prev) => [...prev, botMsg]);
      if (!isOpen) setHasUnread(true);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "assistant",
          text: "Connection error. Please try again.",
          time: getTime(),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {isOpen && (
        <div className="w-[360px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          style={{ height: "520px", boxShadow: "0 20px 60px rgba(109,40,217,0.15)" }}>

          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-base tracking-tight">SAG AI</p>
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium">
                  Beta
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <p className="text-purple-200 text-xs">Smart Admission Guide AI</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-gradient-to-b from-gray-50 to-white">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isTyping && (
              <div className="flex gap-2 justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          <div className="px-4 py-2 flex gap-2 overflow-x-auto scrollbar-hide border-t border-gray-50 bg-white">
            {["NUST merit?", "MDCAT prep tips", "Scholarship options"].map((s) => (
              <button
                key={s}
                onClick={() => { setInput(s); inputRef.current?.focus(); }}
                className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full border border-purple-200 text-purple-600 hover:bg-purple-50 transition shrink-0"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 bg-white border-t border-gray-100">
            <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition p-1 pl-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about admissions..."
                className="flex-1 bg-transparent text-sm text-gray-700 resize-none focus:outline-none py-1.5 placeholder-gray-400 max-h-24"
                style={{ lineHeight: "1.5" }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white disabled:opacity-40 hover:from-purple-700 hover:to-indigo-700 transition shrink-0 mb-0.5"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-center text-xs text-gray-400 mt-1.5">
              Powered by <span className="font-medium text-purple-500">SAG AI</span>
            </p>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative group flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full text-white font-semibold text-sm shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-gray-700 hover:bg-gray-800"
            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-200 hover:shadow-xl"
        }`}
        style={{ boxShadow: isOpen ? undefined : "0 8px 30px rgba(109,40,217,0.35)" }}
      >
        {/* Pulse ring when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-purple-500 opacity-30 animate-ping pointer-events-none" />
        )}
        <Sparkles className="w-4 h-4" />
        <span>{isOpen ? "Close" : "SAG AI"}</span>
        {hasUnread && !isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
            1
          </span>
        )}
      </button>
    </div>
  );
}
