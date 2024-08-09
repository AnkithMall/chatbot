import React, { useState, useEffect, useCallback } from "react";
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
    CircularProgress,
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
    const [chatbotDetails, setChatbotDetails] = useState(null); // For selected chatbot details, now editable
    const [modalFormData, setModalFormData] = useState(getInitialChatbotDetails()); // Separate state for modal form
    const [threadId, setThreadId] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchChatbots = async () => {
            setLoading(true);
            try {
                const response = await axios.get("http://127.0.0.1:5000/chatbots");
                setChatbots(response.data);
            } catch (error) {
                console.error("Error fetching chatbots:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchChatbots();
    }, []);

    const handleUpdateChatbot = async () => {
        if (!selectedChatbot) return;
        
        setLoading(true);
        try {
            const response = await axios.post("http://127.0.0.1:5000/update_assistant", {
                asst_id: selectedChatbot.id,
                name: chatbotDetails.name,
                instruction: chatbotDetails.instructions,
                model: chatbotDetails.model,
                tools: chatbotDetails.tools,
            });
            
            const updatedChatbot = {
                id: response.data.assistant_id,
                ...chatbotDetails,
            };
            
            setChatbots((prevChatbots) =>
                prevChatbots.map((bot) => bot.id === updatedChatbot.id ? updatedChatbot : bot)
            );
            
            // Optionally reset any unsaved changes if needed
            setChatbotDetails(updatedChatbot);
        } catch (error) {
            console.error("Error updating chatbot:", error);
        } finally {
            setLoading(false);
        }
    };
    

    const handleOpen = () => setModalOpen(true);
    const handleClose = () => {
        setModalFormData(getInitialChatbotDetails()); // Reset modal form on close
        setModalOpen(false);
    };

    const handleModalChange = (e) => {
        const { name, value } = e.target;
        setModalFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleModalFunctionChange = (index, e) => {
        const { name, value } = e.target;
        const updatedTools = modalFormData.tools.map((tool, i) =>
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
        setModalFormData((prevData) => ({
            ...prevData,
            tools: updatedTools,
        }));
    };

    const handleModalArgumentChange = (funcIndex, argName, e) => {
        const { name, value } = e.target;
        const updatedTools = modalFormData.tools.map((tool, i) =>
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
        setModalFormData((prevData) => ({
            ...prevData,
            tools: updatedTools,
        }));
    };

    const handleAddArgumentToModal = (funcIndex) => {
        const newArgName = prompt("Enter new argument name:");
        if (!newArgName) return;
        const updatedTools = modalFormData.tools.map((tool, i) =>
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
        setModalFormData((prevData) => ({
            ...prevData,
            tools: updatedTools,
        }));
    };

    const handleRemoveArgumentFromModal = (funcIndex, argName) => {
        const updatedTools = modalFormData.tools.map((tool, i) =>
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
        setModalFormData((prevData) => ({
            ...prevData,
            tools: updatedTools,
        }));
    };

    const handleAddFunctionToModal = () => {
        setModalFormData((prevData) => ({
            ...prevData,
            tools: [
                ...prevData.tools,
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

    const handleRemoveFunctionFromModal = (index) => {
        const updatedTools = modalFormData.tools.filter((_, i) => i !== index);
        setModalFormData((prevData) => ({
            ...prevData,
            tools: updatedTools,
        }));
    };

    const handleCreateChatbot = async () => {
        setLoading(true);
        try {
            const response = await axios.post("http://127.0.0.1:5000/create_assistant", {
                name: modalFormData.name,
                instruction: modalFormData.instructions,
                model: modalFormData.model,
                tools: modalFormData.tools,
            });
            const newChatbot = {
                id: response.data.assistant_id,
                ...modalFormData,
            };
            setChatbots((prevChatbots) => [...prevChatbots, newChatbot]);
            setModalFormData(getInitialChatbotDetails()); // Reset the modal form
            handleClose(); // Close the modal after creating a chatbot
        } catch (error) {
            console.error("Error creating chatbot:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectChatbot = (chatbot) => {
        setThreadId(null);
        setSelectedChatbot(chatbot);
        setChatbotDetails(chatbot);
        createThread(chatbot.id);
        setChatMessages([]); // Clear chat messages
        setMessage(""); 
    };

    const handleChatbotDetailsChange = (e) => {
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

    const createThread = useCallback(async (assistantId) => {
        try {
            const response = await axios.post("http://127.0.0.1:5000/create_thread");
            setThreadId(response.data.thread_id);
        } catch (error) {
            console.error("Error creating thread:", error);
        }
    }, []);

    const handleSendMessage = async () => {
        console.log(threadId,message);
        if (!threadId || !message.trim()) return;
        try {
            await axios.post("http://127.0.0.1:5000/chat", {
                thread_id: threadId,
                message,
            });
            setChatMessages((prevMessages) => [
                ...prevMessages,
                { role: "user", content: message }
            ]);
            setMessage("");
            fetchMessages(); // Fetch messages after sending a new one
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    const fetchMessages = useCallback(async () => {
        console.log("thread id => ",threadId);
        if (!threadId) return;
        try {
            const response = await axios.get(`http://127.0.0.1:5000/threads/${threadId}/messages`);
            const messages = response.data.messages.map(msg => ({
                role: msg.role,
                content: msg.content.map(part => part.text.value).join(' ')
            }));
            setChatMessages(messages);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    }, [threadId]);

    return (
        <div style={{ display: "flex", height: "100vh" }}>
            {/* Sidebar */}
            <aside style={{ width: "25%", borderRight: "1px solid #ccc", padding: "20px" }}>
                <Button variant="contained" onClick={handleOpen}>
                    Create Chatbot
                </Button>
                {loading ? (
                    <CircularProgress />
                ) : (
                    <List>
                        {chatbots.length > 0 ? chatbots.map((chatbot) => (
                            <ListItem button key={chatbot.id} onClick={() => handleSelectChatbot(chatbot)}>
                                <ListItemText primary={chatbot.name} secondary={`ID: ${chatbot.id}`} />
                            </ListItem>
                        )) : <Typography>No chatbots available</Typography>}
                    </List>
                )}
            </aside>

            <div style={{ display: "flex", width: "75%", padding: "20px" }}>
                {/* Chatbot Details */}
                <div style={{ width: "50%", paddingRight: "10px", borderRight: "1px solid #ccc" ,height: "100vh", overflowY: "scroll" }}>
                    {selectedChatbot ? (
                        <div>
                            <TextField
                                label="Chatbot Name"
                                name="name"
                                value={chatbotDetails?.name || ""}
                                onChange={handleChatbotDetailsChange}
                                fullWidth
                                margin="normal"
                            />
                            <TextField
                                label="Instructions"
                                name="instructions"
                                value={chatbotDetails?.instructions || ""}
                                onChange={handleChatbotDetailsChange}
                                fullWidth
                                margin="normal"
                            />
                            <TextField
                                label="Model"
                                name="model"
                                value={chatbotDetails?.model || ""}
                                onChange={handleChatbotDetailsChange}
                                fullWidth
                                margin="normal"
                            />
                            {chatbotDetails?.tools.map((func, funcIndex) => (
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
                                                name={argName}
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
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <Button
                                variant="contained"
                                color="primary"
                                style={{ marginTop: "20px" }}
                                onClick={handleUpdateChatbot} // Hook this to update logic when ready
                                disabled={loading}
                            >
                                {loading ? "Publishing..." : "Publish"}
                            </Button>
                        </div>
                    ) : (
                        <Typography variant="h6">Select a chatbot to see the details</Typography>
                    )}
                </div>

                {/* Chat Section */}
                <div style={{ width: "50%", paddingLeft: "10px", display: "flex", flexDirection: "column",height: "100vh", overflowY: "scroll"  }}>
                    <div style={{ flex: 1, overflowY: "auto", border: "1px solid #ccc", padding: "10px" }}>
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
                        value={modalFormData.name}
                        onChange={handleModalChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Instructions"
                        name="instructions"
                        value={modalFormData.instructions}
                        onChange={handleModalChange}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Model"
                        name="model"
                        value={modalFormData.model}
                        onChange={handleModalChange}
                        fullWidth
                        margin="normal"
                    />
                    {modalFormData.tools.map((func, funcIndex) => (
                        <div key={funcIndex} style={{ marginBottom: "20px" }}>
                            {/* Function Name */}
                            <TextField
                                label="Function Name"
                                name="name"
                                value={func.function.name}
                                onChange={(e) => handleModalFunctionChange(funcIndex, e)}
                                fullWidth
                                margin="normal"
                            />

                            {/* Function Description */}
                            <TextField
                                label="Function Description"
                                name="description"
                                value={func.function.description}
                                onChange={(e) => handleModalFunctionChange(funcIndex, e)}
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
                                        name={argName}
                                        value={argName}
                                        onChange={(e) => handleModalArgumentChange(funcIndex, argName, e)}
                                        fullWidth
                                        margin="normal"
                                    />

                                    {/* Variable Description */}
                                    <TextField
                                        label="Variable Description"
                                        name="description"
                                        value={argDetails.description}
                                        onChange={(e) => handleModalArgumentChange(funcIndex, argName, e)}
                                        fullWidth
                                        margin="normal"
                                    />

                                    {/* Remove Argument Button */}
                                    <IconButton onClick={() => handleRemoveArgumentFromModal(funcIndex, argName)}>
                                        <Remove />
                                    </IconButton>
                                </div>
                            ))}

                            {/* Add Argument Button */}
                            <Button
                                variant="contained"
                                onClick={() => handleAddArgumentToModal(funcIndex)}
                                style={{ marginTop: "10px" }}
                            >
                                Add Variable
                            </Button>

                            {/* Remove Function Button */}
                            <IconButton onClick={() => handleRemoveFunctionFromModal(funcIndex)}>
                                <Remove />
                            </IconButton>
                        </div>
                    ))}

                    <Button variant="contained" onClick={handleAddFunctionToModal} style={{ marginTop: "20px" }}>
                        Add Function
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleCreateChatbot}
                        style={{ marginTop: "20px" }}
                        disabled={loading}
                    >
                        {loading ? "Creating..." : "Create ChatBot"}
                    </Button>
                </Box>
            </Modal>
        </div>
    );
};

// Helper function for initial state
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
            },
        },
    ],
});
