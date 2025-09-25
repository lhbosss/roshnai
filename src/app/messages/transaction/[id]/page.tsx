'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

// For now, let's use a simplified version that doesn't require the complex components
// We'll build it step by step to avoid import issues

interface TransactionData {
  id: string;
  status: string;
  book: {
    _id: string;
    title: string;
    author: string;
    lender: {
      _id: string;
      name: string;
    };
  };
  lender: string | { _id: string; name: string };
  borrower: string | { _id: string; name: string };
}

interface Message {
  _id: string;
  sender: {
    _id: string;
    name: string;
  };
  receiver: {
    _id: string;
    name: string;
  };
  content: string;
  type: string;
  templateId?: string;
  attachments?: Array<{
    type: string;
    filename: string;
    url: string;
    size: number;
  }>;
  priority: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  relatedTo?: {
    type: string;
    id?: string;
  };
}

export default function TransactionChatPage() {
  const params = useParams();
  const transactionId = params.id as string;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [transaction, setTransaction] = useState<TransactionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    loadMessages();
  }, [transactionId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/messages/transaction?transactionId=${transactionId}`);
      const data = await response.json();

      if (data.success) {
        setMessages(data.messages);
        setTransaction(data.transaction);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to load messages');
      console.error('Load messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch('/api/messages/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          content: newMessage,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setNewMessage('');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to send message');
      console.error('Send message error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button 
              onClick={loadMessages}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="flex h-[calc(100vh-4rem)] max-w-5xl mx-auto w-full">
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">Transaction not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-sm">
                  {transaction.book.title.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{transaction.book.title}</h2>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Transaction Chat</span>
                  <div className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {transaction.status}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message._id} className="flex justify-start">
                <div className="max-w-xs lg:max-w-md">
                  <div className="bg-white border rounded-lg px-4 py-2">
                    <p className="text-sm text-gray-900">{message.content}</p>
                    <div className="mt-1 text-xs text-gray-500">
                      <span>{message.sender.name}</span>
                      <span className="mx-1">•</span>
                      <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        
        {/* Input */}
        <div className="border-t bg-white p-4">
          <div className="flex space-x-3">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={sendMessage}
              disabled={!newMessage.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}