import React from "react";
import { TextField, Button, Typography, IconButton } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import axios from "axios";

const ChatbotDetails = ({ selectedChatbot, chatbotDetails, setChatbotDetails, loading, setLoading,setChatbots }) => {
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
                        url: ""
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

    const handleUpdateChatbot = async () => {
        if (!selectedChatbot) return;

        setLoading(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/update_assistant`, {
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
            prevChatbots.map((bot) => 
                bot.id === updatedChatbot.id ? updatedChatbot : bot
            )
            );

            setChatbotDetails(updatedChatbot);
        } catch (error) {
            console.error("Error updating chatbot:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ width: "50%", paddingRight: "10px", borderRight: "1px solid #ccc", height: "90vh", overflowY: "scroll" }}>
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

                            {/* Function URL */}
                            <TextField
                                label="Function URL"
                                name="url"
                                value={func.function.url}
                                onChange={(e) => handleFunctionChange(funcIndex, e)}
                                fullWidth
                                margin="normal"
                            />

                            {/* Function Parameters */}
                            {Object.entries(func.function.parameters.properties).map(([argName, argDetails]) => (
                                <div key={argName} style={{ display: "flex", alignItems: "center", marginBottom: "10px" }}>
                                    {/* Argument Name */}
                                    <TextField
                                        label="Argument Name"
                                        name={argName}
                                        value={argName}
                                        onChange={(e) => handleArgumentChange(funcIndex, argName, e)}
                                        fullWidth
                                        margin="normal"
                                    />

                                    {/* Argument Description */}
                                    <TextField
                                        label="Argument Description"
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
                            <Button variant="contained" onClick={() => handleAddArgument(funcIndex)} style={{ marginTop: "10px" }}>
                                Add Argument
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
                        style={{ marginTop: "20px" }}
                        onClick={handleUpdateChatbot}
                        disabled={loading}
                    >
                        {loading ? "Publishing..." : "Publish"}
                    </Button>
                </div>
            ) : (
                <Typography variant="h6">Select a chatbot to see the details</Typography>
            )}
        </div>
    );
};

export default ChatbotDetails;
