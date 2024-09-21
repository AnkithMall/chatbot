import React from "react";
import { Button, List, ListItem, ListItemText, CircularProgress, Typography } from "@mui/material";

const ChatbotSidebar = ({ chatbots, loading, handleOpen, handleSelectChatbot, selectedChatbot }) => (
    <aside style={{ width: "25%", height: "90%", overflow: "scroll", borderRight: "1px solid #ccc", padding: "20px" }}>
        <Button variant="contained" onClick={handleOpen}>
            Create Chatbot
        </Button>
        {loading ? (
            <CircularProgress />
        ) : (
            <List>
                {chatbots.length > 0 ? chatbots.map((chatbot) => (
                    <ListItem
                        button
                        key={chatbot.id}
                        style={{
                            backgroundColor: chatbot.id === selectedChatbot?.id ? '#007bff' : 'transparent',
                            color: chatbot.id === selectedChatbot?.id ? '#fff' : '#000'
                        }}
                        onClick={() => handleSelectChatbot(chatbot)}
                    >
                        <ListItemText primary={chatbot.name} secondary={`ID: ${chatbot.id}`} />
                    </ListItem>
                )) : <Typography>No chatbots available</Typography>}
            </List>
        )}
    </aside>
);

export default ChatbotSidebar;
