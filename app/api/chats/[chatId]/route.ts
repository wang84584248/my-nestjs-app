import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';

interface Params {
  params: { chatId: string };
}

export async function GET(request: Request, { params }: Params) {
  try {
    await connectToDatabase();
    
    const { chatId } = params;
    
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return NextResponse.json(
        { error: '聊天会话不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ chat });
  } catch (error) {
    console.error('获取聊天会话详情失败:', error);
    return NextResponse.json(
      { error: '获取聊天会话详情失败' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await connectToDatabase();
    
    const { chatId } = params;
    const { title } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: '标题不能为空' },
        { status: 400 }
      );
    }
    
    const updatedChat = await Chat.findByIdAndUpdate(
      chatId,
      { title },
      { new: true }
    );
    
    if (!updatedChat) {
      return NextResponse.json(
        { error: '聊天会话不存在' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ chat: updatedChat });
  } catch (error) {
    console.error('更新聊天会话失败:', error);
    return NextResponse.json(
      { error: '更新聊天会话失败' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await connectToDatabase();
    
    const { chatId } = params;
    
    // 删除聊天会话
    const deletedChat = await Chat.findByIdAndDelete(chatId);
    
    if (!deletedChat) {
      return NextResponse.json(
        { error: '聊天会话不存在' },
        { status: 404 }
      );
    }
    
    // 删除与该聊天相关的所有消息
    await Message.deleteMany({ chatId });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('删除聊天会话失败:', error);
    return NextResponse.json(
      { error: '删除聊天会话失败' },
      { status: 500 }
    );
  }
} 