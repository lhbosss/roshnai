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
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    // Get messages for this transaction with read status
    const messages = await Message.find({ 
      transaction: transactionId 
    }).select('_id isRead readAt deliveredAt sender receiver');

    // Build status map
    const statuses: Record<string, {
      delivered: boolean;
      read: boolean;
      readAt?: Date;
    }> = {};

    messages.forEach(message => {
      statuses[message._id.toString()] = {
        delivered: !!message.deliveredAt,
        read: message.isRead,
        readAt: message.readAt
      };
    });

    return NextResponse.json({
      success: true,
      statuses
    });

  } catch (error) {
    console.error('Get message status error:', error);
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

    const { messageId, action } = await request.json();

    if (!messageId) {
      return NextResponse.json(
        { error: 'Message ID is required' },
        { status: 400 }
      );
    }

    switch (action) {
      case 'mark_read':
        await Message.findByIdAndUpdate(messageId, {
          isRead: true,
          readAt: new Date()
        });
        break;

      case 'mark_delivered':
        await Message.findByIdAndUpdate(messageId, {
          deliveredAt: new Date()
        });
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Update message status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}