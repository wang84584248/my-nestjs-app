import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Message from '@/models/Message';

export async function GET(request: Request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      return NextResponse.json(
        { error: '缺少chatId参数' },
        { status: 400 }
      );
    }
    
    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('获取消息失败:', error);
    return NextResponse.json(
      { error: '获取消息失败' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const { role, content, chatId } = await request.json();
    
    if (!content || !chatId) {
      return NextResponse.json(
        { error: '消息内容和聊天ID不能为空' },
        { status: 400 }
      );
    }
    
    const newMessage = new Message({
      role: role || 'user',
      content,
      chatId,
    });
    
    await newMessage.save();
    
    // 在实际应用中，这里可以调用AI服务API获取回复
    // 简单模拟AI回复
    const aiResponse = new Message({
      role: 'assistant',
      content: `您发送的消息是: "${content}"\n\n这是一个模拟回复，实际应用中会调用AI服务获取真实回复。`,
      chatId,
    });
    
    await aiResponse.save();
    
    return NextResponse.json({ 
      messages: [newMessage, aiResponse] 
    }, { status: 201 });
  } catch (error) {
    console.error('发送消息失败:', error);
    return NextResponse.json(
      { error: '发送消息失败' },
      { status: 500 }
    );
  }
} 