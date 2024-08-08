import React from "react";
import { Button, List, ListItem, ListItemText } from "@mui/material";

const Sidebar = ({ chatbots, onOpenModal, onSelectChatbot }) => {
  return (
    <aside style={{ width: "25%", borderRight: "1px solid #ccc", padding: "20px" }}>
      <Button variant="contained" onClick={onOpenModal}>
        Create Chatbot
      </Button>
      <List>
        {chatbots.map((chatbot) => (
          <ListItem button key={chatbot.id} onClick={() => onSelectChatbot(chatbot)}>
            <ListItemText primary={chatbot.name} secondary={`ID: ${chatbot.id}`} />
          </ListItem>
        ))}
      </List>
    </aside>
  );
};

export default Sidebar;
