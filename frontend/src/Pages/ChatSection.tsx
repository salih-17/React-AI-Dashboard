import { useState } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2 } from "lucide-react";

const TOOL_LABELS: Record<string, string> = {
  sql_db_list_tables: "جلب أسماء الجداول",
  sql_db_schema: "قراءة شكل الجدول",
  sql_db_query_checker: "التحقق من الاستعلام",
  sql_db_query: "تنفيذ الاستعلام",
};

export default function ChatSection() {
  const [messages, setMessages] = useState<
    {
      role: string;
      text: string;
      steps?: { tool: string; input: any }[];
    }[]
  >([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!question.trim()) return;
    setMessages((prev) => [...prev, { role: "user", text: question }]);
    setQuestion("");
    setLoading(true);
    const res = await axios.post(`http://localhost:8000/chat/?question=${question}`);
    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: res.data.answer,
        steps: res.data.steps,
      },
    ]);
    setLoading(false);
  }

  return (
    <Card className="shadow-sm h-full flex flex-col">
      <CardHeader className="border-b pb-4">
        <CardTitle className="text-lg font-bold">المساعد الذكي</CardTitle>
        <p className="text-xs text-gray-400">اسألني أي شيء عن مصاريفك</p>
      </CardHeader>

      <CardContent className="flex flex-col flex-1 gap-4 pt-4 overflow-hidden">
        <ScrollArea className="h-[500px]">
          <div className="flex flex-col gap-4 px-1">
            {messages.length === 0 && <p className="text-gray-400 text-center text-sm mt-10">لا توجد رسائل بعد 💬</p>}

            {messages.map((msg, i) => (
              <div key={i} className="flex flex-col gap-2">
                {/* الرسالة */}
                <div className={`flex ${msg.role === "user" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`px-4 py-2 rounded-2xl max-w-xs text-sm leading-relaxed
                    ${msg.role === "user" ? "bg-gray-100 text-gray-800" : "bg-black text-white"}`}
                  >
                    {msg.text}
                  </div>
                </div>

                {/* الخطوات */}
                {msg.steps && msg.steps.length > 0 && (
                  <div className="flex justify-end">
                    <div className="w-full max-w-sm">
                      <Accordion type="multiple" className="flex flex-col gap-1">
                        {msg.steps.map((step, j) => (
                          <AccordionItem key={j} value={`step-${i}-${j}`} className="border rounded-lg px-3 bg-gray-50">
                            <AccordionTrigger className="text-xs text-gray-500 hover:no-underline py-2">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 size={12} className="text-green-500 shrink-0" />
                                <span>{TOOL_LABELS[step.tool] || step.tool}</span>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="pb-2">
                              <pre className="text-xs text-gray-600 bg-white border rounded p-2 overflow-x-auto whitespace-pre-wrap">
                                {typeof step.input === "object" ? JSON.stringify(step.input, null, 2) : step.input}
                              </pre>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex flex-col gap-2 items-end">
                <div className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl text-sm">جاري التفكير...</div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <div className="w-2 h-2 rounded-full bg-gray-300 animate-pulse" />
                  <span>جاري تنفيذ الاستعلام</span>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2 items-end">
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
          <Button onClick={handleSend} disabled={loading} className="bg-black text-white hover:bg-gray-800">
            إرسال
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
