import { ChatBot } from "./pages/ChatBot";
import { ChatMessages } from "./pages/ChatMessages";
import {  Routes, Route, Link } from "react-router-dom";
import { ChatProvider } from '../util/context/ChatContext'; 

const App = () => {
  return <>
      <nav>
        <ul>
          <li><Link to="/">Chat Bots</Link></li>
          <li><Link to="/show_chats" >Agent Page</Link></li>
        </ul>
      </nav>
      <ChatProvider>
      <Routes>
        <Route path="/show_chats" element={<ChatMessages />} />
        <Route path="/" element={<ChatBot />} />
      </Routes>
      </ChatProvider>
  </>
}

export default App;
