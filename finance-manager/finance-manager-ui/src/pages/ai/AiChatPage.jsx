import { useState, useRef, useEffect } from "react";
import {
  Send, Bot, User, Sparkles,
  TrendingUp, RefreshCw, Lightbulb,
} from "lucide-react";
import { aiApi } from "../../api/aiApi";

// ── constants ─────────────────────────────────────────────
const SUGGESTIONS = [
  "Tháng này tôi có đang chi tiêu quá nhiều không?",
  "Hãy phân tích tình hình tài chính của tôi",
  "Tôi nên tiết kiệm bao nhiêu mỗi tháng?",
  "Danh mục nào tôi chi nhiều nhất?",
  "Cho tôi lời khuyên để cải thiện tài chính",
];

const WELCOME_MESSAGE = {
  id:      1,
  role:    "bot",
  content: "Xin chào! Tôi là FinBot 🤖\n\n" +
           "Tôi có thể giúp bạn:\n" +
           "• Phân tích thu chi và số dư\n" +
           "• Đưa ra lời khuyên tiết kiệm\n" +
           "• Nhận xét về danh mục chi tiêu\n" +
           "• Dự đoán xu hướng tài chính\n\n" +
           "Hãy hỏi tôi bất cứ điều gì về tài chính của bạn!",
};

// ── Message bubble ────────────────────────────────────────
function MessageBubble({ msg }) {
  const isBot = msg.role === "bot";

  if (msg.type === "loading") {
    return (
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-full bg-primary-600
                        flex items-center justify-center shrink-0">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="bg-white border rounded-2xl rounded-tl-none
                        px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-primary-500 rounded-full
                             animate-bounce [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 bg-primary-500 rounded-full
                             animate-bounce [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 bg-primary-500 rounded-full
                             animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start gap-3
                     ${isBot ? "" : "flex-row-reverse"}`}>
      <div className={`h-8 w-8 rounded-full flex items-center
                       justify-center shrink-0 text-white
                       ${isBot ? "bg-primary-600" : "bg-gray-500"}`}>
        {isBot
          ? <Bot  className="h-4 w-4" />
          : <User className="h-4 w-4" />}
      </div>
      <div className={`max-w-[75%] px-4 py-3 rounded-2xl shadow-sm
                       text-sm leading-relaxed whitespace-pre-wrap
                       ${isBot
                         ? "bg-white border rounded-tl-none text-gray-800"
                         : "bg-primary-600 rounded-tr-none text-white"}`}>
        {msg.content}
        {isBot && msg.tokens && (
          <p className="text-xs text-gray-300 mt-2 pt-2
                        border-t border-gray-100">
            {msg.tokens.prompt + msg.tokens.completion} tokens
            {msg.model && ` · ${msg.model}`}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Suggestion chip ───────────────────────────────────────
function SuggestionChip({ text, onClick }) {
  return (
    <button onClick={() => onClick(text)}
      className="text-left px-3 py-2 bg-white border rounded-xl
                 text-xs text-gray-600 hover:bg-primary-50
                 hover:border-primary-300 hover:text-primary-700
                 transition-colors shadow-sm">
      {text}
    </button>
  );
}

// ── main page ─────────────────────────────────────────────
export default function AiChatPage({ toast }) {
  // initialise with welcome message directly — no useEffect needed
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [input,           setInput]           = useState("");
  const [sending,         setSending]         = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  // scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ── send message ───────────────────────────────────────
  const sendMessage = async (text) => {
    const content = (text ?? input).trim();
    if (!content || sending) return;

    setInput("");

    const userMsg = { id: Date.now(), role: "user", content };
    const loadingMsg = { id: Date.now() + 1, role: "bot", type: "loading" };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setSending(true);

    try {
      const res  = await aiApi.chat(content);
      const data = res.data.data;
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "loading"),
        {
          id:      Date.now(),
          role:    "bot",
          content: data.reply,
          tokens:  {
            prompt:     data.promptTokens     ?? 0,
            completion: data.completionTokens ?? 0,
          },
          model: data.model,
        },
      ]);
    } catch (err) {
      setMessages((prev) =>
        prev.filter((m) => m.type !== "loading")
      );
      const errMsg = err.response?.data?.message
        ?? "Không thể kết nối AI. Kiểm tra API key.";
      toast?.error(errMsg);
      setMessages((prev) => [...prev, {
        id: Date.now(), role: "bot",
        content: "❌ " + errMsg,
      }]);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // ── generate insights ──────────────────────────────────
  const generateInsights = async () => {
    setLoadingInsights(true);
    setMessages((prev) => [
      ...prev,
      {
        id:      Date.now() - 1,
        role:    "user",
        content: "📊 Hãy phân tích tài chính tổng quan của tôi",
      },
      { id: Date.now(), role: "bot", type: "loading" },
    ]);

    try {
      const res  = await aiApi.insights();
      const data = res.data.data;
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "loading"),
        {
          id:      Date.now(),
          role:    "bot",
          content: data.reply,
          tokens:  {
            prompt:     data.promptTokens     ?? 0,
            completion: data.completionTokens ?? 0,
          },
          model: data.model,
        },
      ]);
    } catch {
      setMessages((prev) =>
        prev.filter((m) => m.type !== "loading")
      );
      toast?.error("Không thể tạo phân tích. Kiểm tra API key.");
    } finally {
      setLoadingInsights(false);
    }
  };

  // ── clear chat ─────────────────────────────────────────
  const clearChat = () => {
    setMessages([{
      ...WELCOME_MESSAGE,
      id:      Date.now(),
      content: "Cuộc trò chuyện đã được làm mới. " +
               "Tôi có thể giúp gì cho bạn?",
    }]);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ── render ─────────────────────────────────────────────
  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-7rem)]
                    flex flex-col gap-4">

      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-primary-600 p-2.5 rounded-xl">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">FinBot AI</h1>
            <p className="text-xs text-gray-500">
              Trợ lý tài chính thông minh
            </p>
          </div>
          <span className="flex items-center gap-1.5 px-2.5 py-1
                           bg-green-50 border border-green-200
                           rounded-full text-xs text-green-700 font-medium">
            <span className="h-1.5 w-1.5 bg-green-500
                             rounded-full animate-pulse" />
            Online
          </span>
        </div>
        <div className="flex gap-2">
          <button onClick={generateInsights}
            disabled={loadingInsights || sending}
            className="btn-secondary flex items-center gap-2
                       text-xs px-3 py-2">
            {loadingInsights
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Sparkles   className="h-3.5 w-3.5" />}
            Phân tích nhanh
          </button>
          <button onClick={clearChat} disabled={sending}
            className="btn-secondary flex items-center gap-2
                       text-xs px-3 py-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Làm mới
          </button>
        </div>
      </div>

      {/* chat window */}
      <div className="flex-1 bg-gray-50 rounded-2xl border
                      overflow-hidden flex flex-col">

        {/* messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} msg={msg} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* suggestions — only on welcome screen */}
        {messages.length === 1 && (
          <div className="px-4 pb-3">
            <p className="text-xs text-gray-400 mb-2 flex
                          items-center gap-1">
              <Lightbulb className="h-3 w-3" />
              Gợi ý câu hỏi
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <SuggestionChip key={s} text={s}
                  onClick={sendMessage} />
              ))}
            </div>
          </div>
        )}

        {/* input bar */}
        <div className="border-t bg-white p-3">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={sending}
              placeholder="Nhập câu hỏi về tài chính... (Enter để gửi)"
              rows={1}
              className="flex-1 input resize-none min-h-[40px]
                         max-h-32 py-2.5 text-sm disabled:opacity-50"
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 128) + "px";
              }}
            />
            <button onClick={() => sendMessage()}
              disabled={!input.trim() || sending}
              className="btn-primary p-2.5 shrink-0
                         disabled:opacity-50 disabled:cursor-not-allowed">
              {sending
                ? <RefreshCw className="h-4 w-4 animate-spin" />
                : <Send       className="h-4 w-4" />}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            FinBot trả lời dựa trên dữ liệu giao dịch thực của bạn
          </p>
        </div>
      </div>

      {/* quick cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            icon:    <TrendingUp className="h-4 w-4 text-green-600" />,
            label:   "Phân tích thu chi",
            desc:    "Xem xu hướng tài chính",
            prompt:  "Phân tích thu nhập và chi tiêu của tôi",
          },
          {
            icon:    <Sparkles className="h-4 w-4 text-purple-600" />,
            label:   "Lời khuyên tiết kiệm",
            desc:    "Cách tối ưu chi tiêu",
            prompt:  "Cho tôi 3 lời khuyên cụ thể để tiết kiệm hơn",
          },
          {
            icon:    <Bot className="h-4 w-4 text-primary-600" />,
            label:   "Dự báo tài chính",
            desc:    "Xu hướng tháng tới",
            prompt:  "Dự báo tình hình tài chính tháng tới của tôi",
          },
        ].map((item) => (
          <button key={item.label}
            onClick={() => sendMessage(item.prompt)}
            disabled={sending}
            className="card p-3 text-left hover:shadow-md
                       hover:border-primary-200 transition-all
                       disabled:opacity-50 disabled:cursor-not-allowed
                       group">
            <div className="flex items-center gap-2 mb-1">
              {item.icon}
              <p className="text-xs font-semibold text-gray-700
                             group-hover:text-primary-700">
                {item.label}
              </p>
            </div>
            <p className="text-xs text-gray-400">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}