import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Chat from '@/models/Chat';

export async function GET() {
  try {
    await connectToDatabase();
    
    // 简单起见，这里不做用户验证，获取所有聊天会话
    // 实际应用中应该根据已验证的用户ID进行过滤
    const chats = await Chat.find().sort({ updatedAt: -1 });
    
    return NextResponse.json({ chats });
  } catch (error) {
    console.error('获取聊天会话失败:', error);
    return NextResponse.json(
      { error: '获取聊天会话失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const { title, userId } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: '标题不能为空' },
        { status: 400 }
      );
    }
    
    // 在实际应用中应验证userId
    const newChat = new Chat({
      title,
      userId: userId || 'guest', // 默认为访客ID
    });
    
    await newChat.save();
    
    return NextResponse.json({ chat: newChat }, { status: 201 });
  } catch (error) {
    console.error('创建聊天会话失败:', error);
    return NextResponse.json(
      { error: '创建聊天会话失败' },
      { status: 500 }
    );
  }
} 