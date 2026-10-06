import { useEffect, useState } from "react";

function ChatPrevious({ chat, isActive, onSelect }) {
  if (!chat) return

  function setAsActiveChat(chat) {
    onSelect?.(chat)
  }

  return (
    <div
      title={chat.title}
      onClick={() => setAsActiveChat(chat)}
      className={`text-sm w-full rounded-xl cursor-pointer py-1.25 px-5 text-left hover:bg-gray-300 ${isActive ? "bg-gray-300" : ""}`}
    >
      {chat.title}
    </div>
  );
}

export default ChatPrevious;
