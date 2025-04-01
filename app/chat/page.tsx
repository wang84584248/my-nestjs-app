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
import { Search, PenSquare, ChevronDown, Share, ThumbsUp, ThumbsDown, MessageSquare, Repeat, MoreHorizontal, Plus, Mic, SendHorizontal } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

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

// 生成唯一ID的辅助函数
const generateUniqueId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome-" + generateUniqueId(),
      role: "assistant",
      content: "我是 DeepSeek，很高兴见到你！\n\n我可以帮你写代码、译文件、写作各种创意内容，请把你的任务交给我吧～",
      timestamp: new Date(),
    },
  ]);
  
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessageId, setLoadingMessageId] = useState<string | null>(null);
  const [streamingContent, setStreamingContent] = useState<string>("");
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  
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
      } finally {
        // 500ms后设置页面加载完成，提供更好的用户体验
        setTimeout(() => {
          setPageLoading(false);
        }, 500);
      }
    };
    
    fetchChatHistory();
  }, []);

  // 处理发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    setIsLoading(true);
    setStreamingContent("");
    
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
        id: generateUniqueId(),
        role: "user",
        content: inputValue.trim(),
        timestamp: new Date(),
        chatId
      };
      
      setMessages((prev) => [...prev, userMessage]);
      setInputValue("");
      
      // 准备发送给API的消息历史
      const apiMessages = messages
        .filter(msg => !msg.id.startsWith("welcome-")) // 排除欢迎消息
        .map(msg => ({
          role: msg.role,
          content: msg.content
        }));
      
      // 添加最新的用户消息
      apiMessages.push({
        role: "user",
        content: userMessage.content
      });
      
      // 创建一个空的助手消息
      const assistantMessage: Message = {
        id: generateUniqueId(),
        role: "assistant",
        content: "",
        timestamp: new Date(),
        chatId
      };
      
      // 设置正在加载的消息ID
      setLoadingMessageId(assistantMessage.id);
      
      // 添加消息到聊天界面
      setMessages((prev) => [...prev, assistantMessage]);
      
      // 首先尝试调用生成API - 使用流式响应
      let useMockApi = false;
      let newChatId = chatId;
      
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
          // 处理流式响应
          const reader = generateResponse.body?.getReader();
          const decoder = new TextDecoder();
          let accumulatedContent = "";
          
          if (reader) {
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                // 解码二进制数据
                const chunk = decoder.decode(value, { stream: true });
                
                // 累加内容
                accumulatedContent += chunk;
                
                // 检查是否包含chatId信息
                if (chunk.includes('{"chatId":"')) {
                  const match = chunk.match(/{"chatId":"([^"]+)"}/);
                  if (match && match[1]) {
                    newChatId = match[1];
                    setCurrentChatId(newChatId);
                    
                    // 从累积内容中移除chatId信息
                    accumulatedContent = accumulatedContent.replace(/\n\n{"chatId":"[^"]+"}/, '');
                  }
                }
                
                // 更新流式内容状态
                setStreamingContent(accumulatedContent);
                
                // 更新UI中的消息内容 - 使用函数式更新确保操作的是最新状态
                setMessages((prevMessages) => {
                  // 检查是否存在相同ID的消息
                  const messageExists = prevMessages.some(msg => msg.id === assistantMessage.id);
                  
                  if (!messageExists) {
                    console.warn('试图更新不存在的消息ID:', assistantMessage.id);
                    return prevMessages;
                  }
                  
                  // 只更新特定消息的内容
                  return prevMessages.map((msg) => 
                    msg.id === assistantMessage.id 
                      ? { ...msg, content: accumulatedContent } 
                      : msg
                  );
                });
              }
            } catch (streamError) {
              console.error('处理流式响应出错:', streamError);
              useMockApi = true;
            }
          } else {
            useMockApi = true;
          }
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
          
          const generateData = await mockResponse.json();
          
          // 检查响应中是否有新创建的chatId
          if (generateData.chatId && !chatId) {
            newChatId = generateData.chatId;
            setCurrentChatId(newChatId);
          }
          
          // 从API响应中提取助手消息
          if (generateData.choices && generateData.choices[0] && generateData.choices[0].message) {
            const responseContent = generateData.choices[0].message.content;
            
            // 模拟流式输出
            const words = responseContent.split('');
            let simulatedContent = '';
            
            for (let i = 0; i < words.length; i++) {
              await new Promise(resolve => setTimeout(resolve, 10)); // 添加延迟
              simulatedContent += words[i];
              setStreamingContent(simulatedContent);
              
              // 更新消息内容
              setMessages((prevMessages) => {
                // 检查是否存在相同ID的消息
                const messageExists = prevMessages.some(msg => msg.id === assistantMessage.id);
                
                if (!messageExists) return prevMessages;
                
                // 只更新特定消息的内容
                return prevMessages.map((msg) => 
                  msg.id === assistantMessage.id 
                    ? { ...msg, content: simulatedContent, chatId: newChatId } 
                    : msg
                );
              });
            }
          } else {
            throw new Error('无效的API响应格式');
          }
        } catch (mockError) {
          console.error('模拟API调用失败:', mockError);
          
          // 更新消息显示错误
          setMessages((prevMessages) => {
            // 检查是否存在相同ID的消息
            const messageExists = prevMessages.some(msg => msg.id === assistantMessage.id);
            
            if (!messageExists) {
              return [
                ...prevMessages,
                {
                  id: generateUniqueId(),
                  role: "assistant",
                  content: "抱歉，我遇到了问题，无法回应您的请求。请稍后重试。",
                  timestamp: new Date(),
                }
              ];
            }
            
            return prevMessages.map((msg) => 
              msg.id === assistantMessage.id 
                ? { ...msg, content: "抱歉，我遇到了问题，无法回应您的请求。请稍后重试。" } 
                : msg
            );
          });
        }
      }
    } catch (error) {
      console.error('发送消息失败:', error);
      
      // 显示错误消息，避免添加可能重复的消息
      setMessages((prevMessages) => {
        // 如果已经有一个空的助手消息，更新它而不是添加新消息
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage && lastMessage.role === "assistant" && lastMessage.content === "") {
          return prevMessages.map((msg, index) => 
            index === prevMessages.length - 1
              ? { ...msg, content: "抱歉，发生了错误，无法处理您的请求。请稍后重试。" }
              : msg
          );
        }
        
        // 否则添加新的错误消息
        return [
          ...prevMessages,
          {
            id: generateUniqueId(),
            role: "assistant",
            content: "抱歉，发生了错误，无法处理您的请求。请稍后重试。",
            timestamp: new Date(),
          },
        ];
      });
    } finally {
      setIsLoading(false);
      setLoadingMessageId(null);
      setStreamingContent("");
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
        id: "welcome-" + generateUniqueId(),
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
        // 确保每条消息都有唯一ID
        setMessages(data.messages.map((msg: any) => ({
          id: msg._id || generateUniqueId(),
          role: msg.role,
          content: msg.content,
          timestamp: new Date(msg.createdAt),
          chatId: msg.chatId
        })));
      } else {
        setMessages([
          {
            id: "welcome-" + generateUniqueId(),
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

  // 渲染骨架屏组件
  const renderSkeletons = () => (
    <>
      {/* 侧边栏骨架屏 */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-2 text-xs text-[#8286a5] font-medium">今天</div>
        <div className="space-y-0.5 px-2">
          {Array(3).fill(0).map((_, index) => (
            <div key={`skeleton-sidebar-${index}`} className="px-3 py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
        
        <div className="px-4 py-2 text-xs text-[#8286a5] font-medium mt-4">三月</div>
        <div className="space-y-0.5 px-2">
          {Array(2).fill(0).map((_, index) => (
            <div key={`skeleton-sidebar-past-${index}`} className="px-3 py-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  // 消息骨架屏
  const renderMessageSkeletons = () => (
    <>
      {/* 欢迎消息骨架屏 */}
      <div className="mb-6 w-full max-w-3xl mx-auto">
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </div>
      </div>
      {/* 用户消息骨架屏 */}
      <div className="mb-6 w-full max-w-3xl mx-auto">
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-12 w-4/5 rounded-xl" />
          </div>
        </div>
      </div>
      {/* 助手回复骨架屏 */}
      <div className="mb-6 w-full max-w-3xl mx-auto">
        <div className="flex gap-3">
          <Skeleton className="h-8 w-8 rounded-md flex-shrink-0" />
          <div className="flex-1">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-36 w-full rounded-xl" />
            <div className="flex gap-1 mt-2">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-[#0d0f1d] text-white">
      {/* 侧边栏 */}
      <div className={cn(
        "flex flex-col border-r border-[#272940]/50 transition-all duration-300 ease-in-out bg-[#0b0d1a]",
        sidebarCollapsed ? "w-0 overflow-hidden" : "w-[280px]"
      )}>
        {/* 顶部 */}
        <div className="flex items-center p-4 border-b border-[#272940]/50">
          <div className="flex items-center justify-center h-8 w-8 bg-indigo-600 rounded-md mr-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-lg font-semibold text-white">DeepSeek</span>
          <ChevronDown className="ml-1 h-4 w-4 text-[#8286a5]" />
        </div>

        {/* 新建对话按钮 */}
        <div className="p-4">
          <Button 
            onClick={handleNewChat}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium flex items-center gap-2 border-none"
            disabled={pageLoading}
          >
            <Plus className="h-4 w-4" />
            新对话
          </Button>
        </div>
        
        {/* 历史会话分组 */}
        {pageLoading ? renderSkeletons() : (
          <div className="flex-1 overflow-y-auto">
            <div className="px-4 py-2 text-xs text-[#8286a5] font-medium">今天</div>
            <div className="space-y-0.5 px-2">
              {chatHistory.slice(0, 3).map(chat => (
                <div 
                  key={chat.id} 
                  className={cn(
                    "px-3 py-2 hover:bg-[#272940]/20 rounded-md cursor-pointer group flex justify-between items-start",
                    currentChatId === chat._id ? "bg-[#272940]/30" : ""
                  )}
                  onClick={() => handleLoadChat(chat._id)}
                >
                  <div className="flex-1 min-w-0 flex gap-2 items-center">
                    <MessageSquare className="h-4 w-4 shrink-0 text-[#8286a5]" />
                    <div className="text-[#e1e3f0] text-sm truncate">{chat.title}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteChat(e, chat._id)}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[#8286a5] hover:text-red-400 hover:bg-transparent rounded-md transition-opacity"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="px-4 py-2 text-xs text-[#8286a5] font-medium mt-4">三月</div>
            <div className="space-y-0.5 px-2">
              {chatHistory.slice(3, 6).map(chat => (
                <div 
                  key={chat.id} 
                  className={cn(
                    "px-3 py-2 hover:bg-[#272940]/20 rounded-md cursor-pointer group flex justify-between items-start",
                    currentChatId === chat._id ? "bg-[#272940]/30" : ""
                  )}
                  onClick={() => handleLoadChat(chat._id)}
                >
                  <div className="flex-1 min-w-0 flex gap-2 items-center">
                    <MessageSquare className="h-4 w-4 shrink-0 text-[#8286a5]" />
                    <div className="text-[#e1e3f0] text-sm truncate">{chat.title}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => handleDeleteChat(e, chat._id)}
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-[#8286a5] hover:text-red-400 hover:bg-transparent rounded-md transition-opacity"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                    </svg>
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 主聊天区域 */}
      <div className="flex-1 flex flex-col max-h-screen overflow-hidden relative bg-[#131629]">
        {/* 顶部导航 */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-[#272940]/50">
          <div className="flex items-center gap-4">
            {sidebarCollapsed ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(false)}
                className="h-8 w-8 text-[#8286a5] hover:bg-[#272940]/20 rounded-md mr-1"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M9 3v18" />
                </svg>
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarCollapsed(true)}
                className="h-8 w-8 text-[#8286a5] hover:bg-[#272940]/20 rounded-md mr-1"
                aria-label="收起侧边栏"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="18" x="3" y="3" rx="2" />
                  <path d="M15 3v18" />
                </svg>
              </Button>
            )}
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-md text-[#8286a5] hover:bg-[#272940]/20">
                <Search className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 rounded-md text-[#8286a5] hover:bg-[#272940]/20">
                <PenSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="h-8 bg-[#272940]/20 border-[#272940]/60 text-[#e1e3f0] hover:text-white hover:bg-[#272940]/40 rounded-md">
              <Share className="h-4 w-4 mr-1.5" />
              分享
            </Button>
          </div>
        </div>
        
        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto py-4 px-4 md:px-20">
          {pageLoading ? (
            renderMessageSkeletons()
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className="mb-6 w-full max-w-3xl mx-auto"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 mt-1">
                    {message.role === "assistant" ? (
                      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-indigo-600 text-white font-medium text-xs">DS</div>
                    ) : (
                      <div className="flex items-center justify-center h-8 w-8 rounded-md bg-purple-600/30 text-purple-300 font-medium text-xs">U</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-[#8286a5] text-sm mb-1 flex items-center">
                      {message.role === "assistant" ? "DeepSeek" : "用户"}
                      {message.role === "user" && (
                        <span className="text-xs text-[#8286a5]/70 ml-2 font-normal">
                          {new Date(message.timestamp).toLocaleTimeString('zh-CN', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      )}
                    </div>
                    <div className={cn(
                      "py-3 px-4 rounded-xl",
                      message.role === "assistant" 
                        ? "bg-[#272940]/30 text-[#e1e3f0]" 
                        : "bg-[#422e57]/30 text-[#e1e3f0]"
                    )}>
                      {loadingMessageId === message.id ? (
                        streamingContent ? (
                          formatMessage(streamingContent)
                        ) : (
                          <div className="inline-flex space-x-2">
                            <div className="w-2 h-2 rounded-full bg-[#8286a5] animate-bounce" style={{ animationDelay: "0ms" }}></div>
                            <div className="w-2 h-2 rounded-full bg-[#8286a5] animate-bounce" style={{ animationDelay: "150ms" }}></div>
                            <div className="w-2 h-2 rounded-full bg-[#8286a5] animate-bounce" style={{ animationDelay: "300ms" }}></div>
                          </div>
                        )
                      ) : (
                        formatMessage(message.content)
                      )}
                    </div>
                    
                    {message.role === "assistant" && message.id !== loadingMessageId && (
                      <div className="flex items-center gap-1 mt-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-[#8286a5] hover:bg-[#272940]/20">
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-[#8286a5] hover:bg-[#272940]/20">
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-[#8286a5] hover:bg-[#272940]/20">
                          <Repeat className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-[#8286a5] hover:bg-[#272940]/20">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* 输入区域 */}
        <div className="px-4 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              <div className="border border-[#272940]/70 rounded-lg bg-[#171a2e] overflow-hidden">
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="输入问题..."
                  className="resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-white py-3 px-3 min-h-[60px] text-sm placeholder:text-[#8286a5]/70"
                  rows={1}
                  disabled={pageLoading}
                />
                <div className="flex items-center justify-between px-3 py-2 border-t border-[#272940]/50">
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-md text-[#8286a5] hover:bg-[#272940]/20"
                      disabled={pageLoading}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-md text-[#8286a5] hover:bg-[#272940]/20"
                      disabled={pageLoading}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputValue.trim() || isLoading || pageLoading}
                      className={cn(
                        "h-8 w-8 rounded-md flex items-center justify-center",
                        inputValue.trim() && !pageLoading
                          ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                          : "bg-[#272940]/40 text-[#8286a5]"
                      )}
                    >
                      <SendHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="text-center text-xs text-[#8286a5]/70 mt-2">
                DeepSeek 提供优质体验，请确保言论健康。
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 