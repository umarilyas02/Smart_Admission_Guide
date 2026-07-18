"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, ChevronDown, Bot, Lock, Database, Globe, User } from "lucide-react";

const WELCOME_MSG = {
  id: "welcome",
  role: "assistant",
  text: "Hello! I'm **SAG AI**, your smart admission guide.\n\nI can help you with:\n• University merits & eligibility\n• Scholarships & fees\n• Program & campus info\n\nEach answer shows both our **verified database** and a **broader web perspective**.",
};

const STORAGE_PREFIX = "sag_chat_history_";
const MAX_STORED_MESSAGES = 60;

function loadStoredMessages(userId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : null;
  } catch {
    return null;
  }
}

function saveStoredMessages(userId, messages) {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${userId}`,
      JSON.stringify(messages.slice(-MAX_STORED_MESSAGES))
    );
  } catch {
    // storage full or unavailable — non-fatal
  }
}

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

function parseText(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={i}>{p.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{p}</span>
    )
  );
}

function renderLines(text) {
  return (text || "").split("\n").map((line, i) => (
    <p key={i} className={line === "" ? "h-2" : ""}>
      {parseText(line)}
    </p>
  ));
}

function DualMessageBubble({ msg }) {
  const [activeTab, setActiveTab] = useState("db");
  const hasWeb = !!msg.webText;
  const currentText = activeTab === "db" ? msg.dbText : msg.webText;

  return (
    <div className="flex gap-2 justify-start mb-4">
      {/* Bot avatar */}
      <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow">
        <Bot className="w-3.5 h-3.5 text-white" />
      </div>

      <div className="max-w-[84%] flex flex-col gap-1.5">
        {/* Tab switcher — only shown when both responses exist */}
        {hasWeb && (
          <div className="flex gap-0.5 bg-gray-100 rounded-lg p-0.5 shadow-inner">
            <button
              onClick={() => setActiveTab("db")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all duration-200 ${
                activeTab === "db"
                  ? "bg-white text-purple-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Database className="w-3 h-3" />
              Our Database
            </button>
            <button
              onClick={() => setActiveTab("web")}
              className={`flex-1 flex items-center justify-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-semibold transition-all duration-200 ${
                activeTab === "web"
                  ? "bg-white text-blue-700 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Globe className="w-3 h-3" />
              From Web
            </button>
          </div>
        )}

        {/* Message card */}
        <div
          className={`rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-sm border transition-colors duration-200 ${
            activeTab === "db"
              ? "bg-white border-purple-100 text-gray-700"
              : "bg-blue-50 border-blue-200 text-gray-700"
          }`}
        >
          {/* Source label */}
          <div
            className={`flex items-center gap-1.5 text-xs font-semibold mb-2.5 pb-2 border-b ${
              activeTab === "db"
                ? "text-purple-600 border-purple-100"
                : "text-blue-600 border-blue-200"
            }`}
          >
            {activeTab === "db" ? (
              <>
                <Database className="w-3 h-3" />
                Verified — from our live database
              </>
            ) : (
              <>
                <Globe className="w-3 h-3" />
                Broader context — verify with university
              </>
            )}
          </div>

          {renderLines(currentText)}

          {msg.time && (
            <p className="text-xs mt-2 text-gray-400">{msg.time}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }) {
  if (msg.isDual) return <DualMessageBubble msg={msg} />;

  const isUser = msg.role === "user";

  return (
    <div className={`flex gap-2 ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 mt-0.5 shadow">
          <Bot className="w-3.5 h-3.5 text-white" />
        </div>
      )}
      <div
        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
          isUser
            ? "bg-linear-to-br from-purple-600 to-indigo-600 text-white rounded-tr-sm"
            : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm"
        }`}
      >
        {(msg.text || "").split("\n").map((line, i) => (
          <p key={i} className={line === "" ? "h-2" : ""}>
            {parseText(line)}
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

function LoginGate() {
  return (
    <div className="p-4 bg-purple-50 border-t border-purple-100 flex flex-col items-center gap-3 text-center">
      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
        <Lock className="w-5 h-5 text-purple-600" />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-800">Chat Requires Login</p>
        <p className="text-xs text-gray-500 mt-1">Sign in to chat with SAG AI and get personalized admission guidance.</p>
      </div>
      <div className="flex gap-2 w-full">
        <a
          href="/auth?mode=login"
          className="flex-1 text-sm text-center bg-white border border-purple-300 text-purple-700 py-2 rounded-xl font-medium hover:bg-purple-50 transition"
        >
          Log in
        </a>
        <a
          href="/auth?mode=register"
          className="flex-1 text-sm text-center bg-linear-to-r from-purple-600 to-indigo-600 text-white py-2 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition"
        >
          Sign up
        </a>
      </div>
    </div>
  );
}

function ProfileCard({ profile }) {
  if (!profile) return null;

  const { user, student } = profile;
  return (
    <div className="p-3 bg-purple-50 border-t border-purple-100 text-xs space-y-2">
      <div className="flex items-center gap-2">
        <User className="w-4 h-4 text-purple-600 shrink-0" />
        <span className="font-semibold text-gray-800">{user?.name || "User"}</span>
      </div>
      {student?.academic_level && (
        <div className="text-gray-600">
          <span className="font-medium">Stream:</span> {student.academic_level.toUpperCase().replace(/_/g, " ")}
        </div>
      )}
      {student?.intermediate_marks && (
        <div className="text-gray-600">
          <span className="font-medium">Score:</span> {student.intermediate_marks}%
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [storageKey, setStorageKey] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/check");
        const data = await res.json();
        if (data.authenticated) {
          setIsLoggedIn(true);
          fetchUserProfile();
        } else {
          setIsLoggedIn(false);
          setUserProfile(null);
          setStorageKey(null);
          setMessages([WELCOME_MSG]);
        }
      } catch {
        setIsLoggedIn(false);
        setUserProfile(null);
        setStorageKey(null);
        setMessages([WELCOME_MSG]);
      }
    };
    checkAuth();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const res = await fetch("/api/profile", {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setUserProfile(data);
        const userId = data?.user?.id;
        if (userId) {
          const stored = loadStoredMessages(userId);
          setMessages(stored || [WELCOME_MSG]);
          setStorageKey(userId);
        }
      }
    } catch {
      console.error("Failed to fetch profile");
    }
  };

  // Persist the conversation for this user so it survives reloads/restarts
  useEffect(() => {
    if (!storageKey) return;
    saveStoredMessages(storageKey, messages);
  }, [messages, storageKey]);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-chatbot", handler);
    return () => window.removeEventListener("open-chatbot", handler);
  }, []);

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

  // Build conversation history for the API — use DB text for assistant turns (more accurate)
  const buildHistory = (msgs) =>
    msgs
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role,
        content: m.isDual ? (m.dbText || m.text || "") : (m.text || ""),
      }));

  const handleSend = async () => {
    const text = input.trim();
    if (!text || text.length > 500 || isTyping || !isLoggedIn) return;

    const userMsg = { id: Date.now(), role: "user", text, time: getTime() };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ messages: buildHistory(updatedMsgs) }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to get response");
      }

      const dbText = data.dbResponse || data.message || "Sorry, something went wrong.";
      const webText = data.webResponse || null;
      const isDual = !!webText && webText !== dbText;

      const botMsg = {
        id: Date.now() + 1,
        role: "assistant",
        isDual,
        dbText,
        webText: isDual ? webText : null,
        text: dbText,
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
      if (input.trim() && input.trim().length <= 500) handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat window */}
      {isOpen && (
        <div
          className="bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          style={{ width: "400px", height: "560px", boxShadow: "0 20px 60px rgba(109,40,217,0.15)" }}
        >
          {/* Header */}
          <div className="bg-linear-to-r from-purple-600 to-indigo-600 p-4 flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-base tracking-tight">SAG AI</p>
                <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-medium shrink-0">
                  Beta
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse shrink-0" />
                <p className="text-purple-200 text-xs truncate">Smart Admission Guide AI</p>
              </div>
            </div>
            {/* Dual-source indicator */}
            <div className="flex items-center gap-1 shrink-0 bg-white/10 rounded-lg px-2 py-1">
              <Database className="w-3 h-3 text-white/80" />
              <span className="text-white/60 text-xs">+</span>
              <Globe className="w-3 h-3 text-white/80" />
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition p-1 rounded-lg hover:bg-white/10 shrink-0"
            >
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 bg-linear-to-b from-gray-50 to-white">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} msg={msg} />
            ))}
            {isTyping && (
              <div className="flex gap-2 justify-start mb-3">
                <div className="w-7 h-7 rounded-full bg-linear-to-br from-purple-500 to-indigo-600 flex items-center justify-center shrink-0 shadow">
                  <Bot className="w-3.5 h-3.5 text-white" />
                </div>
                <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm">
                  <TypingDots />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Login gate or profile + input */}
          {!isLoggedIn ? (
            <LoginGate />
          ) : (
            <>
              <ProfileCard profile={userProfile} />
              <div className="p-3 bg-white border-t border-gray-100 shrink-0">
                <div className="flex items-end gap-2 bg-gray-50 rounded-xl border border-gray-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-100 transition p-1 pl-3">
                  <textarea
                    ref={inputRef}
                    rows={1}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    maxLength={500}
                    onKeyDown={handleKey}
                    placeholder="Ask about admissions..."
                    className="flex-1 bg-transparent text-sm text-gray-700 resize-none focus:outline-none py-1.5 placeholder-gray-400 max-h-24"
                    style={{ lineHeight: "1.5" }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || input.trim().length > 500 || isTyping}
                    className="w-8 h-8 rounded-lg bg-linear-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white disabled:opacity-40 hover:from-purple-700 hover:to-indigo-700 transition shrink-0 mb-0.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-1.5">
                  Powered by <span className="font-medium text-purple-500">SAG AI</span>
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative group flex items-center gap-2.5 pl-4 pr-5 py-3 rounded-full text-white font-semibold text-sm shadow-lg transition-all duration-300 ${
          isOpen
            ? "bg-gray-700 hover:bg-gray-800"
            : "bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-purple-200 hover:shadow-xl"
        }`}
        style={{ boxShadow: isOpen ? undefined : "0 8px 30px rgba(109,40,217,0.35)" }}
      >
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
