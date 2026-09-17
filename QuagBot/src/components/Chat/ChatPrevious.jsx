import { useEffect, useState } from "react";

function ChatPrevious({chat}) {
  console.log(chat);
  return (
    <div className="bg-gray-300 w-full">
      <h3>{chat?.title}</h3>
    </div>
  );
}

export default ChatPrevious;
