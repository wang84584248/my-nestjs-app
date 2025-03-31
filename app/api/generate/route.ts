import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';

export async function POST(request: Request) {
  try {
    // 连接到MongoDB
    await connectToDatabase();

    // 解析请求体
    const body = await request.json();
    const { messages, chatId, userId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: '无效的消息格式' },
        { status: 400 }
      );
    }

    // 检查API密钥是否存在
    const apiKey = process.env.INFINI_AI_API_KEY;
    if (!apiKey) {
      console.error('API密钥未设置');
      return NextResponse.json(
        { error: 'API配置错误' },
        { status: 500 }
      );
    }

    // 准备API请求
    const url = 'https://cloud.infini-ai.com/maas/v1/chat/completions';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'deepseek-v3',
        messages: messages
      })
    };

    console.log('正在调用DeepSeek API...');
    
    // 调用DeepSeek API
    let response;
    try {
      response = await fetch(url, options);
    } catch (fetchError) {
      console.error('API请求失败:', fetchError);
      return NextResponse.json(
        { error: 'API网络请求失败' },
        { status: 500 }
      );
    }
    
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (e) {
        errorData = await response.text();
      }
      
      console.error('DeepSeek API错误:', errorData);
      return NextResponse.json(
        { error: `调用AI服务失败: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (parseError) {
      console.error('API响应解析失败:', parseError);
      return NextResponse.json(
        { error: '无法解析API响应' },
        { status: 500 }
      );
    }
    
    console.log('API响应:', data);
    
    // 确保有有效的响应
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json(
        { error: 'AI响应格式无效' },
        { status: 500 }
      );
    }

    const assistantMessage = data.choices[0].message;

    // 如果提供了chatId，则将消息保存到数据库
    if (chatId) {
      // 保存用户消息
      const userMessage = messages[messages.length - 1];
      await Message.create({
        role: userMessage.role,
        content: userMessage.content,
        chatId: chatId
      });

      // 保存助手消息
      await Message.create({
        role: assistantMessage.role,
        content: assistantMessage.content,
        chatId: chatId
      });
    } 
    // 如果没有chatId但有userId，创建新对话
    else if (userId) {
      // 创建新对话
      const userMessage = messages[messages.length - 1];
      const chatTitle = userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '');
      
      const newChat = await Chat.create({
        title: chatTitle,
        userId: userId
      });

      // 保存用户消息
      await Message.create({
        role: userMessage.role,
        content: userMessage.content,
        chatId: newChat._id
      });

      // 保存助手消息
      await Message.create({
        role: assistantMessage.role,
        content: assistantMessage.content,
        chatId: newChat._id
      });

      // 将新创建的chatId添加到响应中
      return NextResponse.json({
        ...data,
        chatId: newChat._id
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API路由错误:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误' },
      { status: 500 }
    );
  }
}
