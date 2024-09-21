import React from "react";
import { Box, Button, Modal, TextField, Typography, IconButton } from "@mui/material";
import { Add, Remove } from "@mui/icons-material";
import axios from "axios";
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
const CreateChatbotModal = ({ open, handleClose, modalFormData, setModalFormData, setChatbots, setLoading, loading }) => {
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
            const response = await axios.post(`${import.meta.env.VITE_BASE_URL_BACKEND_SERVER}/create_assistant`, {
                name: modalFormData.name,
                instruction: modalFormData.instructions,
                model: modalFormData.model,
                tools: modalFormData.tools,
            });
            const newChatbot = {
                id: response.data.assistant_id,
                ...modalFormData,
            };
            setChatbots((prevChatbots) => [newChatbot, ...prevChatbots]);
            setModalFormData(getInitialChatbotDetails());
            handleClose();
        } catch (error) {
            console.error("Error creating chatbot:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal open={open} onClose={handleClose}>
            <Box sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 600, maxHeight: "80vh", overflowY: "auto", bgcolor: "background.paper", border: "2px solid #000", boxShadow: 24, p: 4 }}>
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

                        {/* Function URL */}
                        <TextField
                            label="Function URL"
                            name="url"
                            value={func.function.url}
                            onChange={(e) => handleModalFunctionChange(funcIndex, e)}
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
                                    onChange={(e) => handleModalArgumentChange(funcIndex, argName, e)}
                                    fullWidth
                                    margin="normal"
                                />

                                {/* Argument Description */}
                                <TextField
                                    label="Argument Description"
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
                        <Button variant="contained" onClick={() => handleAddArgumentToModal(funcIndex)} style={{ marginTop: "10px" }}>
                            Add Argument
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
                <Button variant="contained" onClick={handleCreateChatbot} style={{ marginTop: "20px" }} disabled={loading}>
                    {loading ? "Creating..." : "Create ChatBot"}
                </Button>
            </Box>
        </Modal>
    );
};

export default CreateChatbotModal;
