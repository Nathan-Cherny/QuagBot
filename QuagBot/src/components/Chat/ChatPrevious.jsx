import { useEffect, useState } from "react";

function ChatPrevious({chat}) {
  if(!chat) return

  return (
    <div title={chat.title} className="text-sm w-full rounded-xl cursor-pointer py-1.25 px-5 text-left hover:bg-gray-300 ">
      {chat.title}
    </div>
  );
}

export default ChatPrevious;
