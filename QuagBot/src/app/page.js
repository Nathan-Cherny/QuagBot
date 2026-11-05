"use client";

import { useEffect, useRef, useState } from "react";
import ChatWindow from "./components/Chat/ChatWindow";
import Sidebar from "./components/Layout/Sidebar";
import ChatHistory from "./components/Chat/ChatHistory";
import MobileHistory from "./components/Chat/MobileHistory";
import ChatSettings from "./components/Chat/ChatSettings";
import PageWrapper from "./components/Layout/PageWrapper";
import { createConversation, sendMessage } from "../lib/api/chat";
import { getOutageReply } from "../lib/chat";
import {
  GeneratePracticeExam,
  MAKE_EXAM_MSG,
  parseMarkdownJson,
} from "./components/Chat/PracticeExamPDF";
import { createClient } from "../lib/supabase/client";
import { browserHistory } from "../lib/browserHistory.mjs";
import { DEFAULT_PREFERENCES, parsePreferences } from "../lib/chatPreferences";

const INITIAL_MESSAGE = {
  id: "welcome",
  role: "quagbot",
  text: "Hi! I'm QuagBot, your Revolutionary War study companion.\n\nWhat would you like to learn today? Choose a question below or type your own.",
};

function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [textSize, setTextSize] = useState(DEFAULT_PREFERENCES.textSize);
  const [font, setFont] = useState(DEFAULT_PREFERENCES.font);
  const [fontColor, setFontColor] = useState(DEFAULT_PREFERENCES.fontColor);
  const [activeChat, setActiveChat] = useState(null);
  const [chats, setChats] = useState([]);
  const [storageKey, setStorageKey] = useState(null);
  const [storageError, setStorageError] = useState(null);
  const [historyCanSave, setHistoryCanSave] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatVersion, setChatVersion] = useState(0);
  const pendingReply = useRef(null);
  const [maintenance, setMaintenance] = useState(false);
  const cooldownUntil = useRef(0);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function refreshStatus() {
      try {
        const response = await fetch("/api/ai-status", {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) return;
        const data = await response.json();
        if (!controller.signal.aborted)
          setMaintenance(data.maintenance === true);
      } catch {
        // Keep the last known configuration when the frontend is unreachable.
      }
    }
    refreshStatus();
    // This checks our own configuration only, without calling the AI service.
    const timer = setInterval(refreshStatus, 30000);
    return () => {
      clearInterval(timer);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!cooldownSeconds) return;
    const timer = setInterval(() => {
      setCooldownSeconds(
        Math.max(0, Math.ceil((cooldownUntil.current - Date.now()) / 1000)),
      );
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);
  const [conversationUnavailable, setConversationUnavailable] = useState(false);
  const [failedQuestion, setFailedQuestion] = useState(null);
  const [requestError, setRequestError] = useState(null);

  useEffect(() => {
    let disposed = false;
    let restoredIdentity;
    function restore(user) {
      const identity = user?.id ?? "guest";
      if (disposed || restoredIdentity === identity) return;
      restoredIdentity = identity;
      setConversationUnavailable(false);
      pendingReply.current?.abort();
      pendingReply.current = null;
      setIsLoading(false);
      setFailedQuestion(null);
      setRequestError(null);
      setActiveChat(null);
      setMessages([INITIAL_MESSAGE]);
      setChatVersion((version) => version + 1);
      const key = `quagbot:chats:v1:${user?.id ?? "guest"}`;
      let preferences = DEFAULT_PREFERENCES;
      try {
        preferences = parsePreferences(
          localStorage.getItem(`${key}:preferences`),
        );
      } catch {
        // Browser storage is optional; preferences still work for this visit.
      }
      setTextSize(preferences.textSize);
      setFont(preferences.font);
      setFontColor(preferences.fontColor);
      let saved = [];
      try {
        saved = browserHistory.load(localStorage, key);
        setHistoryCanSave(true);
        setStorageError(null);
      } catch {
        setHistoryCanSave(false);
        setStorageError(
          "Saved chats could not be loaded. New messages will remain available during this visit.",
        );
      }
      setChats(saved);
      setStorageKey(key);
    }
    let unsubscribe = () => {};
    try {
      const client = createClient();
      const { data } = client.auth.onAuthStateChange((_event, session) =>
        restore(session?.user),
      );
      unsubscribe = () => data.subscription.unsubscribe();
    } catch {
      // Keep cached history accessible; AI routes still require authentication.
      Promise.resolve().then(() => restore(null));
    }
    return () => {
      disposed = true;
      unsubscribe();
      pendingReply.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (!storageKey || !historyCanSave) return;
    try {
      browserHistory.save(localStorage, storageKey, chats);
    } catch {
      // Retain in-memory conversations even if the browser blocks storage.
      Promise.resolve().then(() =>
        setStorageError(
          "Chats could not be saved in this browser. Keep this tab open to retain your conversations.",
        ),
      );
    }
  }, [chats, storageKey, historyCanSave]);

  useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(
        `${storageKey}:preferences`,
        JSON.stringify({ textSize, font, fontColor }),
      );
    } catch {
      // Keep the current settings usable when storage is unavailable.
    }
  }, [storageKey, textSize, font, fontColor]);

  function saveConversation(id, content, backendConversationId) {
    const firstQuestion =
      content.find((message) => message.role === "user")?.text ?? "New chat";
    const title =
      firstQuestion.length > 45
        ? `${firstQuestion.slice(0, 45)}…`
        : firstQuestion;
    setChats((previous) => {
      const existing = previous.find((item) => item.id === id);
      const chat = {
        ...existing,
        backendConversationId:
          backendConversationId ?? existing?.backendConversationId ?? null,
        id,
        title: existing?.renamed ? existing.title : title,
        content,
        updatedAt: Date.now(),
      };
      return [chat, ...previous.filter((item) => item.id !== id)];
    });
  }

  async function sendTextToBot(text, isRetry = false, isPDF = false) {
    if (
      !storageKey ||
      pendingReply.current ||
      typeof text !== "string" ||
      !text.trim()
    )
      return;
    if (archived || emptyHistory || conversationUnavailable) return;
    text = text.trim();
    const id = activeChat ?? crypto.randomUUID();
    const content = isRetry
      ? messages
      : [
          ...messages,
          {
            id: crypto.randomUUID(),
            role: "user",
            text: isPDF
              ? MAKE_EXAM_MSG
              : text,
          },
        ];

    setActiveChat(id);
    setMessages(content);
    saveConversation(id, content);
    if (maintenance || Date.now() < cooldownUntil.current) {
      const completed = [
        ...content,
        {
          id: crypto.randomUUID(),
          role: "quagbot",
          text: getOutageReply(isPDF ? [] : content),
        },
      ];
      setMessages(completed);
      saveConversation(id, completed);
      setFailedQuestion(null);
      setRequestError(null);
      return;
    }
    const controller = new AbortController();
    pendingReply.current = controller;
    setFailedQuestion(null);
    setRequestError(null);
    setIsLoading(true);
    try {
      let backendId = chats.find(
        (chat) => chat.id === id,
      )?.backendConversationId;
      if (!backendId) {
        const conversation = await createConversation(text.slice(0, 80), {
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;
        backendId = conversation.id;
        saveConversation(id, content, backendId);
      }
      let { reply } = await sendMessage(backendId, text, {
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;
      if (typeof reply !== "string" || !reply.trim()) {
        throw new Error("Empty response");
      }
      if (isPDF) {
        const exam = parseMarkdownJson(reply);
        if (
          exam.isValid &&
          typeof exam.title === "string" &&
          typeof exam.text === "string"
        ) {
          reply = "```json\n" + JSON.stringify(exam) + "\n```";
        } else {
          reply =
            "There is not enough conversation content to create a practice exam yet. Ask a few more questions and try again.";
        }
      }

      const completed = [
        ...content,
        { id: crypto.randomUUID(), role: "quagbot", text: reply },
      ];
      setMessages(completed);
      saveConversation(id, completed, backendId);
    } catch (error) {
      if (!controller.signal.aborted) {
        if (![400, 401, 404].includes(error.status)) {
          const seconds = Math.min(86400, Math.max(30, error.retryAfter || 30));
          cooldownUntil.current = Date.now() + seconds * 1000;
          setCooldownSeconds(seconds);
          const completed = [
            ...content,
            {
              id: crypto.randomUUID(),
              role: "quagbot",
              text: getOutageReply(isPDF ? [] : content),
            },
          ];
          setMessages(completed);
          saveConversation(id, completed);
          return;
        }
        setFailedQuestion(text);
        setConversationUnavailable(error.status === 404);
        setRequestError(
          error.message ||
            "The AI service could not respond. Please try again.",
        );
      }
    } finally {
      if (pendingReply.current === controller) {
        pendingReply.current = null;
        setIsLoading(false);
      }
    }
  }

  function startNewChat() {
    setConversationUnavailable(false);
    if (pendingReply.current) {
      pendingReply.current.abort();
      pendingReply.current = null;
    }
    setIsLoading(false);
    setFailedQuestion(null);
    setRequestError(null);
    setMessages([INITIAL_MESSAGE]);
    setActiveChat(null);
    setHistoryOpen(false);
    setChatVersion((version) => version + 1);
  }

  function loadChat(chat) {
    pendingReply.current?.abort();
    pendingReply.current = null;
    setIsLoading(false);
    setRequestError(null);
    setConversationUnavailable(false);
    const last = chat.content.at(-1);
    setFailedQuestion(last?.role === "user" ? last.text : null);
    setMessages(chat.content.length ? [...chat.content] : []);
    setActiveChat(chat.id);
    setChatVersion((version) => version + 1);
    setHistoryOpen(false);
  }

  function deleteChat(id) {
    const chat = chats.find((item) => item.id === id);
    if (!chat) return;
    if (
      !window.confirm(
        "Delete this conversation from this browser? This cannot be undone. Any copy stored by the AI service will remain there.",
      )
    )
      return;
    if (id === activeChat) startNewChat();
    setChats((previous) => browserHistory.remove(previous, id));
  }

  function renameChat(id, title) {
    const trimmed = title.trim();
    if (!trimmed) return;
    setChats((previous) => browserHistory.rename(previous, id, trimmed));
  }

  const selectedChat = chats.find((chat) => chat.id === activeChat);
  const archived = Boolean(
    selectedChat && !Object.hasOwn(selectedChat, "backendConversationId"),
  );

  const emptyHistory = Boolean(
    selectedChat && selectedChat.content.length === 0,
  );

  const history = (
    <ChatHistory
      chats={chats}
      loading={!storageKey}
      onSelectChat={loadChat}
      activeChat={activeChat}
      onNewChat={startNewChat}
      onDeleteChat={deleteChat}
      onRenameChat={renameChat}
    />
  );

  return (
    <PageWrapper>
      <Sidebar title="" side="left">
        {history}
      </Sidebar>

      <MobileHistory open={historyOpen} onClose={() => setHistoryOpen(false)}>
        {history}
      </MobileHistory>
      <ChatWindow
        key={chatVersion}
        onNewChat={startNewChat}
        onOpenHistory={() => setHistoryOpen(true)}
        storageError={storageError}
        ready={Boolean(storageKey)}
        archived={archived}
        emptyHistory={emptyHistory}
        maintenance={maintenance}
        cooldownSeconds={cooldownSeconds}
        sendDisabled={emptyHistory || conversationUnavailable}
        messages={messages}
        title={
          chats.find((chat) => chat.id === activeChat)?.title ?? "New chat"
        }
        isLoading={isLoading}
        error={
          !archived && failedQuestion
            ? (requestError ??
              "This question has no reply yet. Try again to request an AI response.")
            : null
        }
        retryLabel={conversationUnavailable ? "Start new chat" : "Try again"}
        onRetry={() =>
          conversationUnavailable
            ? startNewChat()
            : sendTextToBot(failedQuestion, true)
        }
        onSend={sendTextToBot}
        responseStyle={{
          fontSize: textSize,
          fontFamily: font,
          color: fontColor,
        }}
      />

      <Sidebar side="right">
        <ChatSettings
          textSize={textSize}
          setTextSize={setTextSize}
          font={font}
          setFont={setFont}
          fontColor={fontColor}
          setFontColor={setFontColor}
        />
        <GeneratePracticeExam onSend={sendTextToBot} messages={messages} />
      </Sidebar>
    </PageWrapper>
  );
}

export default Home;
