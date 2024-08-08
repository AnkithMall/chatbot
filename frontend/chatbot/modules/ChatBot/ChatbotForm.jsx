import React from "react";
import {
  Button,
  TextField,
  Typography,
  IconButton,
  Box,
} from "@mui/material";
import { Remove } from "@mui/icons-material";

const ChatbotForm = ({
  selectedChatbot,
  chatbotDetails,
  setChatbotDetails,
  handleCreateChatbot,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setChatbotDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };

  const handleFunctionChange = (index, e) => {
    const { name, value } = e.target;
    const updatedFunctions = chatbotDetails.functions.map((func, i) =>
      i === index ? { ...func, [name]: value } : func
    );
    setChatbotDetails((prevDetails) => ({
      ...prevDetails,
      functions: updatedFunctions,
    }));
  };

  const handleArgumentChange = (funcIndex, argIndex, e) => {
    const { name, value } = e.target;
    const updatedFunctions = chatbotDetails.functions.map((func, i) =>
      i === funcIndex
        ? {
            ...func,
            arguments: func.arguments.map((arg, j) =>
              j === argIndex ? { ...arg, [name]: value } : arg
            ),
          }
        : func
    );
    setChatbotDetails((prevDetails) => ({
      ...prevDetails,
      functions: updatedFunctions,
    }));
  };

  const handleAddArgument = (funcIndex) => {
    const updatedFunctions = chatbotDetails.functions.map((func, i) =>
      i === funcIndex
        ? { ...func, arguments: [...func.arguments, { name: "", description: "" }] }
        : func
    );
    setChatbotDetails((prevDetails) => ({
      ...prevDetails,
      functions: updatedFunctions,
    }));
  };

  const handleRemoveArgument = (funcIndex, argIndex) => {
    const updatedFunctions = chatbotDetails.functions.map((func, i) =>
      i === funcIndex
        ? {
            ...func,
            arguments: func.arguments.filter((_, j) => j !== argIndex),
          }
        : func
    );
    setChatbotDetails((prevDetails) => ({
      ...prevDetails,
      functions: updatedFunctions,
    }));
  };

  const handleAddFunction = () => {
    setChatbotDetails((prevDetails) => ({
      ...prevDetails,
      functions: [
        ...prevDetails.functions,
        {
          functionName: "",
          functionDescription: "",
          functionUrl: "",
          arguments: [{ name: "", description: "" }],
        },
      ],
    }));
  };

  const handleRemoveFunction = (index) => {
    const updatedFunctions = chatbotDetails.functions.filter((_, i) => i !== index);
    setChatbotDetails((prevDetails) => ({
      ...prevDetails,
      functions: updatedFunctions,
    }));
  };

  return (
    <div>
      <TextField
        label="Chatbot Name"
        name="name"
        value={chatbotDetails.name}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Instructions"
        name="instructions"
        value={chatbotDetails.instructions}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Model"
        name="model"
        value={chatbotDetails.model}
        onChange={handleChange}
        fullWidth
        margin="normal"
      />
      {chatbotDetails.functions.map((func, funcIndex) => (
        <div key={funcIndex} style={{ marginBottom: "20px" }}>
          <TextField
            label="Function Name"
            name="functionName"
            value={func.functionName}
            onChange={(e) => handleFunctionChange(funcIndex, e)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Function Description"
            name="functionDescription"
            value={func.functionDescription}
            onChange={(e) => handleFunctionChange(funcIndex, e)}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Function URL"
            name="functionUrl"
            value={func.functionUrl}
            onChange={(e) => handleFunctionChange(funcIndex, e)}
            fullWidth
            margin="normal"
          />
          {func.arguments.map((arg, argIndex) => (
            <div
              key={argIndex}
              style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}
            >
              <TextField
                label="Argument Name"
                name="name"
                value={arg.name}
                onChange={(e) => handleArgumentChange(funcIndex, argIndex, e)}
                fullWidth
                margin="normal"
              />
              <TextField
                label="Argument Description"
                name="description"
                value={arg.description}
                onChange={(e) => handleArgumentChange(funcIndex, argIndex, e)}
                fullWidth
                margin="normal"
              />
              <IconButton onClick={() => handleRemoveArgument(funcIndex, argIndex)}>
                <Remove />
              </IconButton>
            </div>
          ))}
          <Button
            variant="contained"
            onClick={() => handleAddArgument(funcIndex)}
            style={{ marginTop: "10px" }}
          >
            Add Argument
          </Button>
          <IconButton onClick={() => handleRemoveFunction(funcIndex)}>
            <Remove />
          </IconButton>
        </div>
      ))}
      <Button
        variant="contained"
        onClick={handleAddFunction}
        style={{ marginTop: "20px" }}
      >
        Add Function
      </Button>
      <Button
        variant="contained"
        color="primary"
        onClick={handleCreateChatbot}
        style={{ marginTop: "20px" }}
      >
        Create ChatBot
      </Button>
    </div>
  );
};

export default ChatbotForm;
