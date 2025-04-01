"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, MessageSquare, Code, FileText, Sparkles } from "lucide-react";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 模拟加载过程
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#0d0f1d] text-white">
      {/* 导航栏 */}
      <nav className="border-b border-[#272940]/50 px-6 py-4 backdrop-blur-sm bg-[#0d0f1d]/80 sticky top-0 z-10 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center h-8 w-8 bg-indigo-600 rounded-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="2"/>
              <path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">DeepSeek</span>
        </div>
        <div className="hidden md:flex gap-8 text-[#8286a5]">
          <a href="#features" className="hover:text-white transition-colors">特性</a>
          <a href="#capabilities" className="hover:text-white transition-colors">能力</a>
          <a href="#about" className="hover:text-white transition-colors">关于</a>
        </div>
        <Button asChild variant="ghost" className="hidden md:flex bg-indigo-600 hover:bg-indigo-700 text-white">
          <Link href="/chat">开始使用</Link>
        </Button>
      </nav>

      {/* 英雄区域 */}
      <section className="relative flex flex-col items-center justify-center py-20 px-4 md:px-8 lg:py-28 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-bg.svg')] bg-no-repeat bg-cover opacity-10 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-[#131832] via-transparent to-[#0d0f1d] z-0"></div>
        
        <div className="relative z-1 max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-500">
            {isLoading ? (
              <Skeleton className="h-20 w-3/4 mx-auto mb-4" />
            ) : (
              "为创作者设计的智能对话助手"
            )}
          </h1>
          {isLoading ? (
            <div className="mb-8 max-w-3xl mx-auto">
              <Skeleton className="h-6 w-5/6 mx-auto mb-2" />
              <Skeleton className="h-6 w-4/6 mx-auto" />
            </div>
          ) : (
            <p className="text-lg md:text-xl text-[#e1e3f0] mb-8 max-w-3xl mx-auto">
              DeepSeek 提供高质量的对话、代码生成和创意写作能力，助力内容创作、编程开发和日常工作效率提升
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-36 rounded-md" />
                <Skeleton className="h-10 w-36 rounded-md" />
              </>
            ) : (
              <>
                <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md h-12 px-6 font-medium text-base">
                  <Link href="/chat" className="flex items-center gap-2">
                    开始对话
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-[#272940] bg-[#0d0f1d]/50 hover:bg-[#171a2e] text-white rounded-md h-12 px-6 font-medium text-base">
                  <a href="#features" className="flex items-center gap-2">
                    了解更多
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 功能展示 */}
      <section id="features" className="py-20 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">功能特性</h2>
            <p className="text-[#8286a5] max-w-2xl mx-auto">DeepSeek 通过先进的人工智能技术，为用户提供沉浸式的对话体验</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              Array(3).fill(0).map((_, i) => (
                <div key={i} className="bg-[#171a2e] border border-[#272940]/50 rounded-xl p-6">
                  <Skeleton className="h-10 w-10 rounded-md mb-4" />
                  <Skeleton className="h-6 w-2/3 mb-2" />
                  <Skeleton className="h-20 w-full" />
                </div>
              ))
            ) : (
              <>
                <div className="bg-[#171a2e] border border-[#272940]/50 rounded-xl p-6 transition-all duration-300 hover:border-indigo-500/30 hover:bg-[#171a2e]/80">
                  <div className="bg-indigo-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-indigo-400">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">自然对话</h3>
                  <p className="text-[#8286a5]">与 DeepSeek 进行流畅自然的对话，获得专业、有帮助的回答和建议。</p>
                </div>
                
                <div className="bg-[#171a2e] border border-[#272940]/50 rounded-xl p-6 transition-all duration-300 hover:border-indigo-500/30 hover:bg-[#171a2e]/80">
                  <div className="bg-purple-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-purple-400">
                    <Code className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">代码助手</h3>
                  <p className="text-[#8286a5]">自动生成高质量代码，解决编程难题，提供技术建议和最佳实践参考。</p>
                </div>
                
                <div className="bg-[#171a2e] border border-[#272940]/50 rounded-xl p-6 transition-all duration-300 hover:border-indigo-500/30 hover:bg-[#171a2e]/80">
                  <div className="bg-cyan-600/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4 text-cyan-400">
                    <FileText className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">创意写作</h3>
                  <p className="text-[#8286a5]">帮助创作者产生创意灵感，生成各类内容，包括文章、故事、营销文案等。</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 能力展示 */}
      <section id="capabilities" className="py-20 px-4 md:px-8 bg-gradient-to-b from-[#131629] to-[#0d0f1d]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">强大能力</h2>
            <p className="text-[#8286a5] max-w-2xl mx-auto">探索 DeepSeek 在各种任务中的卓越表现</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {isLoading ? (
              <>
                <Skeleton className="h-96 rounded-xl" />
                <div className="space-y-4">
                  <Skeleton className="h-10 w-3/4" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-5/6" />
                  <Skeleton className="h-10 w-36 mt-6" />
                </div>
              </>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-xl border border-[#272940]/50 h-full min-h-[400px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0d0f1d]/80 to-transparent z-0"></div>
                  <div className="absolute inset-0 p-6 flex flex-col">
                    <div className="flex items-center mb-4">
                      <div className="flex items-center justify-center h-8 w-8 bg-indigo-600 rounded-md mr-3">
                        <span className="text-xs font-bold">DS</span>
                      </div>
                      <span className="text-sm text-[#8286a5]">DeepSeek</span>
                    </div>
                    <div className="bg-[#272940]/30 text-[#e1e3f0] p-4 rounded-xl mb-4 w-full max-w-md">
                      我是 DeepSeek，很高兴见到你！
                      <br /><br />
                      我可以帮你写代码、译文件、写作各种创意内容，请把你的任务交给我吧～
                    </div>
                    <div className="flex items-center mb-4 mt-auto">
                      <div className="flex items-center justify-center h-8 w-8 bg-purple-600/30 text-purple-300 rounded-md mr-3">
                        <span className="text-xs font-bold">U</span>
                      </div>
                      <span className="text-sm text-[#8286a5]">用户</span>
                    </div>
                    <div className="bg-[#422e57]/30 text-[#e1e3f0] p-4 rounded-xl w-full max-w-md ml-auto">
                      请帮我写一个简单的React组件，用于显示产品卡片，包含图片、标题、价格和购买按钮。
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-2xl font-bold mb-4">智能对话体验</h3>
                  <p className="text-[#8286a5] mb-6">
                    DeepSeek 可以理解复杂的问题，提供详细而精确的回答。无论是技术问题、创意写作，还是日常咨询，都能得到高质量的回应。
                  </p>
                  <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-[#e1e3f0]">
                      <Sparkles className="h-5 w-5 text-indigo-400" />
                      流畅的对话体验与精准的回答
                    </li>
                    <li className="flex items-center gap-2 text-[#e1e3f0]">
                      <Sparkles className="h-5 w-5 text-indigo-400" />
                      专业的代码生成与技术解决方案
                    </li>
                    <li className="flex items-center gap-2 text-[#e1e3f0]">
                      <Sparkles className="h-5 w-5 text-indigo-400" />
                      创意内容写作和灵感激发
                    </li>
                  </ul>
                  <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md px-6">
                    <Link href="/chat">
                      立即体验
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 行动号召 */}
      <section className="py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/30 rounded-xl p-8 text-center">
          <h2 className="text-3xl font-bold mb-4">开始使用 DeepSeek</h2>
          <p className="text-[#e1e3f0] mb-8 max-w-2xl mx-auto">
            立即探索 DeepSeek 的强大能力，提升你的工作效率和创作能力
          </p>
          <Button asChild className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-md h-12 px-8 font-medium text-base">
            <Link href="/chat">
              免费开始
            </Link>
          </Button>
        </div>
      </section>

      {/* 页脚 */}
      <footer id="about" className="border-t border-[#272940]/50 py-12 px-4 md:px-8 bg-[#0b0d1a]">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <div className="flex items-center gap-2 mb-6 md:mb-0">
              <div className="flex items-center justify-center h-8 w-8 bg-indigo-600 rounded-md">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
                  <rect x="5" y="4" width="14" height="17" rx="2" stroke="currentColor" strokeWidth="2"/>
                  <path d="M9 9h6M9 13h6M9 17h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <span className="text-xl font-semibold text-white">DeepSeek</span>
            </div>
            <div className="flex gap-6 text-[#8286a5]">
              <a href="#" className="hover:text-white transition-colors">使用条款</a>
              <a href="#" className="hover:text-white transition-colors">隐私政策</a>
              <a href="#" className="hover:text-white transition-colors">联系我们</a>
            </div>
          </div>
          <div className="text-center text-[#8286a5] text-sm">
            © {new Date().getFullYear()} DeepSeek. 版权所有。使用 NextJS 和 Tailwind CSS 构建。
          </div>
        </div>
      </footer>
    </div>
  );
}
