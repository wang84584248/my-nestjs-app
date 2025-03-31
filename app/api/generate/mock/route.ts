import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import Chat from '@/models/Chat';
import Message from '@/models/Message';

// 模拟响应的预设回复
const MOCK_RESPONSES = [
  "我能理解你的问题。让我来详细解答一下...",
  "这是一个很好的问题。根据我的理解，答案是...",
  "我很高兴你问这个问题。我来为你解释一下：",
  "根据我的分析，这个问题的解决方案是...",
  "谢谢你的提问。这个问题涉及到几个方面：",
  "这是个复杂的话题，让我从基础开始解释...",
  "我可以帮你解决这个问题。首先，我们需要...",
  "很有趣的问题！从技术角度来看..."
];

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

    // 生成模拟响应
    const userMessage = messages[messages.length - 1];
    const randomIndex = Math.floor(Math.random() * MOCK_RESPONSES.length);
    const responsePrefix = MOCK_RESPONSES[randomIndex];
    
    // 根据用户消息生成更个性化的回复
    let responseContent = responsePrefix;
    if (userMessage.content.length > 10) {
      // 添加一部分用户消息的内容到响应中
      responseContent += "\n\n你提到的「" + userMessage.content.substring(0, 20) + 
        (userMessage.content.length > 20 ? "..." : "") + 
        "」是很重要的一点。\n\n这个问题我可以从以下几个方面帮你分析：\n\n1. 基本概念\n2. 应用场景\n3. 最佳实践\n\n需要我深入讲解哪一方面吗？";
    }

    const mockResponse = {
      id: "mock-" + Date.now(),
      object: "chat.completion",
      created: Date.now(),
      model: "deepseek-v3-mock",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: responseContent
          },
          finish_reason: "stop"
        }
      ]
    };

    // 如果提供了chatId，则将消息保存到数据库
    if (chatId) {
      // 保存用户消息
      await Message.create({
        role: userMessage.role,
        content: userMessage.content,
        chatId: chatId
      });

      // 保存助手消息
      await Message.create({
        role: "assistant",
        content: responseContent,
        chatId: chatId
      });
    } 
    // 如果没有chatId但有userId，创建新对话
    else if (userId) {
      // 创建新对话
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
        role: "assistant",
        content: responseContent,
        chatId: newChat._id
      });

      // 将新创建的chatId添加到响应中
      return NextResponse.json({
        ...mockResponse,
        chatId: newChat._id
      });
    }

    return NextResponse.json(mockResponse);
  } catch (error) {
    console.error('API路由错误:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误' },
      { status: 500 }
    );
  }
} 