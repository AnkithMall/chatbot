import React, { useState, useEffect, useCallback } from "react";
import { Box } from "@mui/material";
import axios from "axios";
import io from "socket.io-client";

import ChatbotSidebar from "../../modules/ChatBot/ChatbotSidebar";
import ChatbotDetails from "../../modules/ChatBot/ChatbotDetails";
import ChatSection from "../../modules/ChatBot/ChatSection";
import CreateChatbotModal from "../../modules/ChatBot/CreateChatbotModal";

const socket = io(import.meta.env.VITE_BASE_URL_BACKEND_SERVER);

export const ChatBot = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [chatbots, setChatbots] = useState([]);
    const [selectedChatbot, setSelectedChatbot] = useState(null);
    const [chatbotDetails, setChatbotDetails] = useState(null);
    const [modalFormData, setModalFormData] = useState(getInitialChatbotDetails());
    const [threadId, setThreadId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);  // Ensure loading state is defined here

    useEffect(() => {
        fetchChatbots();
    }, []);

    const fetchChatbots = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/chatbots`);
            setChatbots(response.data);
        } catch (error) {
            console.error("Error fetching chatbots:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectChatbot = (chatbot) => {
        setThreadId(null);
        setSelectedChatbot(chatbot);
        setChatbotDetails(chatbot);
        setChatMessages([]);
        setMessage("");
    };

    return (
        <Box style={{ display: "flex", height: "100vh" }}>
            <ChatbotSidebar
                chatbots={chatbots}
                loading={loading}
                handleOpen={() => setModalOpen(true)}
                handleSelectChatbot={handleSelectChatbot}
                selectedChatbot={selectedChatbot}
            />
            <Box style={{ display: "flex", width: "75%", padding: "20px" }}>
                <ChatbotDetails
                    selectedChatbot={selectedChatbot}
                    chatbotDetails={chatbotDetails}
                    setChatbotDetails={setChatbotDetails}
                    setChatbots={setChatbots} 
                    setLoading={setLoading}  // Pass loading and setLoading here
                    loading={loading}  // Pass loading state to the details component
                />
                <ChatSection
                    chatMessages={chatMessages}
                    message={message}
                    setMessage={setMessage}
                    threadId={threadId}
                    setThreadId={setThreadId}
                    selectedChatbot={selectedChatbot}
                    socket={socket}
                    setChatMessages={setChatMessages}
                />
            </Box>
            <CreateChatbotModal
                open={modalOpen}
                handleClose={() => setModalOpen(false)}
                modalFormData={modalFormData}
                setModalFormData={setModalFormData}
                setChatbots={setChatbots}
                setLoading={setLoading}  // Pass setLoading to the modal
                loading={loading}  // Pass loading state to the modal
            />
        </Box>
    );
};

const getInitialChatbotDetails = () => ({
    name: "",
    instructions: "",
    model: "gpt-4o",
    tools: [
        {
            type: "function",
            function: {
                description: "",
                name: "",
                parameters: {
                    properties: {},
                    required: [],
                    type: "object",
                },
                url: ""
            },
        },
    ],
});
