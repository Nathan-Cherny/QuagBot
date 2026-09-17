import { useEffect, useState } from "react";
import ChatPrevious from "./ChatPrevious";

function ChatHistory() {
  const [chats, setChats] = useState([
    {title: "Example Chat", "Content": {}}
  ]);

  return (
    <div>
        {chats.map((chat, i) => <ChatPrevious key={i} chat={chat}/>)}
    </div>
  );
}

export default ChatHistory;
