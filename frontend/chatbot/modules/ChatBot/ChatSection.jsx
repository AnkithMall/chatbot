import React from "react";
import {
  Button,
  TextField,
  Typography,
} from "@mui/material";

const ChatSection = ({ chatMessages, message, setMessage, handleSendMessage }) => {
  return (
    <div style={{ width: "50%", paddingLeft: "10px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
        {chatMessages.map((msg, index) => (
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
              {msg.content}
            </Typography>
          </div>
        ))}
      </div>
      <div style={{ display: "flex", marginTop: "10px" }}>
        <TextField
          fullWidth
          label="Type your message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleSendMessage}
          style={{ marginLeft: "10px" }}
        >
          Send
        </Button>
      </div>
    </div>
  );
};

export default ChatSection;
