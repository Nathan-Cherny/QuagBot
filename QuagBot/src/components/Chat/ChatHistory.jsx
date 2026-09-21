import { useEffect, useState } from "react";
import ChatPrevious from "./ChatPrevious";

function ChatHistory() {
  const [chats, setChats] = useState([
    { title: "Example Chat", "Content": {} },
    { title: "Another Example Chat", "Content": {} },
    { title: "Super duper long title oh yeah yes this is for testing okay i can stop now", "Content": {} }
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
