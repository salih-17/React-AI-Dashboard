import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; text: string }[]>([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!question.trim()) return;

    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setQuestion("");
    setLoading(true);

    const res = await axios.post(`http://localhost:8000/chat/?question=${question}`);
    setMessages((prev) => [...prev, { role: "ai", text: res.data.answer }]);
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-md border flex flex-col h-150">
      {/* العنوان */}
      <div className="border-b p-4">
        <h2 className="font-bold text-gray-800">🤖 المساعد الذكي</h2>
        <p className="text-xs text-gray-400">اسألني أي شيء عن مصاريفك</p>
      </div>

      {/* الرسائل */}
      <ScrollArea className="flex-1 p-4">
        <div className="flex flex-col gap-4">
          {messages.length === 0 && <p className="text-gray-400 text-center mt-20">اسألني أي شيء عن مصاريفك 💬</p>}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
              <div
                className={`px-4 py-2 rounded-2xl max-w-sm text-sm leading-relaxed
                ${msg.role === "user" ? "bg-gray-100 text-gray-800" : "bg-indigo-500 text-white"}`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-end">
              <div className="bg-indigo-100 text-indigo-500 px-4 py-2 rounded-2xl text-sm">جاري التفكير...</div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* الإدخال */}
      <div className="border-t p-4 flex gap-2 items-end">
        <Textarea
          className="flex-1 resize-none text-sm"
          placeholder="اكتب سؤالك هنا..."
          rows={2}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <Button onClick={handleSend} disabled={loading}>
          إرسال
        </Button>
      </div>
    </div>
  );
}
