import { useEffect, useState } from "react";
import ChatPrevious from "./ChatPrevious";

function ChatHistory({ onSelectChat, activeChat }) {
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
          "text": "hey whats up man"
        },
        {
          "id": "2965a208-a2fb-4621-9f7c-1de94b27101a",
          "role": "quagbot",
          "text": "Howdy pardner"
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
          "text": "Who is George Washington"
        },
        {
          "id": "2965a208-a2fb-4621-9f7c-1de94b27101a",
          "role": "quagbot",
          "text": "idk lol go read a book"
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
          "text": "What does Leinad mean?"
        },
        {
          "id": "2965a208-a2fb-4621-9f7c-1de94b27101a",
          "role": "quagbot",
          "text": "It's quite straightforward, actually. It's quite straightforward, actually. It's quite straightforward, actually. It's quite straightforward, actually."
        }
      ]
    }
  ]);

  return (
    <div className="max-w-50 overflow-x-hidden text-nowrap">
      <h2 className="sidebar-title">Chat History</h2>
      <div className="flex flex-col gap-1">
        {chats.map((chat, i) => <ChatPrevious key={i} chat={chat} isActive={chat === activeChat} onSelect={onSelectChat} />)}
      </div>
    </div>
  );
}

export default ChatHistory;
