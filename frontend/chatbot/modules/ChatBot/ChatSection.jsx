import React, { useState, useEffect, useCallback } from "react";
import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import axios from "axios";

const ChatSection = ({ chatMessages, message, setMessage, threadId, setThreadId, selectedChatbot, socket, setChatMessages }) => {
    const [loading, setLoading] = useState(false);

    const createThread = useCallback(async (assistantId) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/create_thread`);
            await setThreadId(response.data.thread_id);
            return response.data.thread_id;
        } catch (error) {
            console.error("Error creating thread:", error);
        }
    }, []);
    useEffect(() => {
        
        if(threadId){

            socket.on('thread_status_change', (data) => {
              console.log(data);
              if (data.thread_id === threadId) {
                // Update UI or fetch new messages based on the thread ID
                console.log(`Thread ${data.thread_id} status changed to ${data.status}`);
                alert(`Conversation TakeOver By an Agent!`)
              }
            });
        
            socket.on(`agent_msg-${threadId}`,(data) => {
              console.log("Agent => ",data);
              console.log(chatMessages);
              setChatMessages((prevMessages) => [data.message,...prevMessages])
              console.log("chat-messages",chatMessages);
            })
        
        
            return () => {
              socket.off('thread_status_change');
              socket.off(`agent_msg-${threadId}`);
            };
        }
      },[threadId])
      const handleGenerateEmbedCode = () => {
        if (!selectedChatbot) return;

        const embedCode = `
        <div id="chatbot-container"></div>
        <script>
            (function() {
                var chatContainer = document.getElementById('chatbot-container');
                var chatbotFrame = document.createElement('iframe');
                chatbotFrame.src = "${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/chatbot?assistant_id=${selectedChatbot.id}";
                chatbotFrame.style.position = "fixed";
                chatbotFrame.style.bottom = "0";
                chatbotFrame.style.right = "0";
                chatbotFrame.style.width = "350px";
                chatbotFrame.style.height = "500px";
                chatbotFrame.style.border = "none";
                chatbotFrame.style.zIndex = "1000";
                chatContainer.appendChild(chatbotFrame);
            })();
        </script>
        `;
        navigator.clipboard.writeText(embedCode).then(function () {
            alert('Text copied to clipboard');
        }).catch(function (error) {
            alert('Failed to copy text: ', error);
        });
    };

    const fetchMessages = async (thread_id = threadId) => {
        if (!thread_id) return;
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/threads/${thread_id}/messages`);
            const messages = response.data.messages.map(msg => ({
                role: msg.role,
                content: msg.content.map(part => part.text.value).join(' ')
            }));
            setChatMessages(messages);
            return true;
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
        return false;
    }

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        
        setLoading(true); // Set loading state to true
        try {
            let newThreadId = threadId;
            if (!threadId) {
                newThreadId = await createThread(selectedChatbot.id);
                console.log("created thread => ",newThreadId);
                setThreadId(newThreadId);
            }
            const newMsg = {
                "role":"user",
                "content":message
            } 
            setChatMessages((prevMessages) => [newMsg,...prevMessages])
            setMessage(""); // Clear the input field

            const placeholderMessage = {
                role: "placeholder",
                content: "..."
            };
            setChatMessages((prevMessages) => [placeholderMessage, ...prevMessages]);

            const response = await axios.post(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/chat`, {
                thread_id: newThreadId,
                message:newMsg.content,
                asst_id: selectedChatbot.id,
            });

            if (response.status === 200) {
                
                await fetchMessages(newThreadId);
            } else {
                alert(`Couldn't send the message to Server. Status code ${response.status}`);
            }
        } catch (error) {
            console.error("Error sending message:", error);
        } finally {
            setLoading(false); // Set loading state to false
        }
    };

    useEffect(() => {
        if(threadId){
            let inactivityTimer;
            if (!threadId) return;
    
            const resetTimer = () => {
                clearTimeout(inactivityTimer);
                inactivityTimer = setTimeout(() => {
                    handleEndChat('inactive_chat');
                }, 10*60 * 1000); // 10 minutes
            };
    
            window.addEventListener('mousemove', resetTimer);
            window.addEventListener('keypress', resetTimer);


            const handleWindowClose = (event) => {
                handleEndChat('window_closed');
                // Prevent default to ensure the request gets sent before the window closes
                event.preventDefault();
                event.returnValue = ''; // This line is necessary for older browsers
            };
        
            window.addEventListener('beforeunload', handleWindowClose);
    
            return () => {
                clearTimeout(inactivityTimer);
                window.removeEventListener('mousemove', resetTimer);
                window.removeEventListener('keypress', resetTimer);
                window.removeEventListener('beforeunload', handleWindowClose);
            };
        }
    }, [threadId]);

    const handleEndChat = async (reason) => {
        if (threadId) {
            await axios.post(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/end_chat`, {
                thread_id: threadId,
                reason: reason,
            });
            setThreadId("");
            setChatMessages([]);
            if (reason === 'inactive_chat') {
                alert('Chat ended due to inactivity.');
            } else if (reason === 'window_closed') {
                alert('Chat ended because the window was closed.');
            }
        }
    };
    console.log("chat message = ",chatMessages);

    return (
        <Box style={{ width: "50%", paddingLeft: "10px", display: "flex", flexDirection: "column", height: "90vh", overflowY: "scroll" }}>
            <Box style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
                {[...chatMessages].reverse().map((msg, index) => (
                    <div key={index} style={{ textAlign: msg.role === "user" ? "right" : "left" }}>
                        <Typography
                            variant="body1"
                            style={{
                                display: "inline-block",
                                backgroundColor: msg.role === "user" ? "#e0f7fa" : "#fff9c4",
                                padding: "5px",
                                borderRadius: "5px",
                            }}
                        >
                           {typeof msg.content === 'string' ? msg.content : msg.content.map((split)=>split.text.value).join(' ')}
                        </Typography>
                    </div>
                ))}
            </Box>

            <Box style={{ display: "flex", marginTop: "10px" }}>
                <TextField
                    fullWidth
                    label="Type your message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={loading} // Disable input when loading
                />
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSendMessage}
                    style={{ marginLeft: "10px" }}
                    disabled={loading} // Disable button when loading
                >
                    {loading ? <CircularProgress size={24} /> : "Send"} {/* Show loading spinner */}
                </Button>
                <Button
                            variant="contained"
                            color="secondary"
                            onClick={handleGenerateEmbedCode}
                            style={{ marginLeft: "10px" }}
                        >
                            Get Embed Code
                        </Button>
            </Box>
        </Box>
    );
};

export default ChatSection;
