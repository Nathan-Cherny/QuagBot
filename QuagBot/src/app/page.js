"use client"

import { useEffect, useRef, useState } from 'react';
import ChatWindow from './components/Chat/ChatWindow';
import Sidebar from './components/Layout/Sidebar';
import ChatHistory from "./components/Chat/ChatHistory"
import MobileHistory from './components/Chat/MobileHistory';
import ChatSettings from "./components/Chat/ChatSettings"
import PageWrapper from './components/Layout/PageWrapper';
import { createConversation, sendMessage, listConversations, listMessages } from '../lib/api/chat';
import { createClient } from '../lib/supabase/client';
import { mergeConversationCatalog, restoreMessages } from '../lib/historySync.mjs';
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
    const messageRequest = useRef(null);
    const accountKey = useRef(null);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState(null);
    const [historyRefresh, setHistoryRefresh] = useState(0);
    const [isRestoring, setIsRestoring] = useState(false);
    const [loadError, setLoadError] = useState(null);
    const [remotePending, setRemotePending] = useState(false);
    const [failedQuestion, setFailedQuestion] = useState(null);
    const [requestError, setRequestError] = useState(null);

    useEffect(() => {
        let disposed = false;
        let restoredIdentity;
        function restore(user) {
            const identity = user?.id ?? 'guest';
            if (disposed || restoredIdentity === identity) return;
            restoredIdentity = identity;
            messageRequest.current?.abort();
            messageRequest.current = null;
            setIsRestoring(false);
            setLoadError(null);
            setRemotePending(false);
            setHistoryLoading(true);
            setHistoryError(null);
            pendingReply.current?.abort();
            pendingReply.current = null;
            setIsLoading(false);
            setFailedQuestion(null);
            setRequestError(null);
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
            accountKey.current = key;
            setChats(saved);
            setStorageKey(key);
        }
        let unsubscribe = () => {};
        try {
            const client = createClient();
            const { data } = client.auth.onAuthStateChange((_event, session) => restore(session?.user));
            unsubscribe = () => data.subscription.unsubscribe();
        } catch {
            // Keep cached history accessible; AI routes still require authentication.
            Promise.resolve().then(() => restore(null));
        }
        return () => {
            disposed = true;
            unsubscribe();
            pendingReply.current?.abort();
            messageRequest.current?.abort();
        };
    }, []);

    useEffect(() => {
        if (!storageKey) return;
        const controller = new AbortController();
        listConversations({ signal: controller.signal })
            .then((records) => {
                if (controller.signal.aborted || accountKey.current !== storageKey) return;
                setChats((previous) => mergeConversationCatalog(previous, records));
                setHistoryError(null);
            })
            .catch((error) => {
                if (!controller.signal.aborted && accountKey.current === storageKey) setHistoryError(error.message);
            })
            .finally(() => {
                if (!controller.signal.aborted && accountKey.current === storageKey) setHistoryLoading(false);
            });
        return () => controller.abort();
    }, [storageKey, historyRefresh]);

    function refreshHistory() {
        setHistoryLoading(true);
        setHistoryError(null);
        setHistoryRefresh((version) => version + 1);
    }

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

    function saveConversation(id, content, backendConversationId) {
        const firstQuestion = content.find((message) => message.role === 'user')?.text ?? 'New chat';
        const title = firstQuestion.length > 45 ? `${firstQuestion.slice(0, 45)}…` : firstQuestion;
        setChats((previous) => {
            const existing = previous.find((item) => item.id === id);
            const chat = { ...existing, backendConversationId: backendConversationId ?? existing?.backendConversationId ?? null, id, title: existing?.renamed ? existing.title : title, content, updatedAt: Date.now() };
            return [chat, ...previous.filter((item) => item.id !== id)];
        });
    }

    async function sendTextToBot(text, isRetry = false) {
        if (!storageKey || pendingReply.current || typeof text !== 'string' || !text.trim()) return;
        if (archived || isRestoring || loadError || remotePending) return;
        text = text.trim();
        const id = activeChat ?? crypto.randomUUID();
        const content = isRetry ? messages : [...messages, { id: crypto.randomUUID(), role: 'user', text }];
        setActiveChat(id);
        setMessages(content);
        saveConversation(id, content);
        const controller = new AbortController();
        pendingReply.current = controller;
        setFailedQuestion(null);
        setRequestError(null);
        setIsLoading(true);
        try {
            let backendId = chats.find((chat) => chat.id === id)?.backendConversationId;
            if (!backendId) {
                const conversation = await createConversation(text.slice(0, 80), { signal: controller.signal });
                if (controller.signal.aborted) return;
                backendId = conversation.id;
                saveConversation(id, content, backendId);
            }
            const { reply } = await sendMessage(backendId, text, { signal: controller.signal });
            if (controller.signal.aborted) return;
            if (typeof reply !== 'string' || !reply.trim()) {
                throw new Error('Empty response');
            }
            const completed = [...content, { id: crypto.randomUUID(), role: 'quagbot', text: reply }];
            setMessages(completed);
            saveConversation(id, completed, backendId);
        } catch (error) {
            if (!controller.signal.aborted) {
                setFailedQuestion(text);
                setRequestError(error.message || 'The AI service could not respond. Please try again.');
            }
        } finally {
            if (pendingReply.current === controller) {
                pendingReply.current = null;
                setIsLoading(false);
            }
        }
    }

    function startNewChat() {
        messageRequest.current?.abort();
        messageRequest.current = null;
        setIsRestoring(false);
        setLoadError(null);
        setRemotePending(false);
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

    async function loadChat(chat) {
        pendingReply.current?.abort();
        pendingReply.current = null;
        messageRequest.current?.abort();
        messageRequest.current = null;
        setIsLoading(false);
        setFailedQuestion(null);
        setRequestError(null);
        setLoadError(null);
        setRemotePending(false);
        setIsRestoring(false);
        setMessages(chat.content.length ? [...chat.content] : [INITIAL_MESSAGE]);
        setActiveChat(chat.id);
        setChatVersion((version) => version + 1);
        setHistoryOpen(false);
        if (!chat.backendConversationId) {
            const last = chat.content.at(-1);
            setFailedQuestion(last?.role === 'user' ? last.text : null);
            return;
        }
        const controller = new AbortController();
        messageRequest.current = controller;
        setIsRestoring(true);
        try {
            const records = await listMessages(chat.backendConversationId, { signal: controller.signal });
            if (controller.signal.aborted) return;
            const restored = restoreMessages(records, chat.content);
            setMessages(restored.messages.length ? restored.messages : [INITIAL_MESSAGE]);
            setRemotePending(restored.pending);
            const last = restored.messages.at(-1);
            setFailedQuestion(!restored.pending && last?.role === 'user' ? last.text : null);
            // Reading history must not move it into the Today group.
            setChats((previous) => previous.map((item) => item.id === chat.id ? { ...item, content: restored.messages } : item));
        } catch (error) {
            if (!controller.signal.aborted) setLoadError(`Could not refresh this conversation. ${error.message}`);
        } finally {
            if (messageRequest.current === controller) {
                messageRequest.current = null;
                setIsRestoring(false);
            }
        }
    }

    function deleteChat(id) {
        const chat = chats.find((item) => item.id === id);
        if (!chat || chat.backendConversationId) return;
        if (!window.confirm('Delete this local conversation? This cannot be undone.')) return;
        if (id === activeChat) startNewChat();
        setChats((previous) => previous.filter((chat) => chat.id !== id));
    }

    function renameChat(id, title) {
        const trimmed = title.trim();
        if (!trimmed) return;
        setChats((previous) => previous.map((chat) => chat.id === id ? { ...chat, title: trimmed, renamed: true } : chat));
    }

    const selectedChat = chats.find((chat) => chat.id === activeChat);
    const archived = Boolean(selectedChat && !Object.hasOwn(selectedChat, 'backendConversationId'));

    const history = <ChatHistory chats={chats} loading={historyLoading} error={historyError} onRefresh={refreshHistory} onSelectChat={loadChat} activeChat={activeChat} onNewChat={startNewChat} onDeleteChat={deleteChat} onRenameChat={renameChat} />;

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
                isRestoring={isRestoring}
                sendDisabled={Boolean(loadError) || remotePending}
                remotePending={remotePending}
                onRefreshConversation={() => selectedChat && loadChat(selectedChat)}
                messages={messages}
                title={chats.find((chat) => chat.id === activeChat)?.title ?? 'New chat'}
                isLoading={isLoading}
                error={loadError ?? (!archived && failedQuestion ? (requestError ?? "This question has no reply yet. Try again to request an AI response.") : null)}
                onRetry={() => loadError && selectedChat ? loadChat(selectedChat) : sendTextToBot(failedQuestion, true)}
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


