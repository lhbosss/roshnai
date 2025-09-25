'use client';

import { useState } from 'react';
import { MessageTemplate, getTemplatesForContext, getQuickReplies } from '@/lib/messageTemplates';

interface MessageTemplatePanelProps {
  transactionStatus: string;
  bookTitle: string;
  onSelectTemplate: (template: MessageTemplate, variables: Record<string, string>) => void;
  onClose: () => void;
}

export default function MessageTemplatePanel({
  transactionStatus,
  bookTitle,
  onSelectTemplate,
  onClose
}: MessageTemplatePanelProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [templateVariables, setTemplateVariables] = useState<Record<string, string>>({
    bookTitle: bookTitle
  });
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);

  // Get templates based on user role (we'll assume 'both' for now)
  const allTemplates = getTemplatesForContext('both');
  const quickReplies = getQuickReplies(transactionStatus, 'lender'); // Default to lender, this should be dynamic based on user role

  const filteredTemplates = selectedCategory === 'all' 
    ? allTemplates
    : allTemplates.filter(template => template.category === selectedCategory);

  const categories = [
    { id: 'all', name: 'All Templates', icon: '📝' },
    { id: 'pickup', name: 'Pickup', icon: '📍' },
    { id: 'condition', name: 'Condition', icon: '📷' },
    { id: 'delay', name: 'Delays', icon: '⏰' },
    { id: 'return', name: 'Return', icon: '📚' },
    { id: 'general', name: 'General', icon: '💬' }
  ];

  const handleTemplateSelect = (template: MessageTemplate) => {
    if (template.variables && template.variables.length > 0) {
      setSelectedTemplate(template);
    } else {
      onSelectTemplate(template, templateVariables);
    }
  };

  const handleSendTemplate = () => {
    if (selectedTemplate) {
      onSelectTemplate(selectedTemplate, templateVariables);
      setSelectedTemplate(null);
      setTemplateVariables({ bookTitle });
    }
  };

  const handleVariableChange = (variable: string, value: string) => {
    setTemplateVariables(prev => ({
      ...prev,
      [variable]: value
    }));
  };

  const renderTemplatePreview = (template: MessageTemplate) => {
    let preview = template.content;
    if (template.variables) {
      template.variables.forEach(variable => {
        const value = templateVariables[variable] || `[${variable}]`;
        preview = preview.replace(new RegExp(`{{${variable}}}`, 'g'), value);
      });
    }
    return preview;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Message Templates</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Quick Replies for Current Status */}
      {quickReplies.length > 0 && !selectedTemplate && (
        <div className="p-4 border-b bg-green-50">
          <h4 className="text-sm font-medium text-green-800 mb-2">Quick Replies</h4>
          <div className="space-y-2">
            {quickReplies.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                className="w-full text-left p-2 bg-white border border-green-200 rounded-lg hover:bg-green-50 text-sm"
              >
                <div className="font-medium text-green-700">{template.name}</div>
                <div className="text-green-600 mt-1 text-xs line-clamp-2">
                  {renderTemplatePreview(template)}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Template Variable Form */}
      {selectedTemplate && (
        <div className="p-4 border-b bg-blue-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-blue-800">{selectedTemplate.name}</h4>
            <button
              onClick={() => setSelectedTemplate(null)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3">
            {selectedTemplate.variables?.map((variable) => (
              <div key={variable}>
                <label className="block text-xs font-medium text-blue-700 mb-1 capitalize">
                  {variable.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </label>
                <input
                  type="text"
                  value={templateVariables[variable] || ''}
                  onChange={(e) => handleVariableChange(variable, e.target.value)}
                  className="w-full px-3 py-2 border border-blue-200 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder={`Enter ${variable}`}
                />
              </div>
            ))}

            <div className="mt-3 p-3 bg-white border border-blue-200 rounded-md">
              <p className="text-xs text-blue-600 mb-2">Preview:</p>
              <p className="text-sm text-gray-900 whitespace-pre-wrap">
                {renderTemplatePreview(selectedTemplate)}
              </p>
            </div>

            <button
              onClick={handleSendTemplate}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Send Message
            </button>
          </div>
        </div>
      )}

      {/* Category Tabs */}
      {!selectedTemplate && (
        <div className="border-b bg-white">
          <div className="flex overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 ${
                  selectedCategory === category.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates List */}
      {!selectedTemplate && (
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 space-y-3">
            {filteredTemplates.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-sm">No templates available for this category</p>
              </div>
            ) : (
              filteredTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full text-left p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h5 className="font-medium text-gray-900 text-sm">{template.name}</h5>
                    {template.priority === 'high' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        High Priority
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-sm line-clamp-3 mb-2">
                    {renderTemplatePreview(template)}
                  </p>
                  <div className="flex items-center text-xs text-gray-500">
                    <span className="capitalize">{template.category}</span>
                    {template.variables && template.variables.length > 0 && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{template.variables.length} variable{template.variables.length > 1 ? 's' : ''}</span>
                      </>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}