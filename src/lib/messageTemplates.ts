export interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: 'pickup' | 'condition' | 'delay' | 'return' | 'general';
  variables?: string[];
  context: 'lender' | 'borrower' | 'both';
  priority?: 'low' | 'normal' | 'high';
}

export const messageTemplates: MessageTemplate[] = [
  // Pickup Templates
  {
    id: 'pickup_ready',
    name: 'Book Ready for Pickup',
    content: 'Hi! Your book "{{bookTitle}}" is ready for pickup. I\'m available {{timeSlot}}. Please let me know what works best for you.',
    category: 'pickup',
    variables: ['bookTitle', 'timeSlot'],
    context: 'lender',
    priority: 'high'
  },
  {
    id: 'pickup_request',
    name: 'Request Pickup Time',
    content: 'Hi! When would be a good time to pick up "{{bookTitle}}"? I\'m generally available {{availability}}.',
    category: 'pickup',
    variables: ['bookTitle', 'availability'],
    context: 'borrower'
  },
  {
    id: 'pickup_location',
    name: 'Confirm Pickup Location',
    content: 'Just to confirm, we\'re meeting at {{location}} to exchange "{{bookTitle}}". See you there!',
    category: 'pickup',
    variables: ['bookTitle', 'location'],
    context: 'both'
  },

  // Condition Templates
  {
    id: 'condition_report',
    name: 'Book Condition Report',
    content: 'Here\'s the current condition of "{{bookTitle}}". Please review the attached photos. {{conditionNotes}}',
    category: 'condition',
    variables: ['bookTitle', 'conditionNotes'],
    context: 'both',
    priority: 'high'
  },
  {
    id: 'condition_good',
    name: 'Good Condition Confirmation',
    content: 'The book "{{bookTitle}}" is in excellent condition. Thank you for taking good care of it!',
    category: 'condition',
    variables: ['bookTitle'],
    context: 'both'
  },
  {
    id: 'condition_issue',
    name: 'Condition Issue Report',
    content: 'I noticed some damage to "{{bookTitle}}": {{issueDescription}}. Can we discuss this?',
    category: 'condition',
    variables: ['bookTitle', 'issueDescription'],
    context: 'both',
    priority: 'high'
  },

  // Delay Templates
  {
    id: 'delay_pickup',
    name: 'Pickup Delay',
    content: 'Sorry, I need to delay the pickup of "{{bookTitle}}". {{reason}}. New proposed time: {{newTime}}',
    category: 'delay',
    variables: ['bookTitle', 'reason', 'newTime'],
    context: 'both'
  },
  {
    id: 'delay_return',
    name: 'Return Delay',
    content: 'I need to extend the rental period for "{{bookTitle}}" by {{extensionDays}} days. {{reason}}. Is this okay?',
    category: 'delay',
    variables: ['bookTitle', 'extensionDays', 'reason'],
    context: 'borrower',
    priority: 'high'
  },

  // Return Templates
  {
    id: 'return_ready',
    name: 'Ready to Return',
    content: 'I\'m ready to return "{{bookTitle}}". When would be a good time for you? The book is in {{condition}}.',
    category: 'return',
    variables: ['bookTitle', 'condition'],
    context: 'borrower'
  },
  {
    id: 'return_complete',
    name: 'Return Completed',
    content: 'Thank you for returning "{{bookTitle}}" in great condition! Hope you enjoyed it. Feel free to browse my other books.',
    category: 'return',
    variables: ['bookTitle'],
    context: 'lender'
  },

  // General Templates
  {
    id: 'general_thanks',
    name: 'Thank You',
    content: 'Thank you for the smooth transaction with "{{bookTitle}}". Great doing business with you!',
    category: 'general',
    variables: ['bookTitle'],
    context: 'both'
  },
  {
    id: 'general_question',
    name: 'General Question',
    content: 'Hi! I have a question about "{{bookTitle}}": {{question}}',
    category: 'general',
    variables: ['bookTitle', 'question'],
    context: 'both'
  },
  {
    id: 'emergency_contact',
    name: 'Emergency Contact',
    content: 'Hi, this is regarding "{{bookTitle}}". {{urgentMessage}}. Please contact me as soon as possible.',
    category: 'general',
    variables: ['bookTitle', 'urgentMessage'],
    context: 'both',
    priority: 'high'
  }
];

// Helper function to render template with variables
export function renderTemplate(template: MessageTemplate, variables: Record<string, string>): string {
  let content = template.content;
  
  // Replace variables in the template
  if (template.variables) {
    template.variables.forEach(variable => {
      const value = variables[variable] || `{{${variable}}}`;
      content = content.replace(new RegExp(`{{${variable}}}`, 'g'), value);
    });
  }
  
  return content;
}

// Get templates for specific context and category
export function getTemplatesForContext(
  context: 'lender' | 'borrower' | 'both',
  category?: string
): MessageTemplate[] {
  return messageTemplates.filter(template => {
    const contextMatch = template.context === context || template.context === 'both';
    const categoryMatch = !category || template.category === category;
    return contextMatch && categoryMatch;
  });
}

// Get quick reply templates based on transaction status
export function getQuickReplies(
  transactionStatus: string,
  userRole: 'lender' | 'borrower'
): MessageTemplate[] {
  const quickReplies: MessageTemplate[] = [];

  switch (transactionStatus) {
    case 'paid':
      if (userRole === 'lender') {
        quickReplies.push(
          messageTemplates.find(t => t.id === 'pickup_ready')!,
          messageTemplates.find(t => t.id === 'pickup_location')!
        );
      } else {
        quickReplies.push(
          messageTemplates.find(t => t.id === 'pickup_request')!
        );
      }
      break;

    case 'confirmed':
      if (userRole === 'lender') {
        quickReplies.push(
          messageTemplates.find(t => t.id === 'condition_report')!
        );
      } else {
        quickReplies.push(
          messageTemplates.find(t => t.id === 'condition_good')!,
          messageTemplates.find(t => t.id === 'condition_issue')!
        );
      }
      break;

    case 'active':
      if (userRole === 'borrower') {
        quickReplies.push(
          messageTemplates.find(t => t.id === 'return_ready')!,
          messageTemplates.find(t => t.id === 'delay_return')!
        );
      }
      break;

    case 'completed':
      quickReplies.push(
        messageTemplates.find(t => t.id === 'general_thanks')!
      );
      break;
  }

  return quickReplies.filter(Boolean);
}