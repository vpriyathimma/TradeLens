import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import axios from 'axios';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'bot', content: 'Hi! I\'m TradeLens AI. Ask me about stocks, Nifty 50, or investment strategies!' }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsLoading(true);

        try {
            const response = await axios.post('http://localhost:5000/api/chat', {
                message: userMessage
            });

            setMessages(prev => [...prev, {
                role: 'bot',
                content: response.data.response
            }]);
        } catch (error) {
            setMessages(prev => [...prev, {
                role: 'bot',
                content: 'Sorry, I\'m having trouble responding. Please try again later.'
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg z-50"
                style={{ background: 'linear-gradient(135deg, #E8A0B0 0%, #D4A0B0 100%)' }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {isOpen ? <X size={24} className="text-white" /> : <MessageCircle size={24} className="text-white" />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-24 right-6 w-80 sm:w-96 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            border: '1px solid var(--border-color)',
                            maxHeight: '500px'
                        }}
                    >
                        {/* Header */}
                        <div
                            className="p-4 flex items-center gap-3"
                            style={{ background: 'linear-gradient(135deg, #E8A0B0 0%, #D4A0B0 100%)' }}
                        >
                            <Bot size={24} className="text-white" />
                            <div>
                                <h3 className="font-semibold text-white">TradeLens AI</h3>
                                <p className="text-xs text-white/80">Ask about stocks</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div
                            className="p-4 overflow-y-auto"
                            style={{ height: '300px', backgroundColor: 'var(--bg-primary)' }}
                        >
                            {messages.map((msg, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex gap-2 mb-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    {msg.role === 'bot' && (
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'linear-gradient(135deg, #E8A0B0 0%, #D4A0B0 100%)' }}>
                                            <Bot size={14} className="text-white" />
                                        </div>
                                    )}
                                    <div
                                        className={`px-3 py-2 rounded-xl max-w-[75%] text-sm`}
                                        style={{
                                            backgroundColor: msg.role === 'user' ? '#E8A0B0' : 'var(--bg-secondary)',
                                            color: msg.role === 'user' ? 'white' : 'var(--text-primary)'
                                        }}
                                    >
                                        {msg.content}
                                    </div>
                                    {msg.role === 'user' && (
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                            <User size={14} style={{ color: 'var(--text-muted)' }} />
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-2">
                                    <div className="w-7 h-7 rounded-full flex items-center justify-center"
                                        style={{ background: 'linear-gradient(135deg, #E8A0B0 0%, #D4A0B0 100%)' }}>
                                        <Bot size={14} className="text-white" />
                                    </div>
                                    <div className="px-3 py-2 rounded-xl" style={{ backgroundColor: 'var(--bg-secondary)' }}>
                                        <div className="flex gap-1">
                                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#E8A0B0', animationDelay: '0ms' }}></span>
                                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#E8A0B0', animationDelay: '150ms' }}></span>
                                            <span className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#E8A0B0', animationDelay: '300ms' }}></span>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-3 flex gap-2" style={{ backgroundColor: 'var(--bg-card)', borderTop: '1px solid var(--border-color)' }}>
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about stocks..."
                                className="flex-1 px-3 py-2 rounded-xl text-sm outline-none"
                                style={{
                                    backgroundColor: 'var(--bg-secondary)',
                                    color: 'var(--text-primary)',
                                    border: '1px solid var(--border-color)'
                                }}
                            />
                            <motion.button
                                onClick={sendMessage}
                                disabled={isLoading || !input.trim()}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="w-10 h-10 rounded-xl flex items-center justify-center"
                                style={{
                                    background: 'linear-gradient(135deg, #E8A0B0 0%, #D4A0B0 100%)',
                                    opacity: isLoading || !input.trim() ? 0.5 : 1
                                }}
                            >
                                <Send size={18} className="text-white" />
                            </motion.button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
};

export default ChatWidget;
