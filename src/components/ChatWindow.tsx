import { useState, FormEvent } from "react";
import { supabase } from "../supabaseClient";

type Message = { sender: "user" | "bot"; text: string };

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const sendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // add user message
    setMessages((m) => [...m, { sender: "user", text: input }]);

    // call your Edge Function
    const { data, error } = await supabase.functions.invoke(
      "handle-chat",
      {
        body: JSON.stringify({ messageText: input }),
      }
    );

    if (error) {
      console.error("Function error:", error);
      setMessages((m) => [
        ...m,
        { sender: "bot", text: "❌ Something went wrong." },
      ]);
    } else {
      setMessages((m) => [
        ...m,
        { sender: "bot", text: data.reply as string },
      ]);
    }

    setInput("");
  };

  return (
    <div style={{ maxWidth: 500, margin: "0 auto" }}>
      <div
        style={{
          height: 400,
          overflowY: "auto",
          border: "1px solid #ccc",
          padding: 10,
          marginBottom: 10,
        }}
      >
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              textAlign: m.sender === "user" ? "right" : "left",
              margin: "5px 0",
            }}
          >
            <strong>{m.sender === "user" ? "You" : "Bot"}:</strong>{" "}
            {m.text}
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex" }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message…"
          style={{ flex: 1, padding: "8px" }}
        />
        <button type="submit" style={{ marginLeft: 8 }}>
          Send
        </button>
      </form>
    </div>
  );
}