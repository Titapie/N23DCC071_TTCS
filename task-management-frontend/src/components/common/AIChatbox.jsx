import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Bot, User, AlertCircle, RefreshCw } from "lucide-react";
import { aiService } from "../../services/aiService";

export default function AIChatbox() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  const messagesEndRef = useRef(null);

  // Câu hỏi gợi ý nhanh
  const suggestions = [
    "Tôi có task nào sắp đến hạn chót?",
    "Hôm nay tôi nên ưu tiên task nào?",
    "Tóm tắt công việc của tôi hôm nay.",
    "Tôi đang quản lý những dự án nào?",
  ];

  // Tự động cuộn xuống dưới khi có tin nhắn mới
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Gửi tin nhắn
  const handleSend = async (textToSend) => {
    const messageText = textToSend || inputValue;
    if (!messageText.trim()) return;

    // Reset input và lỗi
    if (!textToSend) setInputValue("");
    setErrorMsg("");
    setIsLoading(true);

    // Thêm tin nhắn user vào danh sách
    const userMessage = { sender: "user", text: messageText, time: new Date() };
    setMessages((prev) => [...prev, userMessage]);

    try {
      const response = await aiService.sendMessage(messageText);
      if (response.success && response.reply) {
        // Thêm phản hồi của AI vào danh sách
        const aiMessage = { sender: "ai", text: response.reply, time: new Date() };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(response.message || "Không nhận được phản hồi hợp lệ từ AI.");
      }
    } catch (err) {
      console.error("Lỗi gửi tin nhắn AI:", err);
      setErrorMsg(err.message || "Lỗi kết nối máy chủ AI. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  // Nhấn Enter để gửi
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Chuyển đổi định dạng Markdown thô sang HTML đơn giản
  const renderMarkdown = (text) => {
    if (!text) return "";
    const lines = text.split("\n");
    return lines.map((line, index) => {
      let currentLine = line;
      // Bold: **text** -> <strong>text</strong>
      currentLine = currentLine.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      // Italic: *text* -> <em>text</em>
      currentLine = currentLine.replace(/\*(.*?)\*/g, "<em>$1</em>");
      
      // List item: "- text" hoặc "* text" -> <li>
      if (currentLine.trim().startsWith("- ")) {
        return (
          <li key={index} className="ml-4 list-disc mb-1" dangerouslySetInnerHTML={{ __html: currentLine.trim().substring(2) }} />
        );
      }
      if (currentLine.trim().startsWith("* ")) {
        return (
          <li key={index} className="ml-4 list-disc mb-1" dangerouslySetInnerHTML={{ __html: currentLine.trim().substring(2) }} />
        );
      }

      // Dòng trống
      if (currentLine.trim() === "") {
        return <div key={index} className="h-2" />;
      }

      return (
        <p key={index} className="mb-1 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: currentLine }} />
      );
    });
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* ===== KHUNG CHAT WINDOW ===== */}
      {isOpen && (
        <div className="w-[360px] sm:w-[385px] h-[520px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden mb-4 animate-in fade-in slide-in-from-bottom-6 duration-300">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 animate-pulse">
                <Sparkles size={18} className="text-yellow-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm tracking-wide">Trợ lý ảo AA</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
                  <span className="text-[10px] text-indigo-100 font-medium">Sẵn sàng hỗ trợ</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)} 
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              title="Đóng chatbox"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body - Tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F8FAFC] dark:bg-slate-950">
            {messages.length === 0 ? (
              // Trạng thái trống (Welcome Screen)
              <div className="h-full flex flex-col justify-center items-center text-center p-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-50 dark:bg-slate-800 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400 shadow-md">
                  <Bot size={32} className="animate-bounce-subtle" />
                </div>
                <h4 className="font-bold text-slate-800 dark:text-white text-base">Chào bạn! Em là trợ lý AI AA</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[280px] mt-1.5 leading-relaxed">
                  Em có thể giúp bạn tóm tắt công việc, kiểm tra tiến độ dự án, lọc ra task sắp quá hạn hoặc đề xuất công việc cần ưu tiên dựa vào vai trò của bạn.
                </p>

                {/* Danh sách gợi ý */}
                <div className="w-full mt-6 space-y-2">
                  <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 text-left uppercase tracking-wider px-1">Gợi ý câu hỏi:</p>
                  <div className="grid grid-cols-1 gap-2">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(suggestion)}
                        className="w-full text-left px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300 rounded-2xl text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm hover:shadow transition-all duration-200"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              // Danh sách tin nhắn thật
              <div className="space-y-4">
                {messages.map((msg, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start gap-2.5 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.sender === "ai" && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5 shadow-sm">
                        <Bot size={14} />
                      </div>
                    )}
                    <div 
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                        msg.sender === "user" 
                          ? "bg-indigo-600 text-white rounded-tr-none" 
                          : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-tl-none"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <p>{msg.text}</p>
                      ) : (
                        <div className="prose dark:prose-invert max-w-none">
                          {renderMarkdown(msg.text)}
                        </div>
                      )}
                    </div>
                    {msg.sender === "user" && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                        <User size={14} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* AI Loading State (Typing Indicator) */}
            {isLoading && (
              <div className="flex items-start gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shrink-0 mt-0.5">
                  <Bot size={14} />
                </div>
                <div className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700/50 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-indigo-400 dark:bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2.5 h-2.5 bg-indigo-500 dark:bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2.5 h-2.5 bg-indigo-600 dark:bg-indigo-700 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}

            {/* Error Message Box */}
            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 p-3 rounded-2xl flex items-start gap-2 text-xs">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-500" />
                <div>
                  <p className="font-semibold">Đã xảy ra lỗi</p>
                  <p className="mt-0.5 leading-relaxed">{errorMsg}</p>
                  <button 
                    onClick={() => handleSend()} 
                    className="mt-2 flex items-center gap-1 font-bold text-red-600 hover:text-red-500 hover:underline"
                  >
                    <RefreshCw size={12} />
                    <span>Thử lại</span>
                  </button>
                </div>
              </div>
            )}

            {/* Trỏ cuộn */}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer - Ô nhập liệu */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-2 items-center">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Hỏi trợ lý ảo AA..."
              rows={1}
              disabled={isLoading}
              className="flex-1 resize-none bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-3.5 py-2 text-xs text-slate-850 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all leading-relaxed max-h-[72px]"
            />
            <button
              onClick={() => handleSend()}
              disabled={isLoading || !inputValue.trim()}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl hover:shadow-lg disabled:opacity-50 disabled:hover:shadow-none transition-all cursor-pointer shrink-0"
              title="Gửi câu hỏi"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ===== FLOATING ACTION BUTTON ===== */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-gradient-to-tr from-indigo-600 to-purple-600 text-white rounded-full flex items-center justify-center shadow-xl hover:shadow-2xl hover:-translate-y-0.5 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer animate-bounce-subtle"
        title={isOpen ? "Đóng trợ lý AI" : "Trò chuyện với trợ lý AI AA"}
      >
        {isOpen ? <X size={24} /> : <Sparkles size={24} className="text-yellow-300" />}
      </button>
    </div>
  );
}
