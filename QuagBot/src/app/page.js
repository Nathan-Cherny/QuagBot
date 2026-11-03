"use client";

import { useRef, useState } from "react";
import ChatWindow from "./components/Chat/ChatWindow";
import Sidebar from "./components/Layout/Sidebar";
import ChatHistory from "./components/Chat/ChatHistory";
import ChatSettings from "./components/Chat/ChatSettings";
import PageWrapper from "./components/Layout/PageWrapper";
import { sendMessage } from "@/lib/api/messages";
import { PDFDownloadLink } from "@react-pdf/renderer";
import MyPdfDocument, { parseMarkdownJson } from "./components/Chat/PracticeExamPDF";

const INITIAL_MESSAGE = {
  id: "welcome",
  role: "quagbot",
  text: "Hi! I'm QuagBot, your personalized chatbot to answer any questions about the Revolutionary War that you may have. What would you like to ask?",
};

function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [textSize, setTextSize] = useState("18px");
  const [font, setFont] = useState("Arial, sans-serif");
  const [fontColor, setFontColor] = useState("#000000");
  const [activeChat, setActiveChat] = useState(null);
  const [chatVersion, setChatVersion] = useState(0);
  const [created, setCreated] = useState(null);
  const pendingReply = useRef(null);

  // The conversation ChatWindow created for the current chat. Tagged with the
  // chatVersion it was created for, so a slow response from a previous
  // ChatWindow can never be used by a newer chat.
  const createdConversation =
    created?.version === chatVersion ? created.conversation : null;

  // A chat picked from ChatHistory wins; otherwise use the freshly created conversation.
  const conversationId = activeChat?.id ?? createdConversation?.id ?? null;

  function handleConversationCreated(conversation, version) {
    setCreated({ version, conversation });
  }

  // Drop any in-flight reply so it can't land in a different chat.
  function cancelPendingReply() {
    pendingReply.current = null;
    setIsLoading(false);
  }

  async function sendTextToBot(text, isPDF) {
    if (pendingReply.current) return;

    if (!conversationId) {
      // The conversation hasn't been created yet (or creation failed).
      console.error("Cannot send message: no conversationId available yet.");
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "user", text },
        {
          id: crypto.randomUUID(),
          role: "quagbot",
          text: "I'm still setting up this conversation. Please try again in a moment.",
        },
      ]);
      return;
    }

    const token = {};
    pendingReply.current = token;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", text },
    ]);
    setIsLoading(true);

    let botText;
    try {
      const result = await sendMessage(conversationId, text);

      if (pendingReply.current !== token) return; // chat was reset while waiting
      botText = result.reply;
    } catch (error) {
      if (pendingReply.current !== token) return;
      console.error(error);
      botText = "Sorry, something went wrong. Please try again.";
    }

    if (isPDF) {
      let parsedJson = parseMarkdownJson(botText);
      botText = parsedJson
    }
    
    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "quagbot", text: botText, isPDF: isPDF },
    ]);
    setIsLoading(false);
    pendingReply.current = null;

  }

  function startNewChat() {
    cancelPendingReply();
    setMessages([INITIAL_MESSAGE]);
    setActiveChat(null);
    setChatVersion((version) => version + 1);
  }

  function loadChat(chat) {
    cancelPendingReply();
    setMessages([...chat.content]);
    setActiveChat(chat);
  }

  return (
    <PageWrapper>
      <Sidebar title="" side="left">
        <ChatHistory
          onSelectChat={loadChat}
          activeChat={activeChat}
          onNewChat={startNewChat}
        />
      </Sidebar>

      <ChatWindow
        key={chatVersion}
        onNewChat={startNewChat}
        messages={messages}
        isLoading={isLoading}
        onSend={sendTextToBot}
        onConversationCreated={(conversation) =>
          handleConversationCreated(conversation, chatVersion)
        }
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
      </Sidebar>
    </PageWrapper>
  );
}

export default Home;
