import { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_BASE_URL_BACKEND_SERVER);

export const useMessages = (selectedThread) => {
  const [messages, setMessages] = useState([]);
  const [variables, setVariables] = useState([]);
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const fetchMessages = async (threadId) => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/threads/${threadId}/messages`);
      const variablesResponse = await axios.get(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/get_variables/${threadId}`);
      
      setMessages(response.data.messages.reverse());
      setVariables(variablesResponse.data.variables?.variables || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };
  useEffect(()=>{setIsFirstMessage(true)},[selectedThread])

  const sendMessage = async (messageText, asstId = "") => {
    if (!selectedThread || !messageText.trim()) return;
    
    try {
      if (isFirstMessage) {
        const res = await axios.get(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/agent_takeover/${selectedThread}`);
        console.log(res);
        setIsFirstMessage(false);
       
      }
      const res = await axios.post(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/chat/agent`, {
        thread_id: selectedThread,
        message: messageText,
        asst_id: asstId,
      });
      console.log(res);
      setMessages(prevMessages => [
        ...prevMessages,
        { role: "agent", content: [{ text: { value: messageText } }] }
      ]);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(() => {
    if (selectedThread) fetchMessages(selectedThread);

    socket.on('thread_status_change', (data) => {
      if (data.thread_id === selectedThread) {
        alert(`Conversation TakeOver SuccessFull!`);
      }
    });

    socket.on(`lead_msg-${selectedThread}`, (data) => {
      setMessages((prevMessages) => [...prevMessages, data.message]);
    });
    socket.on(`lead_chats-${selectedThread}`,(data)=>{
      console.log("lead chat update ",data);
      fetchMessages(selectedThread)
    })
    return () => {
      socket.off('thread_status_change');
      socket.off(`lead_msg-${selectedThread}`);
      socket.off(`lead_chats-${selectedThread}`);
    };
  }, [selectedThread]);

  return { messages, variables, fetchMessages, sendMessage };
};
