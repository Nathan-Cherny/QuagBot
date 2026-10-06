import { useEffect, useState } from "react";
import ChatPrevious from "./ChatPrevious";

function ChatHistory() {
  const [chats, setChats] = useState([
    {
      title: "Example Chat", content: [
        {
          "id": "welcome",
          "role": "quagbot",
          "text": "Hi! I'm QuagBot, your personalized chatbot to answer any questions about the Revolutionary War that you may have. What would you like to ask?"
        },
        {
          "id": "168d106c-7133-4fbd-999e-3d4288f777ef",
          "role": "user",
          "text": "test"
        },
        {
          "id": "2965a208-a2fb-4621-9f7c-1de94b27101a",
          "role": "quagbot",
          "text": "This is a placeholder response. Connect a backend to make me smarter."
        }
      ]
    },
    {
      title: "Another Example Chat", content: [
        {
          "id": "welcome",
          "role": "quagbot",
          "text": "Hi! I'm QuagBot, your personalized chatbot to answer any questions about the Revolutionary War that you may have. What would you like to ask?"
        },
        {
          "id": "168d106c-7133-4fbd-999e-3d4288f777ef",
          "role": "user",
          "text": "test"
        },
        {
          "id": "2965a208-a2fb-4621-9f7c-1de94b27101a",
          "role": "quagbot",
          "text": "This is a placeholder response. Connect a backend to make me smarter."
        }
      ]
    },
    {
      title: "Super duper long title oh yeah yes this is for testing okay i can stop now", content: [
        {
          "id": "welcome",
          "role": "quagbot",
          "text": "Hi! I'm QuagBot, your personalized chatbot to answer any questions about the Revolutionary War that you may have. What would you like to ask?"
        },
        {
          "id": "168d106c-7133-4fbd-999e-3d4288f777ef",
          "role": "user",
          "text": "test"
        },
        {
          "id": "2965a208-a2fb-4621-9f7c-1de94b27101a",
          "role": "quagbot",
          "text": "This is a placeholder response. Connect a backend to make me smarter."
        }
      ]
    }
  ]);

  return (
    <div className="max-w-50 overflow-x-hidden text-nowrap">
      <h2 className="sidebar-title">Chat History</h2>
      <div>
        {chats.map((chat, i) => <ChatPrevious key={i} chat={chat} />)}
      </div>
    </div>
  );
}

export default ChatHistory;
