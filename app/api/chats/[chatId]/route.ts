import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';

// GET请求处理
export async function GET(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    await connectToDatabase();
    
    const chatId = params.chatId;
    
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

// PUT请求处理
export async function PUT(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    await connectToDatabase();
    
    const chatId = params.chatId;
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

// DELETE请求处理
export async function DELETE(
  request: NextRequest,
  { params }: { params: { chatId: string } }
) {
  try {
    await connectToDatabase();
    
    const chatId = params.chatId;
    
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