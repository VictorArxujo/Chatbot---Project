import { useState } from "react";
import ChatbotUnect from "./ChatbotUnect";
import "./App.css";

export default function FloatingChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="floating-button" onClick={() => setOpen(!open)}>
        💬
      </div>
      {open && <ChatbotUnect onClose={() => setOpen(false)} />}
    </>
  );
}
