import { ChatBot } from "./pages/ChatBot";
import { ChatMessages } from "./pages/ChatMessages";
import {  Routes, Route, Link } from "react-router-dom";

const App = () => {
  return <>
      <nav>
        <ul>
          <li><Link to="/">Chat Bots</Link></li>
          <li><Link to="/show_chats" >Agent Page</Link></li>
        </ul>
      </nav>
      <Routes>
        <Route path="/show_chats" element={<ChatMessages />} />
        <Route path="/" element={<ChatBot />} />
      </Routes>
  </>
}

export default App;
