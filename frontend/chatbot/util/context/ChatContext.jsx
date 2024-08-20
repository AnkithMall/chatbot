import { createContext, useContext, useState } from 'react';

const ChatContext = createContext();

export const useChatContext = () => useContext(ChatContext);

export const ChatProvider = ({ children }) => {
  const [selectedThread, setSelectedThread] = useState(null);

  return (
    <ChatContext.Provider value={{ selectedThread, setSelectedThread }}>
      {children}
    </ChatContext.Provider>
  );
};
