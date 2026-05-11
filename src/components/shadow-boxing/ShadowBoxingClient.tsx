"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { handleUnauthorized } from "@/lib/auth-redirect";
import { PersonaLevel, TEXT_LEVELS, VOICE_LEVELS } from "@/config/shadow-boxing";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const LOCALE_TO_SPEECH_LANG: Record<string, string> = {
  pl: "pl-PL", en: "en-US", de: "de-DE", fr: "fr-FR",
  es: "es-ES", it: "it-IT", pt: "pt-PT", nl: "nl-NL",
  cs: "cs-CZ", uk: "uk-UA",
};

interface Props {
  userCredits: number;
  isAdmin: boolean;
  locale: string;
  userEmail?: string | null;
}

type Mode = "select" | "text" | "voice";
type Phase = "idle" | "brief" | "battle" | "feedback";

const DIFF_COLOR: Record<string, string> = {
  "Łatwy": "#0D9E68",
  "Średni": "#C97E0A",
  "Trudny": "#C93B3B",
};

export function ShadowBoxingClient({ userCredits, isAdmin, locale, userEmail }: Props) {
  const t = useTranslations("shadowBoxing");
  const router = useRouter();
  const isGuest = !userEmail;

  const personaNames = ["p1name","p2name","p3name","p4name","p5name","p6name","p7name","p8name","p9name"] as const;
  const personaDescs = ["p1desc","p2desc","p3desc","p4desc","p5desc","p6desc","p7desc","p8desc","p9desc"] as const;
  const personaGoals = ["p1goal","p2goal","p3goal","p4goal","p5goal","p6goal","p7goal","p8goal","p9goal"] as const;

  const textLevels: PersonaLevel[] = TEXT_LEVELS.map((l, i) => ({
    ...l,
    name: t(personaNames[i]),
    description: t(personaDescs[i]),
    goal: t(personaGoals[i]),
  }));
  const voiceLevels: PersonaLevel[] = VOICE_LEVELS.map((l, i) => ({
    ...l,
    name: t(personaNames[TEXT_LEVELS.length + i]),
    description: t(personaDescs[TEXT_LEVELS.length + i]),
    goal: t(personaGoals[TEXT_LEVELS.length + i]),
  }));
  const speechLang = LOCALE_TO_SPEECH_LANG[locale] ?? "pl-PL";
  const [mode, setMode] = useState<Mode>("select");
  const [phase, setPhase] = useState<Phase>("idle");
  const [selectedLevel, setSelectedLevel] = useState<PersonaLevel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [aiStreaming, setAiStreaming] = useState(false);
  const [credits, setCredits] = useState(userCredits);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const [voiceListening, setVoiceListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [speaking, setSpeaking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<Message[]>([]);
  const selectedLevelRef = useRef<PersonaLevel | null>(null);
  const modeRef = useRef<Mode>("select");

  useEffect(() => { messagesRef.current = messages; }, [messages]);
  useEffect(() => { selectedLevelRef.current = selectedLevel; }, [selectedLevel]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function diffLabel(diff: string) {
    if (diff === "Łatwy") return t("easy");
    if (diff === "Średni") return t("medium");
    if (diff === "Trudny") return t("hard");
    return diff;
  }

  function selectLevel(level: PersonaLevel, selectedMode: Mode) {
    if (isGuest) {
      window.location.href = "/pl/login";
      return;
    }
    setSelectedLevel(level);
    setMode(selectedMode);
    setMessages([]);
    setPhase("brief");
  }

  function startBattle() {
    setPhase("battle");
  }

  async function fetchAiReply(msgs: Message[], systemPrompt: string, selectedMode: Mode, levelNum = 1): Promise<string> {
    setAiStreaming(true);
    let result = "";
    try {
      const res = await fetch("/api/shadow-boxing/battle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgs, personaPrompt: systemPrompt, mode: selectedMode, level: levelNum, locale }),
      });
      if (handleUnauthorized(res, router)) return "";
      if (!res.ok) {
        console.error("[fetchAiReply] HTTP", res.status);
        return "";
      }
      const reader = res.body?.getReader();
      if (!reader) return "";
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        result += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return [...prev.slice(0, -1), { ...last, content: result }];
          }
          return [...prev, { role: "assistant", content: result }];
        });
      }
    } catch (err) {
      console.error("[fetchAiReply]", err);
    } finally {
      setAiStreaming(false);
    }
    return result;
  }

  async function sendMessage(text: string, fromVoice = false) {
    const level = fromVoice ? selectedLevelRef.current : selectedLevel;
    const currentMode = fromVoice ? modeRef.current : mode;
    const currentMessages = fromVoice ? messagesRef.current : messages;
    if (!text.trim() || !level || aiStreaming) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const newMessages = [...currentMessages, userMsg];
    setMessages(newMessages);
    setInput("");

    const apiMessages = newMessages.map((m) => ({ role: m.role, content: m.content }));
    const reply = await fetchAiReply(apiMessages, level.systemPrompt, currentMode, level.level);

    if (currentMode === "voice" && reply) {
      speakText(reply);
    }
  }

  async function endBattle() {
    if (!selectedLevel || messages.length < 2) return;
    setLoadingFeedback(true);
    try {
      const transcript = messages.map((m) => `${m.role === "user" ? "Handlowiec" : selectedLevel.name}: ${m.content}`).join("\n\n");
      const res = await fetch("/api/shadow-boxing/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          personaName: selectedLevel.name,
          level: selectedLevel.level,
          mode,
          locale,
        }),
      });
      if (handleUnauthorized(res, router)) return;

      let data: { feedback?: string; error?: string } = {};
      try { data = await res.json(); } catch { data = { error: "Błąd parsowania odpowiedzi serwera" }; }

      if (!res.ok) { alert(data.error ?? "Błąd serwera"); return; }
      setFeedback(data.feedback ?? "Brak feedbacku.");
      if (!isAdmin) setCredits((c) => c - 10);
      setShowFeedbackModal(true);
    } catch (err) {
      console.error("[endBattle]", err);
      alert("Błąd połączenia z serwerem.");
    } finally {
      setLoadingFeedback(false);
    }
  }

  function speakText(text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = speechLang;
    utter.rate = 0.95;
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => { setSpeaking(false); startListening(); };
    window.speechSynthesis.speak(utter);
  }

  function startListening() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SRClass = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SRClass) return;
    const rec = new SRClass();
    rec.lang = speechLang;
    rec.continuous = false;
    rec.interimResults = true;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const transcript = Array.from(e.results).map((r: any) => r[0].transcript).join("");
      setVoiceTranscript(transcript);
      if (e.results[e.results.length - 1].isFinal) {
        sendMessage(transcript, true);
        setVoiceTranscript("");
      }
    };
    rec.onend = () => setVoiceListening(false);
    rec.onerror = () => setVoiceListening(false);
    recognitionRef.current = rec;
    rec.start();
    setVoiceListening(true);
  }

  function stopListening() {
    recognitionRef.current?.stop();
    setVoiceListening(false);
  }

  function resetAll() {
    window.speechSynthesis?.cancel();
    stopListening();
    setMode("select");
    setPhase("idle");
    setSelectedLevel(null);
    setMessages([]);
    setInput("");
    setFeedback(null);
    setShowFeedbackModal(false);
  }

  // ============ SELECT MODE ============
  if (mode === "select") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(201,59,59,0.12) 0%, rgba(26,107,221,0.08) 100%)",
          borderBottom: "1px solid var(--border)",
          padding: "32px 40px 28px",
        }}>
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h1 style={{ fontFamily: "var(--font-syne)", fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
              {t("title")}
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15, marginBottom: 12 }}>
              {t("subtitle")}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
              <span style={{
                background: "rgba(42,127,255,0.1)", border: "1px solid rgba(42,127,255,0.3)",
                borderRadius: 8, padding: "5px 12px", fontSize: 13, color: "var(--accent-bright)",
                fontFamily: "var(--font-jetbrains-mono)",
              }}>
                💎 {isAdmin ? "∞" : credits}
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: 13 }}>{t("creditsPerSession")}</span>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 36 }}>
            <ModeCard
              emoji="💬"
              title={t("textMode")}
              subtitle={t("textModeSub")}
              description={t("textModeDesc")}
              onClick={() => {
                if (isGuest) {
                  window.location.href = "/pl/login";
                } else {
                  setMode("text");
                }
              }}
              disabled={isGuest}
            />
            <ModeCard
              emoji="🎤"
              title={t("voiceMode")}
              subtitle={t("voiceModeSub")}
              description={t("voiceModeDesc")}
              onClick={() => {
                if (isGuest) {
                  window.location.href = "/pl/login";
                } else {
                  setMode("voice");
                }
              }}
              disabled={isGuest}
            />
          </div>
        </div>
      </div>
    );
  }

  // ============ LEVEL SELECT ============
  const levels = mode === "text" ? textLevels : voiceLevels;

  if (phase === "idle") {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 40px" }}>
          <button onClick={resetAll} style={backBtnStyle}>{t("back")}</button>
          <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 24, fontWeight: 700, margin: "20px 0 8px" }}>
            {mode === "text" ? `💬 ${t("textMode")}` : `🎤 ${t("voiceMode")}`} — {t("chooseLevel")}
          </h2>
          <p style={{ color: "var(--text-muted)", marginBottom: 28, fontSize: 14 }}>{t("costPerSession")}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {levels.map((l) => (
              <div
                key={l.level}
                onClick={() => {
                  if (isGuest) {
                    window.location.href = "/pl/login";
                  } else {
                    selectLevel(l, mode);
                  }
                }}
                style={{
                  background: "var(--bg-card)", border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg)", padding: "18px 22px",
                  cursor: isGuest ? "not-allowed" : "pointer",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", gap: 16,
                  opacity: isGuest ? 0.6 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!isGuest) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border-bright)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateX(4px)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isGuest) {
                    (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
                  }
                }}
              >
                <div style={{
                  width: 48, height: 48, borderRadius: "50%",
                  background: `${DIFF_COLOR[l.difficulty]}20`,
                  border: `2px solid ${DIFF_COLOR[l.difficulty]}60`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 22, flexShrink: 0,
                }}>
                  {l.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{l.name}</span>
                    <span style={{
                      background: `${DIFF_COLOR[l.difficulty]}20`,
                      border: `1px solid ${DIFF_COLOR[l.difficulty]}50`,
                      borderRadius: 5, padding: "1px 8px",
                      fontSize: 11, color: DIFF_COLOR[l.difficulty],
                    }}>{diffLabel(l.difficulty)}</span>
                    <span style={{
                      background: "rgba(42,127,255,0.08)", border: "1px solid rgba(42,127,255,0.2)",
                      borderRadius: 5, padding: "1px 8px",
                      fontSize: 11, color: "var(--accent-bright)",
                      fontFamily: "var(--font-jetbrains-mono)",
                    }}>{t("lvl")} {l.level}</span>
                  </div>
                  <p style={{ color: "var(--text-secondary)", fontSize: 13, margin: 0 }}>{l.description}</p>
                </div>
                <span style={{ color: "var(--text-muted)", fontSize: 20 }}>→</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ============ BRIEF SCREEN ============
  if (phase === "brief" && selectedLevel) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ maxWidth: 560, width: "100%" }}>
          <button onClick={() => setPhase("idle")} style={{ ...backBtnStyle, marginBottom: 28 }}>{t("back")}</button>

          {/* Persona card */}
          <div style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-bright)",
            borderRadius: "var(--radius-xl)",
            padding: 32,
            marginBottom: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
              <div style={{
                width: 64, height: 64, borderRadius: "50%",
                background: `${DIFF_COLOR[selectedLevel.difficulty]}20`,
                border: `3px solid ${DIFF_COLOR[selectedLevel.difficulty]}60`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 30, flexShrink: 0,
              }}>
                {selectedLevel.emoji}
              </div>
              <div>
                <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>
                  {selectedLevel.name}
                </h2>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{
                    background: `${DIFF_COLOR[selectedLevel.difficulty]}20`,
                    border: `1px solid ${DIFF_COLOR[selectedLevel.difficulty]}50`,
                    borderRadius: 5, padding: "2px 8px",
                    fontSize: 11, color: DIFF_COLOR[selectedLevel.difficulty],
                  }}>{diffLabel(selectedLevel.difficulty)}</span>
                  <span style={{
                    background: mode === "voice" ? "rgba(201,59,59,0.1)" : "rgba(42,127,255,0.1)",
                    border: `1px solid ${mode === "voice" ? "rgba(201,59,59,0.3)" : "rgba(42,127,255,0.3)"}`,
                    borderRadius: 5, padding: "2px 8px",
                    fontSize: 11, color: mode === "voice" ? "var(--danger)" : "var(--accent-bright)",
                  }}>{mode === "voice" ? t("voiceTag") : t("textTag")}</span>
                </div>
              </div>
            </div>

            <p style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
              {selectedLevel.description}
            </p>

            {/* Goal */}
            <div style={{
              background: "rgba(42,127,255,0.06)",
              border: "1px solid rgba(42,127,255,0.2)",
              borderRadius: "var(--radius-md)",
              padding: "14px 18px",
              marginBottom: 8,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--accent-bright)", letterSpacing: "0.08em", marginBottom: 6 }}>
                {t("yourGoal")}
              </div>
              <p style={{ fontSize: 14, color: "var(--text-primary)", lineHeight: 1.5, margin: 0 }}>
                {selectedLevel.goal}
              </p>
            </div>
          </div>

          {/* Tips */}
          <div style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-md)",
            padding: "14px 18px",
            marginBottom: 24,
            fontSize: 13,
            color: "var(--text-muted)",
            lineHeight: 1.6,
          }}>
            <strong style={{ color: "var(--text-secondary)" }}>{t("remember")}</strong>{" "}
            {selectedLevel.level >= 5 ? t("tipHighLevel") : t("tipLowLevel")}
          </div>

          <button
            onClick={startBattle}
            style={{
              width: "100%", padding: "14px", background: "var(--accent)",
              color: "white", border: "none", borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-syne)", fontSize: 16, fontWeight: 700,
              cursor: "pointer", transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.85"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; }}
          >
            {t("startConversation")}
          </button>

          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: 12, marginTop: 12 }}>
            {t("sessionCostLabel")} {isAdmin ? "∞" : credits}
          </p>
        </div>
      </div>
    );
  }

  // ============ BATTLE SCREEN ============
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", color: "var(--text-primary)", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{
        background: "var(--bg-secondary)", borderBottom: "1px solid var(--border)",
        padding: "12px 24px", display: "flex", alignItems: "center", gap: 14, flexShrink: 0,
      }}>
        <button onClick={() => setPhase("brief")} style={backBtnStyle}>{t("backBrief")}</button>
        <div style={{ fontSize: 20 }}>{selectedLevel?.emoji}</div>
        <div style={{ flex: 1 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{selectedLevel?.name}</span>
          <span style={{ color: "var(--text-muted)", fontSize: 12, marginLeft: 10 }}>
            {t("lvl")} {selectedLevel?.level} · {mode === "voice" ? t("voiceTag") : t("textTag")}
          </span>
        </div>
        {speaking && (
          <span style={{ fontSize: 12, color: "#C97E0A" }}>{t("aiTalking")}</span>
        )}
        <button
          onClick={endBattle}
          disabled={loadingFeedback || messages.length < 2}
          style={{
            background: "#C93B3B", color: "white", border: "none",
            borderRadius: "var(--radius-md)", padding: "7px 16px",
            fontWeight: 600, fontSize: 13, cursor: messages.length < 2 ? "not-allowed" : "pointer",
            opacity: messages.length < 2 ? 0.4 : 1,
          }}
        >
          {loadingFeedback ? t("analyzing") : t("endSession")}
        </button>
      </div>

      {/* Goal reminder bar */}
      <div style={{
        background: "rgba(42,127,255,0.05)",
        borderBottom: "1px solid rgba(42,127,255,0.12)",
        padding: "8px 24px",
        fontSize: 12,
        color: "var(--accent-bright)",
        flexShrink: 0,
      }}>
        <strong>{t("goalLabel")}</strong> {selectedLevel?.goal}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", maxWidth: 820, width: "100%", margin: "0 auto" }}>
        {messages.length === 0 && !aiStreaming && (
          <div style={{
            textAlign: "center", padding: "60px 20px",
            color: "var(--text-muted)", fontSize: 14, lineHeight: 1.8,
          }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>{selectedLevel?.emoji}</div>
            <div style={{ fontWeight: 600, color: "var(--text-secondary)", marginBottom: 8 }}>
              {t("writeFirstMessage")}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
              {selectedLevel?.name} {t("clientWaiting")}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start", marginBottom: 14 }}>
            <div style={{
              maxWidth: "72%",
              background: m.role === "user" ? "var(--accent)" : "var(--bg-elevated)",
              border: m.role === "user" ? "none" : "1px solid var(--border)",
              borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
              padding: "12px 16px", fontSize: 14, lineHeight: 1.6,
              color: m.role === "user" ? "white" : "var(--text-primary)",
            }}>
              {m.role === "assistant" && (
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>
                  {selectedLevel?.emoji} {selectedLevel?.name}
                </div>
              )}
              {m.content}
            </div>
          </div>
        ))}
        {aiStreaming && messages[messages.length - 1]?.role !== "assistant" && (
          <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 14 }}>
            <div style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: "14px 14px 14px 4px", padding: "12px 16px",
            }}>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 4 }}>{selectedLevel?.emoji} {selectedLevel?.name}</div>
              <span style={{ color: "var(--text-muted)" }}>...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {mode === "text" ? (
        <div style={{
          padding: "14px 24px", borderTop: "1px solid var(--border)",
          background: "var(--bg-secondary)", display: "flex", gap: 10,
          maxWidth: 820, width: "100%", margin: "0 auto",
        }}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
            }}
            placeholder={t("placeholder")}
            rows={2}
            disabled={aiStreaming}
            style={{
              flex: 1, resize: "none", padding: "10px 14px",
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", color: "var(--text-primary)", fontSize: 14,
            }}
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={aiStreaming || !input.trim()}
            style={{
              background: "var(--accent)", color: "white", border: "none",
              borderRadius: "var(--radius-md)", padding: "0 20px",
              fontWeight: 600, cursor: "pointer", fontSize: 14,
              opacity: aiStreaming || !input.trim() ? 0.5 : 1,
            }}
          >
            {t("send")}
          </button>
        </div>
      ) : (
        <div style={{
          padding: "20px 24px", borderTop: "1px solid var(--border)",
          background: "var(--bg-secondary)", display: "flex", flexDirection: "column",
          alignItems: "center", gap: 12,
        }}>
          {voiceTranscript && (
            <p style={{ color: "var(--text-secondary)", fontSize: 13, fontStyle: "italic" }}>
              {voiceTranscript}
            </p>
          )}
          <button
            onClick={voiceListening ? stopListening : startListening}
            disabled={speaking || aiStreaming}
            style={{
              width: 72, height: 72, borderRadius: "50%",
              background: voiceListening ? "#C93B3B" : "var(--accent)",
              border: voiceListening ? "3px solid rgba(201,59,59,0.5)" : "3px solid rgba(42,127,255,0.3)",
              color: "white", fontSize: 28, cursor: "pointer",
              transition: "all 0.2s",
              opacity: (speaking || aiStreaming) ? 0.5 : 1,
            }}
          >
            {voiceListening ? "⏹" : "🎤"}
          </button>
          <p style={{ color: "var(--text-muted)", fontSize: 12 }}>
            {speaking ? t("aiTalking") : voiceListening ? t("listening") : t("clickToTalk")}
          </p>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && feedback && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowFeedbackModal(false); }}
        >
          <div style={{
            background: "var(--bg-card)", border: "1px solid var(--border-bright)",
            borderRadius: "var(--radius-xl)", width: "100%", maxWidth: 640,
            maxHeight: "85vh", overflowY: "auto", padding: 32, position: "relative",
          }}>
            <button
              onClick={() => setShowFeedbackModal(false)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "var(--bg-elevated)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text-secondary)", cursor: "pointer",
                padding: "4px 10px", fontSize: 18,
              }}
            >×</button>

            <h2 style={{ fontFamily: "var(--font-syne)", fontSize: 22, marginBottom: 20 }}>
              {t("sessionRating")}
            </h2>
            <div style={{
              background: "var(--bg-elevated)", border: "1px solid var(--border)",
              borderRadius: "var(--radius-md)", padding: 20,
              fontSize: 14, lineHeight: 1.8, color: "var(--text-primary)",
              whiteSpace: "pre-wrap",
            }}>
              {feedback}
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
              <button
                onClick={() => { setShowFeedbackModal(false); setMessages([]); setPhase("brief"); }}
                style={{ flex: 1, padding: "10px", background: "var(--accent)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: 600, cursor: "pointer" }}
              >
                {t("playAgain")}
              </button>
              <button
                onClick={resetAll}
                style={{ flex: 1, padding: "10px", background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", cursor: "pointer" }}
              >
                {t("changeLevel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeCard({ emoji, title, subtitle, description, onClick, disabled }: {
  emoji: string; title: string; subtitle: string; description: string; onClick: () => void; disabled?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--bg-card)", border: "1px solid var(--border)",
        borderRadius: "var(--radius-xl)", padding: 28, cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s", textAlign: "center",
        opacity: disabled ? 0.6 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(42,127,255,0.4)";
          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-3px)";
          (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 30px rgba(42,127,255,0.1)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "var(--border)";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>{emoji}</div>
      <h3 style={{ fontFamily: "var(--font-syne)", fontSize: 20, fontWeight: 700, marginBottom: 4 }}>{title}</h3>
      <p style={{ color: "var(--accent-bright)", fontSize: 13, marginBottom: 10 }}>{subtitle}</p>
      <p style={{ color: "var(--text-secondary)", fontSize: 13, lineHeight: 1.5 }}>{description}</p>
    </div>
  );
}

const backBtnStyle: React.CSSProperties = {
  background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)",
  borderRadius: "var(--radius-md)", padding: "6px 14px", fontSize: 13, cursor: "pointer",
};
