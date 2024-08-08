import React, { useState, useEffect } from "react";
import {
    Button,
    Modal,
    Box,
    TextField,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
} from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import axios from "axios";

const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 600,
    maxHeight: "80vh",
    overflowY: "auto",
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
};

export const ChatBot = () => {
    const [modalOpen, setModalOpen] = useState(false);
    const [chatbots, setChatbots] = useState([]);
    const [selectedChatbot, setSelectedChatbot] = useState(null);
    const [chatbotDetails, setChatbotDetails] = useState({
        name: "",
        instructions: "",
        model: "gpt-4o",
        tools: [
            {
                function: {
                    description: "",
                    name: "",
                    parameters: {
                        properties: {},
                        required: [],
                        type: "object",
                    },
                },
                type: "function",
            },
        ],
    });
    const [threadId, setThreadId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [message, setMessage] = useState("");

    useEffect(() => {
        const fetchChatbots = async () => {
            try {
                const response = await axios.get("http://127.0.0.1:5000/chatbots");
                setChatbots(response.data);
            } catch (error) {
                console.error("Error fetching chatbots:", error);
            }
        };

        fetchChatbots();
    }, []);

    const handleOpen = () => setModalOpen(true);
    const handleClose = () => setModalOpen(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setChatbotDetails((prevDetails) => ({
            ...prevDetails,
            [name]: value,
        }));
    };

    const handleFunctionChange = (index, e) => {
        const { name, value } = e.target;
        const updatedTools = chatbotDetails.tools.map((tool, i) =>
            i === index
                ? {
                    ...tool,
                    function: {
                        ...tool.function,
                        [name]: value,
                    },
                }
                : tool
        );
        setChatbotDetails((prevDetails) => ({
            ...prevDetails,
            tools: updatedTools,
        }));
    };

    const handleArgumentChange = (funcIndex, argName, e) => {
        const { name, value } = e.target;
        const updatedTools = chatbotDetails.tools.map((tool, i) =>
            i === funcIndex
                ? {
                    ...tool,
                    function: {
                        ...tool.function,
                        parameters: {
                            ...tool.function.parameters,
                            properties: {
                                ...tool.function.parameters.properties,
                                [argName]: {
                                    ...tool.function.parameters.properties[argName],
                                    [name]: value,
                                },
                            },
                        },
                    },
                }
                : tool
        );
        setChatbotDetails((prevDetails) => ({
            ...prevDetails,
            tools: updatedTools,
        }));
    };

    const handleAddArgument = (funcIndex) => {
        const newArgName = prompt("Enter new argument name:");
        if (!newArgName) return;
        const updatedTools = chatbotDetails.tools.map((tool, i) =>
            i === funcIndex
                ? {
                    ...tool,
                    function: {
                        ...tool.function,
                        parameters: {
                            ...tool.function.parameters,
                            properties: {
                                ...tool.function.parameters.properties,
                                [newArgName]: { description: "", type: "string" },
                            },
                            required: [...tool.function.parameters.required, newArgName],
                        },
                    },
                }
                : tool
        );
        setChatbotDetails((prevDetails) => ({
            ...prevDetails,
            tools: updatedTools,
        }));
    };

    const handleRemoveArgument = (funcIndex, argName) => {
        const updatedTools = chatbotDetails.tools.map((tool, i) =>
            i === funcIndex
                ? {
                    ...tool,
                    function: {
                        ...tool.function,
                        parameters: {
                            ...tool.function.parameters,
                            properties: Object.fromEntries(
                                Object.entries(tool.function.parameters.properties).filter(
                                    ([key]) => key !== argName
                                )
                            ),
                            required: tool.function.parameters.required.filter(
                                (name) => name !== argName
                            ),
                        },
                    },
                }
                : tool
        );
        setChatbotDetails((prevDetails) => ({
            ...prevDetails,
            tools: updatedTools,
        }));
    };

    const handleAddFunction = () => {
        setChatbotDetails((prevDetails) => ({
            ...prevDetails,
            tools: [
                ...prevDetails.tools,
                {
                    function: {
                        description: "",
                        name: "",
                        parameters: {
                            properties: {},
                            required: [],
                            type: "object",
                        },
                    },
                    type: "function",
                },
            ],
        }));
    };

    const handleRemoveFunction = (index) => {
        const updatedTools = chatbotDetails.tools.filter((_, i) => i !== index);
        setChatbotDetails((prevDetails) => ({
            ...prevDetails,
            tools: updatedTools,
        }));
    };

    const handleCreateChatbot = async () => {
        try {
            console.log(chatbotDetails);
            const response = await axios.post("http://127.0.0.1:5000/create_assistant", {
                name: chatbotDetails.name,
                instruction: chatbotDetails.instructions,
                model: chatbotDetails.model,
                tools: chatbotDetails.tools,
            });
            const newChatbot = {
                id: response.data.assistant_id,
                ...chatbotDetails,
            };
            setChatbots((prevChatbots) => [...prevChatbots, newChatbot]);
            setChatbotDetails({
                name: "",
                instructions: "",
                model: "gpt-4o",
                tools: [
                    {
                        function: {
                            description: "",
                            name: "",
                            parameters: {
                                properties: {},
                                required: [],
                                type: "object",
                            },
                        },
                        type: "function",
                    },
                ],
            });
            handleClose();
        } catch (error) {
            console.error("Error creating chatbot:", error);
        }
    };

    const handleSelectChatbot = (chatbot) => {
        setSelectedChatbot(chatbot);
        setChatbotDetails(chatbot);
        createThread(chatbot.id);
    };

    const createThread = async (assistantId) => {
        try {
            const response = await axios.post("/create_thread");
            setThreadId(response.data.thread_id);
        } catch (error) {
            console.error("Error creating thread:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!threadId || !message) return;
        try {
            await axios.post("/chat", {
                thread_id: threadId,
                message,
            });
            setChatMessages((prevMessages) => [...prevMessages, { role: "user", content: message }]);
            setMessage("");
            fetchMessages();
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const fetchMessages = async () => {
        try {
            const response = await axios.get(`/threads/${threadId}/messages`);
            setChatMessages(response.data.messages);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    };

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            {/* Sidebar */}
            <aside style={{ width: "25%", borderRight: "1px solid #ccc", padding: "20px" }}>
                <Button variant="contained" onClick={handleOpen}>
                    Create Chatbot
                </Button>
                <List>
                    {chatbots.length > 0 ? chatbots.map((chatbot) => (
                        <ListItem button key={chatbot.id} onClick={() => handleSelectChatbot(chatbot)}>
                            <ListItemText primary={chatbot.name} secondary={`ID: ${chatbot.id}`} />
                        </ListItem>
                    )) : <>Loading</>}
                </List>
            </aside>

            <div style={{ display: "flex", width: "75%", padding: "20px" }}>
                {/* Chatbot Details */}
                <div style={{ width: "50%", paddingRight: "10px", borderRight: "1px solid #ccc" }}>
                    {selectedChatbot ? (
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
                            {chatbotDetails.tools.map((func, funcIndex) => (
                                <div key={funcIndex} style={{ marginBottom: "20px" }}>
                                    {/* Function Name */}
                                    <TextField
                                        label="Function Name"
                                        name="name"
                                        value={func.function.name}
                                        onChange={(e) => handleFunctionChange(funcIndex, e)}
                                        fullWidth
                                        margin="normal"
                                    />

                                    {/* Function Description */}
                                    <TextField
                                        label="Function Description"
                                        name="description"
                                        value={func.function.description}
                                        onChange={(e) => handleFunctionChange(funcIndex, e)}
                                        fullWidth
                                        margin="normal"
                                    />

                                    {/* Function Parameters */}
                                    {Object.entries(func.function.parameters.properties).map(([argName, argDetails]) => (
                                        <div
                                            key={argName}
                                            style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}
                                        >
                                            {/* Variable Name */}
                                            <TextField
                                                label="Variable Name"
                                                name="name"
                                                value={argName}
                                                onChange={(e) => handleArgumentChange(funcIndex, argName, e)}
                                                fullWidth
                                                margin="normal"
                                            />

                                            {/* Variable Description */}
                                            <TextField
                                                label="Variable Description"
                                                name="description"
                                                value={argDetails.description}
                                                onChange={(e) => handleArgumentChange(funcIndex, argName, e)}
                                                fullWidth
                                                margin="normal"
                                            />

                                            {/* Remove Argument Button */}
                                            <IconButton onClick={() => handleRemoveArgument(funcIndex, argName)}>
                                                <Remove />
                                            </IconButton>
                                        </div>
                                    ))}

                                    {/* Add Argument Button */}
                                    <Button
                                        variant="contained"
                                        onClick={() => handleAddArgument(funcIndex)}
                                        style={{ marginTop: "10px" }}
                                    >
                                        Add Variable
                                    </Button>

                                    {/* Remove Function Button */}
                                    <IconButton onClick={() => handleRemoveFunction(funcIndex)}>
                                        <Remove />
                                    </IconButton>
                                </div>
                            ))}

                            <Button variant="contained" onClick={handleAddFunction} style={{ marginTop: "20px" }}>
                                Add Function
                            </Button>
                            <Button
                                variant="contained"
                                color="primary"
                                style={{ marginTop: "20px", marginBottom: "20px" }}
                                onClick={handleCreateChatbot}
                            >
                                Publish
                            </Button>
                        </div>
                    ) : (
                        <Typography variant="h6">Select a chatbot to see the details</Typography>
                    )}
                </div>

                {/* Chat Section */}
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
            </div>

            {/* Create Chatbot Modal */}
            <Modal open={modalOpen} onClose={handleClose}>
                <Box sx={modalStyle}>
                    <Typography variant="h6" component="h2">
                        Create Chatbot
                    </Typography>
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
                    {chatbotDetails.tools.map((func, funcIndex) => (
                        <div key={funcIndex} style={{ marginBottom: "20px" }}>
                            {/* Function Name */}
                            <TextField
                                label="Function Name"
                                name="name"
                                value={func.function.name}
                                onChange={(e) => handleFunctionChange(funcIndex, e)}
                                fullWidth
                                margin="normal"
                            />

                            {/* Function Description */}
                            <TextField
                                label="Function Description"
                                name="description"
                                value={func.function.description}
                                onChange={(e) => handleFunctionChange(funcIndex, e)}
                                fullWidth
                                margin="normal"
                            />

                            {/* Function Parameters */}
                            {Object.entries(func.function.parameters.properties).map(([argName, argDetails]) => (
                                <div
                                    key={argName}
                                    style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}
                                >
                                    {/* Variable Name */}
                                    <TextField
                                        label="Variable Name"
                                        name="name"
                                        value={argName}
                                        onChange={(e) => handleArgumentChange(funcIndex, argName, e)}
                                        fullWidth
                                        margin="normal"
                                    />

                                    {/* Variable Description */}
                                    <TextField
                                        label="Variable Description"
                                        name="description"
                                        value={argDetails.description}
                                        onChange={(e) => handleArgumentChange(funcIndex, argName, e)}
                                        fullWidth
                                        margin="normal"
                                    />

                                    {/* Remove Argument Button */}
                                    <IconButton onClick={() => handleRemoveArgument(funcIndex, argName)}>
                                        <Remove />
                                    </IconButton>
                                </div>
                            ))}

                            {/* Add Argument Button */}
                            <Button
                                variant="contained"
                                onClick={() => handleAddArgument(funcIndex)}
                                style={{ marginTop: "10px" }}
                            >
                                Add Variable
                            </Button>

                            {/* Remove Function Button */}
                            <IconButton onClick={() => handleRemoveFunction(funcIndex)}>
                                <Remove />
                            </IconButton>
                        </div>
                    ))}

                    <Button variant="contained" onClick={handleAddFunction} style={{ marginTop: "20px" }}>
                        Add Function
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateChatbot}
                        style={{ marginTop: "20px" }}
                    >
                        Create ChatBot
                    </Button>
                </Box>
            </Modal>
        </div>
    );
};
