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
        messages: messages,
        stream: true // 启用流式响应
      })
    };

    console.log('正在调用DeepSeek API（流式输出）...');
    
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

    // 用户的最后一条消息
    const userMessage = messages[messages.length - 1];
    
    // 处理流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        let fullContent = ''; // 存储完整的响应
        
        try {
          // 循环读取流中的数据
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            // 将二进制数据转换为文本
            const chunk = new TextDecoder().decode(value);
            
            // 解析SSE格式数据
            const lines = chunk
              .split('\n')
              .filter(line => line.trim() !== '')
              .map(line => line.replace(/^data: /, ''));
            
            for (const line of lines) {
              if (line === '[DONE]') continue;
              
              try {
                const parsedLine = JSON.parse(line);
                const content = parsedLine.choices[0]?.delta?.content || '';
                
                if (content) {
                  fullContent += content;
                  controller.enqueue(new TextEncoder().encode(content));
                }
              } catch (error) {
                console.error('解析流数据错误:', error, line);
              }
            }
          }
        } catch (error) {
          console.error('流处理错误:', error);
        } finally {
          // 流式传输完成后保存消息到数据库
          try {
            if (chatId) {
              // 保存用户消息
              const newUserMessage = new Message({
                role: userMessage.role,
                content: userMessage.content,
                chatId: chatId
              });
              await newUserMessage.save();

              // 保存完整的助手回复
              const assistantMessage = new Message({
                role: 'assistant',
                content: fullContent,
                chatId: chatId
              });
              await assistantMessage.save();
            } 
            // 如果没有chatId但有userId，创建新对话
            else if (userId) {
              // 创建新对话
              const chatTitle = userMessage.content.substring(0, 50) + (userMessage.content.length > 50 ? '...' : '');
              
              const newChat = new Chat({
                title: chatTitle,
                userId: userId
              });
              await newChat.save();

              // 保存用户消息
              const newUserMessage = new Message({
                role: userMessage.role,
                content: userMessage.content,
                chatId: newChat._id
              });
              await newUserMessage.save();

              // 保存助手消息
              const assistantMessage = new Message({
                role: 'assistant',
                content: fullContent,
                chatId: newChat._id
              });
              await assistantMessage.save();
              
              // 将新chatId作为元数据添加到最后一个响应块
              controller.enqueue(new TextEncoder().encode(`\n\n{"chatId":"${newChat._id}"}`));
            }
          } catch (dbError) {
            console.error('保存消息到数据库失败:', dbError);
          }
          
          // 关闭流
          controller.close();
        }
      }
    });

    // 返回流式响应
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('API路由错误:', error);
    return NextResponse.json(
      { error: '处理请求时发生错误' },
      { status: 500 }
    );
  }
}
