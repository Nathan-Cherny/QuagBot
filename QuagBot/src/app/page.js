"use client"

import { useEffect, useRef, useState } from 'react';
import ChatWindow from './components/Chat/ChatWindow';
import Sidebar from './components/Layout/Sidebar';
import ChatHistory from "./components/Chat/ChatHistory"
import MobileHistory from './components/Chat/MobileHistory';
import ChatSettings from "./components/Chat/ChatSettings"
import PageWrapper from './components/Layout/PageWrapper';
import { requestReply } from '../lib/chat';
import { createClient } from '../lib/supabase/client';
import { DEFAULT_PREFERENCES, parsePreferences } from '../lib/chatPreferences';

const INITIAL_MESSAGE = {
    id: 'welcome',
    role: 'quagbot',
    text: "Hi! I'm QuagBot, your Revolutionary War study companion.\n\nWhat would you like to learn today? Choose a question below or type your own.",
}

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
    const [historyOpen, setHistoryOpen] = useState(false);
    const [chatVersion, setChatVersion] = useState(0);
    const pendingReply = useRef(null);
    const [failedQuestion, setFailedQuestion] = useState(null);

    useEffect(() => {
        let disposed = false;
        let restoredIdentity;
        function restore(user) {
            const identity = user?.id ?? 'guest';
            if (disposed || restoredIdentity === identity) return;
            restoredIdentity = identity;
            pendingReply.current?.abort();
            pendingReply.current = null;
            setIsLoading(false);
            setFailedQuestion(null);
            setActiveChat(null);
            setMessages([INITIAL_MESSAGE]);
            setChatVersion((version) => version + 1);
            const key = `quagbot:chats:v1:${user?.id ?? 'guest'}`;
            let preferences = DEFAULT_PREFERENCES;
            try {
                preferences = parsePreferences(localStorage.getItem(`${key}:preferences`));
            } catch {
                // Browser storage is optional; preferences still work for this visit.
            }
            setTextSize(preferences.textSize);
            setFont(preferences.font);
            setFontColor(preferences.fontColor);
            let saved = [];
            try {
                const parsed = JSON.parse(localStorage.getItem(key) ?? '[]');
                if (!Array.isArray(parsed)) throw new Error('Invalid history');
                saved = parsed.filter((chat) => chat && typeof chat.id === 'string' && typeof chat.title === 'string' && Array.isArray(chat.content) && chat.content.every((message) => message && typeof message.id === 'string' && typeof message.text === 'string' && ['user', 'quagbot'].includes(message.role)));
                setStorageError(null);
            } catch {
                setStorageError('Saved chats could not be loaded. New messages will remain available during this visit.');
            }
            setChats(saved);
            setStorageKey(key);
        }
        let unsubscribe = () => {};
        try {
            const client = createClient();
            const { data } = client.auth.onAuthStateChange((_event, session) => restore(session?.user));
            unsubscribe = () => data.subscription.unsubscribe();
        } catch {
            // Allow local demos when authentication is not configured.
            Promise.resolve().then(() => restore(null));
        }
        return () => {
            disposed = true;
            unsubscribe();
            pendingReply.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!storageKey) return;
        try {
            localStorage.setItem(storageKey, JSON.stringify(chats));
        } catch {
            // Retain in-memory conversations even if the browser blocks storage.
            Promise.resolve().then(() => setStorageError('Chats could not be saved in this browser. Keep this tab open to retain your conversations.'));
        }
    }, [chats, storageKey]);

    useEffect(() => {
        if (!storageKey) return;
        try {
            localStorage.setItem(`${storageKey}:preferences`, JSON.stringify({ textSize, font, fontColor }));
        } catch {
            // Keep the current settings usable when storage is unavailable.
        }
    }, [storageKey, textSize, font, fontColor]);

    function saveConversation(id, content) {
        const firstQuestion = content.find((message) => message.role === 'user')?.text ?? 'New chat';
        const title = firstQuestion.length > 45 ? `${firstQuestion.slice(0, 45)}…` : firstQuestion;
        setChats((previous) => {
            const existing = previous.find((item) => item.id === id);
            const chat = { ...existing, id, title: existing?.renamed ? existing.title : title, content, updatedAt: Date.now() };
            return [chat, ...previous.filter((item) => item.id !== id)];
        });
    }

    async function sendTextToBot(text, isRetry = false) {
        if (!storageKey || pendingReply.current || typeof text !== 'string' || !text.trim()) return;
        text = text.trim();
        const id = activeChat ?? crypto.randomUUID();
        const content = isRetry ? messages : [...messages, { id: crypto.randomUUID(), role: 'user', text }];
        setActiveChat(id);
        setMessages(content);
        saveConversation(id, content);
        const controller = new AbortController();
        pendingReply.current = controller;
        setFailedQuestion(null);
        setIsLoading(true);
        try {
            const reply = await requestReply(content, { signal: controller.signal });
            if (controller.signal.aborted) return;
            if (typeof reply !== 'string' || !reply.trim()) {
                throw new Error('Empty response');
            }
            const completed = [...content, { id: crypto.randomUUID(), role: 'quagbot', text: reply }];
            setMessages(completed);
            saveConversation(id, completed);
        } catch {
            if (!controller.signal.aborted) setFailedQuestion(text);
        } finally {
            if (pendingReply.current === controller) {
                pendingReply.current = null;
                setIsLoading(false);
            }
        }
    }

    function startNewChat() {
        if (pendingReply.current) {
            pendingReply.current.abort();
            pendingReply.current = null;
        }
        setIsLoading(false);
        setFailedQuestion(null);
        setMessages([INITIAL_MESSAGE]);
        setActiveChat(null);
        setHistoryOpen(false);
        setChatVersion((version) => version + 1);
    }

    // Replace the displayed conversation with a previous chat's messages.
    function loadChat(chat) {
        // Drop any in-flight reply so it doesn't get appended to the newly loaded chat.
        if (pendingReply.current) {
            pendingReply.current.abort();
            pendingReply.current = null;
        }
        setIsLoading(false);
        setFailedQuestion(null);
        const lastMessage = chat.content.at(-1);
        setFailedQuestion(lastMessage?.role === 'user' ? lastMessage.text : null);
        setMessages([...chat.content]);
        setActiveChat(chat.id);
        setChatVersion((version) => version + 1);
        setHistoryOpen(false);
    }

    function deleteChat(id) {
        if (!window.confirm('Delete this conversation? This cannot be undone.')) return;
        if (id === activeChat) startNewChat();
        setChats((previous) => previous.filter((chat) => chat.id !== id));
    }

    function renameChat(id, title) {
        const trimmed = title.trim();
        if (!trimmed) return;
        setChats((previous) => previous.map((chat) => chat.id === id ? { ...chat, title: trimmed, renamed: true } : chat));
    }

    const history = <ChatHistory chats={chats} onSelectChat={loadChat} activeChat={activeChat} onNewChat={startNewChat} onDeleteChat={deleteChat} onRenameChat={renameChat} />;

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
                messages={messages}
                title={chats.find((chat) => chat.id === activeChat)?.title ?? 'New chat'}
                isLoading={isLoading}
                error={failedQuestion ? "This question has no reply yet. Your question is saved in the conversation. Try again to get a response." : null}
                onRetry={() => sendTextToBot(failedQuestion, true)}
                onSend={sendTextToBot}
                responseStyle={{ fontSize: textSize, fontFamily: font, color: fontColor }}
            />

            <Sidebar side="right">
                <ChatSettings
                    textSize={textSize} setTextSize={setTextSize}
                    font={font} setFont={setFont}
                    fontColor={fontColor} setFontColor={setFontColor}
                />
            </Sidebar>
        </PageWrapper>
    );
}

export default Home;


