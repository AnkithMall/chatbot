import { ChatBot } from "./pages/ChatBot";
import { ChatMessages } from "./pages/ChatMessages";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const App = () => {
  return <>
    <BrowserRouter>
      <Routes>
        <Route path="/show_chats" element={<ChatMessages />} />
        <Route path="/" element={<ChatBot />} />
      </Routes>
    </BrowserRouter>
  </>
}

export default App;
