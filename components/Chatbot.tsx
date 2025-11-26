import React, { useState, useRef, useEffect } from 'react';
import { getChatResponse } from '../services/geminiService';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Send, Bot, User } from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: "Bonjour ! Je suis l'assistant de FreelanceFlow. Comment puis-je vous aider aujourd'hui avec vos finances ?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const botResponseText = await getChatResponse(input);
      const botMessage: Message = { sender: 'bot', text: botResponseText };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = { sender: 'bot', text: "Désolé, une erreur s'est produite. Veuillez réessayer." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col p-4 md:p-8">
      <h2 className="text-2xl font-bold mb-6 text-light-text dark:text-dark-text">Assistant Chat</h2>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
              {msg.sender === 'bot' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
              )}
              <div className={`max-w-md p-3 rounded-xl ${msg.sender === 'user' ? 'bg-accent text-white' : 'bg-gray-200 dark:bg-dark-bg-secondary'}`}>
                <p className="text-sm" style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</p>
              </div>
               {msg.sender === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-dark-border flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
              )}
            </div>
          ))}
          {loading && (
             <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-gradient-start to-primary-gradient-end flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <div className={`max-w-md p-3 rounded-xl bg-gray-200 dark:bg-dark-bg-secondary flex items-center justify-center`}>
                   <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-gray-500 dark:bg-dark-text-tertiary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-gray-500 dark:bg-dark-text-tertiary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-gray-500 dark:bg-dark-text-tertiary rounded-full animate-bounce"></div>
                   </div>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-dark-border flex items-center gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Posez votre question..."
            className="flex-1 p-2 bg-gray-100 dark:bg-dark-bg-secondary border border-gray-300 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-accent"
            disabled={loading}
          />
          <Button type="submit" disabled={loading} className="!p-3">
            <Send className="w-5 h-5" />
          </Button>
        </form>
      </Card>
    </div>
  );
};