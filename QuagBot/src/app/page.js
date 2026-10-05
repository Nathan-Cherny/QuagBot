"use client"

import { useEffect, useState } from 'react';
import ChatWindow from './components/Chat/ChatWindow';
import Sidebar from './components/Layout/Sidebar';
import ChatHistory from "./components/Chat/ChatHistory"
import ChatSettings from "./components/Chat/ChatSettings"
import PageWrapper from './components/Layout/PageWrapper';

const INITIAL_MESSAGE = {
    id: 'welcome',
    role: 'quagbot',
    text: "Hi! I'm QuagBot, your personalized chatbot to answer any questions about the Revolutionary War that you may have. What would you like to ask?",
}

function Home() {
    const [isLoading, setIsLoading] = useState(false);
    const [messages, setMessages] = useState([INITIAL_MESSAGE]);
    const [textSize, setTextSize] = useState('18px');
    const [font, setFont] = useState('Arial, sans-serif');
    const [fontColor, setFontColor] = useState('#000000');

    function sendTextToBot(text) {
        const userMessage = { id: crypto.randomUUID(), role: 'user', text };
        setMessages((prev) => [...prev, userMessage]);
        setIsLoading(true);

        // Placeholder response logic. Swap this out for a real API call.
        setTimeout(() => {
            const botMessage = {
                id: crypto.randomUUID(),
                role: 'quagbot',
                text: "This is a placeholder response. Connect a backend to make me smarter.",
            };
            setMessages((prev) => [...prev, botMessage]);
            setIsLoading(false);
        }, 700);
    }

    return (
        <PageWrapper>
            <Sidebar title="" side="left">
                <ChatHistory />
            </Sidebar>

            <ChatWindow
                messages={messages}
                isLoading={isLoading}
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


