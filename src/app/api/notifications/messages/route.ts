import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';

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
    const userId = searchParams.get('userId');

    if (!userId || userId !== auth.id) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 403 }
      );
    }

    // Get recent unread messages for user's transactions
    const recentMessages = await Message.find({
      receiver: userId,
      isRead: false,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
    .populate('sender', 'name')
    .populate('book', 'title')
    .populate('transaction', 'status')
    .sort({ createdAt: -1 })
    .limit(20);

    // Transform to notification format
    const notifications = recentMessages.map(message => ({
      id: message._id.toString(),
      transactionId: message.transaction._id.toString(),
      bookTitle: message.book.title,
      senderName: message.sender.name,
      messagePreview: message.content.substring(0, 100),
      priority: message.priority || 'normal',
      type: getMessageNotificationType(message.type, message.attachments?.length > 0),
      timestamp: message.createdAt,
      read: false
    }));

    return NextResponse.json({
      success: true,
      notifications
    });

  } catch (error) {
    console.error('Get message notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const { action, messageId, userId } = await request.json();

    switch (action) {
      case 'mark_read':
        if (messageId) {
          await Message.findByIdAndUpdate(messageId, {
            isRead: true,
            readAt: new Date()
          });
        }
        break;

      case 'clear_all':
        if (userId && userId === auth.id) {
          await Message.updateMany(
            { receiver: userId, isRead: false },
            { isRead: true, readAt: new Date() }
          );
        }
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Message notification action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function getMessageNotificationType(messageType: string, hasAttachments: boolean) {
  if (hasAttachments) return 'file_shared';
  if (messageType === 'template') return 'template_used';
  if (messageType === 'system') return 'status_related';
  return 'message';
}