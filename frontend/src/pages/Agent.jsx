import { useState, useEffect, useRef } from "react";
import axios from "axios";
import Navbar from "../components/Navbar";

function Agent() {
    const [request, setRequest] = useState("");
    const [messages, setMessages] = useState([
        { role: "assistant", content: "Hi! What would you like to accomplish today? I can help you create a checklist." }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleGenerate = async (e) => {
        e.preventDefault();
        
        if (!request.trim()) return;

        const newMessages = [...messages, { role: "user", content: request }];
        setMessages(newMessages);
        setRequest("");
        setIsLoading(true);

        try {
            const token = localStorage.getItem("token");

            const response = await axios.post(
                "http://localhost:5000/api/agent",
                {
                    messages: newMessages,
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            // Handle the response
            const aiMessage = response.data.message;
            let displayMessage = aiMessage;
            
            // Remove the JSON block from the display message if a checklist was generated
            const jsonMatch = aiMessage.match(/```json([\s\S]*?)```/);
            if (jsonMatch) {
                displayMessage = aiMessage.replace(/```json([\s\S]*?)```/, "").trim();
                if (!displayMessage) {
                    displayMessage = "I've generated a checklist for you! You can view it on your dashboard.";
                }
            }

            setMessages(prev => [...prev, { role: "assistant", content: displayMessage }]);

            // If a checklist was returned, we can inform the user
            if (response.data.checklist) {
                setMessages(prev => [...prev, { 
                    role: "assistant", 
                    content: `Your draft checklist "${response.data.checklist.title}" is ready. [Go to Dashboard](/dashboard) to review and approve it.`,
                    isLink: true 
                }]);
            }

        } catch (error) {
            console.error("Agent error:", error);
            setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error communicating with the server." }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <Navbar />

            <main className="agent-page" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)' }}>
                <div className="agent-container" style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
                    
                    <h1>AI Checklist Assistant</h1>
                    
                    <div style={{ flexGrow: 1, overflowY: 'auto', border: '1px solid #ccc', borderRadius: '8px', padding: '20px', marginBottom: '20px', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {messages.map((msg, idx) => (
                            <div key={idx} style={{ 
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                backgroundColor: msg.role === 'user' ? '#007bff' : '#e9ecef',
                                color: msg.role === 'user' ? 'white' : 'black',
                                padding: '10px 15px',
                                borderRadius: '15px',
                                maxWidth: '75%'
                            }}>
                                {msg.isLink ? (
                                    <span dangerouslySetInnerHTML={{ __html: msg.content.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: blue; text-decoration: underline;">$1</a>') }} />
                                ) : (
                                    <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
                                )}
                            </div>
                        ))}
                        {isLoading && (
                            <div style={{ alignSelf: 'flex-start', backgroundColor: '#e9ecef', padding: '10px 15px', borderRadius: '15px' }}>
                                <em>Thinking...</em>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form
                        className="agent-form"
                        onSubmit={handleGenerate}
                        style={{ display: 'flex', gap: '10px' }}
                    >
                        <input
                            type="text"
                            value={request}
                            onChange={(e) => setRequest(e.target.value)}
                            placeholder="Message the assistant..."
                            style={{ flexGrow: 1, padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
                            disabled={isLoading}
                        />
                        <button type="submit" disabled={isLoading} style={{ padding: '10px 20px', cursor: 'pointer' }}>
                            Send
                        </button>
                    </form>

                </div>
            </main>
        </div>
    );
}

export default Agent;