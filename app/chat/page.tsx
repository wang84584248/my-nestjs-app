"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

// 定义消息类型
type Message = {
  _id?: string;
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  chatId?: string;
};

// 定义历史会话类型
type ChatHistory = {
  _id: string;
  id: string;
  title: string;
  date: string;
};

// 本地存储键名
const LAST_CHAT_ID_KEY = "deepseek_last_chat_id";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "我是 DeepSeek，很高兴见到你！\n\n我可以帮你写代码、译文件、写作各种创意内容，请把你的任务交给我吧～",
      timestamp: new Date(),
    },
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // 自动滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 保存当前聊天ID到本地存储
  useEffect(() => {
    if (currentChatId) {
      localStorage.setItem(LAST_CHAT_ID_KEY, currentChatId);
    }
  }, [currentChatId]);

  // 加载聊天历史并尝试恢复上次的会话
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        const response = await fetch('/api/chats');
        const data = await response.json();
        if (data.chats && Array.isArray(data.chats)) {
          const history = data.chats.map((chat: any) => ({
            _id: chat._id,
            id: chat._id,
            title: chat.title,
            date: new Date(chat.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: '2-digit'
            })
          }));
          
          setChatHistory(history);
          
          // 尝试恢复上次的会话
          const lastChatId = localStorage.getItem(LAST_CHAT_ID_KEY);
          
          if (lastChatId && history.some((chat: ChatHistory) => chat._id === lastChatId)) {
            // 如果找到上次的聊天ID，则加载它
            handleLoadChat(lastChatId);
          } else if (history.length > 0) {
            // 如果没有找到上次的聊天ID但有聊天历史，加载最新的一个
            handleLoadChat(history[0]._id);
          }
        }
      } catch (error) {
        console.error('获取聊天历史失败:', error);
      }
    };
    
    fetchChatHistory();
  }, []);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // 如果没有当前聊天ID，先创建一个新的聊天
      let chatId = currentChatId;
      
      if (!chatId) {
        // 使用消息内容前20个字符作为标题
        const title = inputValue.trim().substring(0, 20) + (inputValue.length > 20 ? '...' : '');
        const response = await fetch('/api/chats', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title,
            userId: 'guest'
          }),
        });
        
        const data = await response.json();
        if (data.chat && data.chat._id) {
          chatId = data.chat._id;
          setCurrentChatId(chatId);
          
          // 更新聊天历史
          setChatHistory(prev => [{
            _id: data.chat._id,
            id: data.chat._id,
            title: data.chat.title,
            date: new Date(data.chat.createdAt).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: '2-digit'
            })
          }, ...prev]);
        }
      }
      
      // 添加用户消息到UI
      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: inputValue.trim(),
        timestamp: new Date(),
        chatId
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      
      // 准备发送给API的消息历史
      const apiMessages = messages
        .filter(msg => msg.id !== "welcome") // 排除欢迎消息
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // 添加最新的用户消息
      apiMessages.push({
        role: "user",
        content: userMessage.content
      });
      
      // 首先尝试调用生成API
      let generateData;
      let useMockApi = false;
      
      try {
        const generateResponse = await fetch('/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: apiMessages,
            chatId,
            userId: 'guest'
          }),
        });
        
        if (!generateResponse.ok) {
          console.error('生成API错误:', generateResponse.status, generateResponse.statusText);
          // 如果API调用失败，使用模拟API
          useMockApi = true;
        } else {
          generateData = await generateResponse.json();
        }
      } catch (apiError) {
        console.error('调用生成API失败:', apiError);
        // 如果API调用异常，使用模拟API
        useMockApi = true;
      }
      
      // 如果需要，回退到模拟API
      if (useMockApi) {
        console.log('使用模拟API...');
        try {
          const mockResponse = await fetch('/api/generate/mock', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messages: apiMessages,
              chatId,
              userId: 'guest'
            }),
          });
          
          if (!mockResponse.ok) {
            throw new Error(`模拟API调用失败: ${mockResponse.status}`);
          }
          
          generateData = await mockResponse.json();
        } catch (mockError) {
          console.error('模拟API调用失败:', mockError);
          throw new Error('无法生成响应，请稍后重试');
        }
      }
      
      if (!generateData) {
        throw new Error('未能获取有效响应');
      }
      
      // 检查响应中是否有新创建的chatId
      if (generateData.chatId && !chatId) {
        chatId = generateData.chatId;
        setCurrentChatId(chatId);
      }
      
      // 从API响应中提取助手消息
      if (generateData.choices && generateData.choices[0] && generateData.choices[0].message) {
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: generateData.choices[0].message.content,
          timestamp: new Date(),
          chatId
        };
        
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('无效的API响应格式');
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      alert(`发送消息失败: ${error instanceof Error ? error.message : '未知错误'}`);
      
      // 在错误情况下，添加一个错误消息到UI
      setMessages((prev) => [...prev, {
        id: Date.now().toString(),
        role: "assistant",
        content: "抱歉，遇到了一些问题。请稍后再试。",
        timestamp: new Date(),
        chatId: currentChatId
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理输入框按键事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 新建聊天
  const handleNewChat = () => {
    setCurrentChatId("");
    localStorage.removeItem(LAST_CHAT_ID_KEY);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "我是 DeepSeek，很高兴见到你！\n\n我可以帮你写代码、译文件、写作各种创意内容，请把你的任务交给我吧～",
        timestamp: new Date(),
      },
    ]);
  };

  // 加载历史会话
  const handleLoadChat = async (chatId: string) => {
    try {
      setIsLoading(true);
      setCurrentChatId(chatId);
      
      const response = await fetch(`/api/messages?chatId=${chatId}`);
      const data = await response.json();
      
      if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
        setMessages(data.messages.map((msg: any) => ({
          id: msg._id,
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          chatId: msg.chatId
        })));
      } else {
        setMessages([
          {
            id: "welcome",
            role: "assistant",
            content: "我是 DeepSeek，很高兴见到你！\n\n我可以帮你写代码、译文件、写作各种创意内容，请把你的任务交给我吧～",
            timestamp: new Date(),
          },
        ]);
      }
    } catch (error) {
      console.error('加载聊天失败:', error);
      alert('加载聊天失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 添加删除聊天的函数
  const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
    e.stopPropagation(); // 阻止事件冒泡，防止触发选择聊天
    
    if (!confirm('确定要删除此对话吗？此操作不可恢复。')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/chats/${chatId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('删除聊天失败');
      }
      
      // 从聊天历史中移除
      setChatHistory(prev => prev.filter(chat => chat._id !== chatId));
      
      // 如果删除的是当前聊天，切换到新聊天
      if (currentChatId === chatId) {
        // 如果是当前聊天，从localStorage中移除
        localStorage.removeItem(LAST_CHAT_ID_KEY);
        handleNewChat();
      }
    } catch (error) {
      console.error('删除聊天失败:', error);
      alert('删除聊天失败，请重试');
    }
  };

  const formatMessage = (content: string) => {
    return content.split('\n').map((line, i) => (
      <span key={i}>
        {line}
        {i < content.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="flex h-screen bg-zinc-900 text-white">
      {/* 侧边栏 */}
      <div className="w-[260px] flex flex-col border-r border-zinc-800">
        <div className="p-4 flex items-center gap-2">
          <span className="text-2xl font-medium text-zinc-300">deepseek</span>
        </div>
        
        <div className="p-4">
          <Button 
            onClick={handleNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-md font-normal flex items-center gap-2"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            开启新对话
          </Button>
        </div>
        
        {/* 历史会话 */}
        <div className="flex-1 overflow-y-auto px-2">
          {chatHistory.map(chat => (
            <div 
              key={chat.id} 
              className={cn(
                "p-2 hover:bg-zinc-800 rounded cursor-pointer group flex justify-between items-start",
                currentChatId === chat._id ? "bg-zinc-800" : ""
              )}
              onClick={() => handleLoadChat(chat._id)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-zinc-400 text-xs">{chat.date}</div>
                <div className="text-zinc-300 text-sm truncate">{chat.title}</div>
              </div>
              <button
                onClick={(e) => handleDeleteChat(e, chat._id)}
                className="text-zinc-500 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                title="删除对话"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"></path>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ))}
        </div>
      </div>
      
      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden">
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "mb-6 max-w-3xl mx-auto",
                message.role === "user" ? "text-right ml-auto" : ""
              )}
            >
              <div className="flex items-start gap-3">
                {message.role === "assistant" && (
                  <Avatar className="h-8 w-8 bg-blue-600 text-white mt-1">
                    <AvatarImage src="/deepseek-avatar.png" alt="DeepSeek" />
                    <AvatarFallback>DS</AvatarFallback>
                  </Avatar>
                )}
                <div className={cn(
                  "max-w-[90%] md:max-w-[80%] bg-zinc-800 rounded-lg p-3",
                  message.role === "user" ? "bg-blue-600" : "bg-zinc-800"
                )}>
                  {formatMessage(message.content)}
                </div>
                {message.role === "user" && (
                  <Avatar className="h-8 w-8 bg-emerald-600 text-white mt-1">
                    <AvatarImage src="/user-avatar.png" alt="User" />
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="mb-6 max-w-3xl mx-auto">
              <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 bg-blue-600 text-white mt-1">
                  <AvatarFallback>DS</AvatarFallback>
                </Avatar>
                <div className="bg-zinc-800 rounded-lg p-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                    <div className="w-2 h-2 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 */}
        <div className="border-t border-zinc-800 p-4">
          <div className="max-w-3xl mx-auto relative">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="DeepSeek 发送消息"
              className="resize-none bg-zinc-800 border-zinc-700 focus-visible:ring-zinc-700 text-white pr-12"
              rows={1}
            />
            <div className="absolute right-3 bottom-3 flex gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 rounded text-zinc-400 hover:text-white hover:bg-zinc-700"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12 3V12M12 12V21M12 12H21M12 12H3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>深度思考 (R1)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost" 
                      className="h-8 w-8 rounded text-zinc-400 hover:text-white hover:bg-zinc-700"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
                        <path d="M17.5 12C17.5 15.0376 15.0376 17.5 12 17.5C8.96243 17.5 6.5 15.0376 6.5 12C6.5 8.96243 8.96243 6.5 12 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>联网搜索</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button
                onClick={handleSendMessage}
                size="icon"
                className="h-8 w-8 rounded bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!inputValue.trim() || isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 