import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';

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

    const { userId } = await request.json();

    if (!userId || userId !== auth.id) {
      return NextResponse.json(
        { error: 'Invalid user ID' },
        { status: 403 }
      );
    }

    // Mark all user's unread messages as read
    await Message.updateMany(
      { 
        receiver: userId,
        isRead: false
      },
      { 
        isRead: true,
        readAt: new Date()
      }
    );

    return NextResponse.json({
      success: true
    });

  } catch (error) {
    console.error('Clear notifications error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}