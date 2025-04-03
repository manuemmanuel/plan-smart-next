import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// In-memory storage for messages (replace with your preferred storage solution)
let messages: any[] = [];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const conversationId = searchParams.get('conversationId');
  const userType = searchParams.get('userType'); // 'provider' or 'user'

  if (!userId || !userType) {
    return NextResponse.json({ error: 'User ID and type are required' }, { status: 400 });
  }

  try {
    if (conversationId) {
      // Get messages for a specific conversation
      const conversationMessages = messages.filter(
        msg => 
          (msg.sender_id === userId && msg.receiver_id === conversationId) ||
          (msg.sender_id === conversationId && msg.receiver_id === userId)
      );
      return NextResponse.json(conversationMessages);
    } else {
      // Get all conversations for the user
      const userMessages = messages.filter(
        msg => msg.sender_id === userId || msg.receiver_id === userId
      );
      
      // Group messages by conversation
      const conversations = userMessages.reduce((acc: any[], msg) => {
        const otherId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
        const existingConversation = acc.find(conv => conv.id === otherId);
        
        if (existingConversation) {
          if (new Date(msg.created_at) > new Date(existingConversation.lastMessageTime)) {
            existingConversation.lastMessage = msg.content;
            existingConversation.lastMessageTime = msg.created_at;
          }
          if (!msg.is_read && msg.receiver_id === userId) {
            existingConversation.unreadCount++;
          }
        } else {
          acc.push({
            id: otherId,
            lastMessage: msg.content,
            lastMessageTime: msg.created_at,
            unreadCount: !msg.is_read && msg.receiver_id === userId ? 1 : 0
          });
        }
        return acc;
      }, []);

      return NextResponse.json(conversations);
    }
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sender_id, receiver_id, content, sender_type } = body;

    if (!sender_id || !receiver_id || !content || !sender_type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newMessage = {
      id: Date.now().toString(),
      sender_id,
      receiver_id,
      content,
      created_at: new Date().toISOString(),
      is_read: false,
      sender_type
    };

    messages.push(newMessage);
    return NextResponse.json(newMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { messageId } = body;

    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    messages[messageIndex].is_read = true;
    return NextResponse.json(messages[messageIndex]);
  } catch (error) {
    console.error('Error updating message:', error);
    return NextResponse.json({ error: 'Failed to update message' }, { status: 500 });
  }
} 