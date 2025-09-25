import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';
import { EscrowTransaction } from '@/models/EscrowTransaction';
import { Book } from '@/models/Book';
import { User } from '@/models/User';
import { renderTemplate, messageTemplates } from '@/lib/messageTemplates';

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const body = await request.json();
    const { 
      transactionId, 
      content, 
      templateId, 
      templateVariables, 
      attachments,
      priority = 'normal',
      relatedTo
    } = body;

    // Validate transaction exists and user is part of it
    const transaction = await EscrowTransaction.findById(transactionId)
      .populate('book', 'title lender')
      .populate('lender', 'name')
      .populate('borrower', 'name');

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    // Check if user is part of this transaction
    const isLender = transaction.lender._id.toString() === auth.id;
    const isBorrower = transaction.borrower._id.toString() === auth.id;

    if (!isLender && !isBorrower) {
      return NextResponse.json(
        { error: 'Not authorized for this transaction' },
        { status: 403 }
      );
    }

    const receiverId = isLender ? transaction.borrower._id : transaction.lender._id;
    let messageContent = content;

    // Handle template messages
    if (templateId) {
      const template = messageTemplates.find(t => t.id === templateId);
      if (!template) {
        return NextResponse.json(
          { error: 'Template not found' },
          { status: 400 }
        );
      }

      messageContent = renderTemplate(template, templateVariables || {});
    }

    // Create message
    const message = new Message({
      transaction: transactionId,
      book: transaction.book._id,
      sender: auth.id,
      receiver: receiverId,
      content: messageContent,
      type: templateId ? 'template' : 'text',
      templateId,
      attachments: attachments || [],
      priority,
      relatedTo
    });

    await message.save();

    // Populate the message for response
    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .populate('book', 'title')
      .populate('transaction', 'status');

    return NextResponse.json({
      success: true,
      message: populatedMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Verify user is part of the transaction
    const transaction = await EscrowTransaction.findById(transactionId);
    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const isLender = transaction.lender.toString() === auth.id;
    const isBorrower = transaction.borrower.toString() === auth.id;

    if (!isLender && !isBorrower) {
      return NextResponse.json(
        { error: 'Not authorized for this transaction' },
        { status: 403 }
      );
    }

    // Get messages for this transaction
    const messages = await Message.find({ transaction: transactionId })
      .populate('sender', 'name')
      .populate('receiver', 'name')
      .populate('book', 'title lender')
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset);

    // Mark messages as read by the current user
    await Message.updateMany(
      { 
        transaction: transactionId, 
        receiver: auth.id,
        isRead: false
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    return NextResponse.json({
      success: true,
      messages: messages.reverse(), // Return in chronological order
      transaction: {
        id: transaction._id,
        status: transaction.status,
        book: messages[0]?.book,
        lender: isLender ? 'me' : transaction.lender,
        borrower: isBorrower ? 'me' : transaction.borrower
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}