import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from '@/lib/auth';

// In-memory store for typing indicators (in production, use Redis)
const typingStore = new Map<string, { userId: string; timestamp: number }[]>();

export async function POST(request: NextRequest) {
  try {
    const auth = getAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { transactionId, userId, isTyping } = await request.json();

    if (!transactionId || !userId || userId !== auth.id) {
      return NextResponse.json(
        { error: 'Invalid parameters' },
        { status: 400 }
      );
    }

    const key = `typing_${transactionId}`;
    const currentTime = Date.now();
    
    if (isTyping) {
      // Add or update typing indicator
      const typingUsers = typingStore.get(key) || [];
      const existingIndex = typingUsers.findIndex(user => user.userId === userId);
      
      if (existingIndex >= 0) {
        typingUsers[existingIndex].timestamp = currentTime;
      } else {
        typingUsers.push({ userId, timestamp: currentTime });
      }
      
      typingStore.set(key, typingUsers);
    } else {
      // Remove typing indicator
      const typingUsers = typingStore.get(key) || [];
      const filtered = typingUsers.filter(user => user.userId !== userId);
      
      if (filtered.length === 0) {
        typingStore.delete(key);
      } else {
        typingStore.set(key, filtered);
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Typing indicator error:', error);
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

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get('transactionId');

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const key = `typing_${transactionId}`;
    const typingUsers = typingStore.get(key) || [];
    const currentTime = Date.now();
    
    // Filter out stale typing indicators (older than 5 seconds)
    const activeTypingUsers = typingUsers.filter(user => 
      currentTime - user.timestamp < 5000
    );

    // Update store with filtered list
    if (activeTypingUsers.length === 0) {
      typingStore.delete(key);
    } else {
      typingStore.set(key, activeTypingUsers);
    }

    return NextResponse.json({
      success: true,
      typingUsers: activeTypingUsers.map(user => user.userId)
    });

  } catch (error) {
    console.error('Get typing indicators error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}