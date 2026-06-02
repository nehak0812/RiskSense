"use client";

import React, { useState, useRef, useEffect } from "react";
import { Icon } from "./SharedUI";

function renderMd(text: string) {
  const inline = (str: string) =>
    str
      .split(/(\*\*[^*]+\*\*)/g)
      .map((p, i) =>
        p.startsWith("**") && p.endsWith("**") ? (
          <strong key={i}>{p.slice(2, -2)}</strong>
        ) : (
          <React.Fragment key={i}>{p}</React.Fragment>
        )
      );

  const lines = (text || "").split("\n");
  const out: React.ReactNode[] = [];
  let list: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  const flush = () => {
    if (list.length > 0) {
      out.push(
        listType === "ul" ? (
          <ul key={"l" + out.length} style={{ paddingLeft: 16, margin: "6px 0" }}>
            {list}
          </ul>
        ) : (
          <ol key={"l" + out.length} style={{ paddingLeft: 16, margin: "6px 0" }}>
            {list}
          </ol>
        )
      );
      list = [];
      listType = null;
    }
  };

  lines.forEach((raw, idx) => {
    const l = raw.trim();
    if (!l) {
      flush();
      return;
    }
    const h = l.match(/^#{1,4}\s+(.*)/);
    if (h) {
      flush();
      out.push(
        <div key={idx} style={{ fontWeight: 600, marginTop: out.length ? 7 : 0, marginBottom: 3 }}>
          {inline(h[1])}
        </div>
      );
      return;
    }
    const b = l.match(/^[-•]\s+(.*)/);
    if (b) {
      if (listType !== "ul") {
        flush();
        listType = "ul";
      }
      list.push(<li key={idx}>{inline(b[1])}</li>);
      return;
    }
    const n = l.match(/^\d+[.)]\s+(.*)/);
    if (n) {
      if (listType !== "ol") {
        flush();
        listType = "ol";
      }
      list.push(<li key={idx}>{inline(n[1])}</li>);
      return;
    }
    flush();
    out.push(<p key={idx} style={{ marginBottom: 6 }}>{inline(l)}</p>);
  });
  flush();
  return out;
}

const PROMPTS_ORG = [
  "What's my biggest emerging risk this quarter?",
  "How does the new tariff news affect us?",
  "Compare us to our peers on cyber & AI risk.",
  "Which appetite breaches need Board attention?",
];

const PROMPTS_WORLD = [
  "What are the dominant emerging themes this week?",
  "Summarise the sanctions & tariff signals.",
  "Which risks are escalating fastest?",
];

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  org: any | null;
  onCiteClick: (c: string) => void;
}

export default function ChatPanel({ open, onClose, org, onCiteClick }: ChatPanelProps) {
  const [messages, setMessages] = useState<Array<{ role: "user" | "ai"; content: string; cites?: string[] }>>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages, busy]);

  useEffect(() => {
    if (open && taRef.current) {
      setTimeout(() => taRef.current?.focus(), 320);
    }
  }, [open]);

  const greeting = org
    ? `I'm tracking **${org.name}**'s exposure across this week's signals. Ask me about your emerging risks, peer position, or how a specific event affects you.`
    : `I'm monitoring this week's global risk signals across all eight domains. Ask me about the dominant themes — or select an organisation for tailored analysis.`;

  const send = async (text?: string) => {
    const q = (text || input).trim();
    if (!q || busy) return;
    setInput("");
    setBusy(true);

    const nextMessages = [...messages, { role: "user" as const, content: q }];
    setMessages(nextMessages);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages,
          orgId: org?.id || undefined,
        }),
      });

      if (!res.ok) throw new Error("Chat request failed");
      const data = await res.json();

      let body = data.reply || "";
      let cites: string[] = [];
      const m = body.match(/SOURCES:\s*(.+)\s*$/i);
      if (m) {
        cites = m[1]
          .split(/[;,]/)
          .map((s: string) => s.trim())
          .filter(Boolean)
          .slice(0, 4);
        body = body.slice(0, m.index).trim();
      }

      setMessages((ms) => [...ms, { role: "ai", content: body, cites }]);
    } catch (e) {
      console.error(e);
      setMessages((ms) => [
        ...ms,
        {
          role: "ai",
          content: "I couldn't reach the analysis service just now. Please try again in a moment.",
          cites: [],
        },
      ]);
    } finally {
      setBusy(false);
    }
  };

  const prompts = org ? PROMPTS_ORG : PROMPTS_WORLD;

  return (
    <React.Fragment>
      <div className={`chat-scrim ${open ? "open" : ""}`} onClick={onClose}></div>
      <aside className={`chat-panel ${open ? "open" : ""}`}>
        <div className="chat-inner">
          <div className="chat-head">
            <div className="ch-ico">
              <Icon name="chat" size={18} color="#fff" />
            </div>
            <div style={{ flex: 1 }}>
              <div className="chat-title">Risk Intelligence</div>
              <div className="chat-ctx">
                <span className="dot"></span>
                {org ? `Context: ${org.name}` : "Context: The World"}
              </div>
            </div>
            <button className="nav-icon-btn" onClick={onClose} style={{ width: 30, height: 30 }}>
              <Icon name="close" size={16} />
            </button>
          </div>

          <div className="chat-body" ref={bodyRef}>
            <div className="chat-msg ai">
              <div className="msg-av ai">RL</div>
              <div className="msg-bubble">{renderMd(greeting)}</div>
            </div>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                <div className={`msg-av ${m.role === "user" ? "user" : "ai"}`}>
                  {m.role === "user" ? "You" : "RL"}
                </div>
                <div className="msg-bubble">
                  {m.role === "ai" ? renderMd(m.content) : m.content}
                  {m.cites && m.cites.length > 0 && (
                    <div className="msg-cites">
                      {m.cites.map((c, j) => (
                        <span key={j} className="msg-cite" onClick={() => onCiteClick(c)}>
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="chat-msg ai">
                <div className="msg-av ai">RL</div>
                <div className="msg-bubble">
                  <div className="chat-typing">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {messages.length === 0 && (
            <div className="chat-prompts">
              {prompts.map((p, i) => (
                <button key={i} className="chat-prompt" onClick={() => send(p)}>
                  {p}
                </button>
              ))}
            </div>
          )}

          <div className="chat-input-wrap">
            <div className="chat-input-box">
              <textarea
                ref={taRef}
                rows={1}
                placeholder={org ? `Ask about ${org.name}'s risks…` : "Ask about this week’s risks…"}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 90) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
              />
              <button
                className="chat-send"
                disabled={!input.trim() || busy}
                onClick={() => send()}
              >
                <Icon name="send" size={15} color="#fff" />
              </button>
            </div>
            <div className="chat-disclaimer">
              RiskLens Assistant can make mistakes. Verify material decisions against primary sources.
            </div>
          </div>
        </div>
      </aside>
    </React.Fragment>
  );
}
