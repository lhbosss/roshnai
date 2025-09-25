'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import TransactionChatHeader from '@/components/messages/TransactionChatHeader';
import TransactionMessageList from '@/components/messages/TransactionMessageList';
import TransactionChatInput from '@/components/messages/TransactionChatInput';
import BookContextPanel from '@/components/messages/BookContextPanel';
import MessageTemplatePanel from '@/components/messages/MessageTemplatePanel';

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
  const [showTemplates, setShowTemplates] = useState(false);
  const [showBookContext, setShowBookContext] = useState(true);

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

  const sendMessage = async (content: string, templateId?: string, templateVariables?: Record<string, string>, attachments?: any[]) => {
    try {
      const response = await fetch('/api/messages/transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId,
          content,
          templateId,
          templateVariables,
          attachments,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setMessages(prev => [...prev, data.message]);
        setShowTemplates(false);
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to send message');
      console.error('Send message error:', err);
    }
  };

  const uploadFile = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('transactionId', transactionId);
      formData.append('type', file.type.startsWith('image/') ? 'image' : 'document');

      const response = await fetch('/api/messages/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        return data.file;
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      console.error('Upload error:', err);
      throw err;
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
      {/* Book Context Sidebar */}
      {showBookContext && (
        <div className="w-80 border-r bg-gray-50 flex-shrink-0">
          <BookContextPanel 
            transaction={transaction}
            onClose={() => setShowBookContext(false)}
          />
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TransactionChatHeader 
          transaction={transaction}
          onToggleBookContext={() => setShowBookContext(!showBookContext)}
          onToggleTemplates={() => setShowTemplates(!showTemplates)}
          showBookContext={showBookContext}
          showTemplates={showTemplates}
        />
        
        <div className="flex-1 min-h-0">
          <TransactionMessageList messages={messages} />
        </div>
        
        <TransactionChatInput 
          onSendMessage={sendMessage}
          onUploadFile={uploadFile}
          transactionStatus={transaction.status}
        />
      </div>

      {/* Template Sidebar */}
      {showTemplates && (
        <div className="w-80 border-l bg-gray-50 flex-shrink-0">
          <MessageTemplatePanel
            transactionStatus={transaction.status}
            bookTitle={transaction.book.title}
            onSelectTemplate={(template, variables) => {
              sendMessage('', template.id, variables);
            }}
            onClose={() => setShowTemplates(false)}
          />
        </div>
      )}
    </div>
  );
}