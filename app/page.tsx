"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-900 text-white">
      <h1 className="text-4xl font-bold mb-8">DeepSeek 聊天界面演示</h1>
      
      <div className="w-full max-w-4xl">
        <Card className="bg-zinc-800 border-zinc-700 text-white">
          <CardHeader>
            <CardTitle>选择功能</CardTitle>
            <CardDescription className="text-zinc-400">以下是可用的演示功能</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button asChild className="bg-blue-600 hover:bg-blue-700 w-full">
              <Link href="/chat">
                进入聊天界面
              </Link>
            </Button>
            
            <Button asChild className="bg-purple-600 hover:bg-purple-700 w-full">
              <Link href="/api-test">
                API 测试工具
              </Link>
            </Button>
            
            <div className="bg-zinc-700 rounded-lg p-4 text-zinc-300">
              <h3 className="font-medium mb-2">界面特点：</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>DeepSeek风格的深色主题UI</li>
                <li>完整的聊天功能实现</li>
                <li>响应式布局设计</li>
                <li>侧边栏历史会话</li>
                <li>按钮工具提示</li>
                <li>API集成与数据库存储</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
