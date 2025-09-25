'use client';

import { useEffect, useRef } from 'react';

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

interface TransactionMessageListProps {
  messages: Message[];
}

export default function TransactionMessageList({ messages }: TransactionMessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getMessageTypeColor = (type: string) => {
    switch (type) {
      case 'system': return 'border-l-blue-400 bg-blue-50';
      case 'template': return 'border-l-green-400 bg-green-50';
      default: return 'border-l-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'normal': return 'text-gray-600';
      case 'low': return 'text-gray-400';
      default: return 'text-gray-600';
    }
  };

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
          <p className="text-gray-500 max-w-sm">
            Send a message to begin discussing the book exchange details with your transaction partner.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwnMessage = false; // We'll determine this based on current user context
        
        return (
          <div
            key={message._id}
            className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs lg:max-w-md ${isOwnMessage ? 'order-2' : 'order-1'}`}>
              {/* Message bubble */}
              <div className={`relative px-4 py-2 rounded-lg ${
                isOwnMessage 
                  ? 'bg-blue-500 text-white' 
                  : `bg-white border ${getMessageTypeColor(message.type)}`
              }`}>
                {/* Priority indicator */}
                {message.priority === 'high' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
                )}

                {/* Template indicator */}
                {message.templateId && (
                  <div className="text-xs text-gray-500 mb-1 flex items-center">
                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                    </svg>
                    Template
                  </div>
                )}

                {/* Message content */}
                <p className={`text-sm whitespace-pre-wrap ${
                  isOwnMessage ? 'text-white' : 'text-gray-900'
                }`}>
                  {message.content}
                </p>

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment, index) => (
                      <div key={index} className={`border rounded-lg p-2 ${
                        isOwnMessage ? 'border-blue-300 bg-blue-400' : 'border-gray-200 bg-gray-50'
                      }`}>
                        {attachment.type === 'image' ? (
                          <img 
                            src={attachment.url} 
                            alt={attachment.filename}
                            className="max-w-full h-auto rounded cursor-pointer hover:opacity-90"
                            onClick={() => window.open(attachment.url, '_blank')}
                          />
                        ) : (
                          <div className="flex items-center space-x-2">
                            <svg className={`w-4 h-4 ${
                              isOwnMessage ? 'text-blue-100' : 'text-gray-600'
                            }`} fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-medium truncate ${
                                isOwnMessage ? 'text-blue-100' : 'text-gray-900'
                              }`}>
                                {attachment.filename}
                              </p>
                              <p className={`text-xs ${
                                isOwnMessage ? 'text-blue-200' : 'text-gray-500'
                              }`}>
                                {formatFileSize(attachment.size)}
                              </p>
                            </div>
                            <button
                              onClick={() => window.open(attachment.url, '_blank')}
                              className={`text-xs underline ${
                                isOwnMessage ? 'text-blue-100 hover:text-white' : 'text-blue-600 hover:text-blue-800'
                              }`}
                            >
                              View
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Related context */}
                {message.relatedTo && (
                  <div className={`mt-1 text-xs ${
                    isOwnMessage ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    Related to: {message.relatedTo.type.replace('_', ' ')}
                  </div>
                )}
              </div>

              {/* Message metadata */}
              <div className={`mt-1 text-xs text-gray-500 ${
                isOwnMessage ? 'text-right' : 'text-left'
              }`}>
                <span>{message.sender.name}</span>
                <span className="mx-1">•</span>
                <span>{formatTime(message.createdAt)}</span>
                {message.isRead && message.readAt && (
                  <>
                    <span className="mx-1">•</span>
                    <span>Read</span>
                  </>
                )}
              </div>
            </div>

            {/* Avatar */}
            {!isOwnMessage && (
              <div className="order-1 mr-3">
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-xs font-medium text-gray-600">
                  {message.sender.name.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>
  );
}