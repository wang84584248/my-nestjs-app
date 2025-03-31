"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ApiTester() {
  const [inputValue, setInputValue] = useState("");
  const [response, setResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleTest = async () => {
    if (!inputValue.trim() || isLoading) return;
    
    setIsLoading(true);
    setError("");
    setResponse("");
    
    try {
      const messages = [
        {
          role: "user",
          content: inputValue.trim()
        }
      ];
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          userId: 'guest'
        }),
      });
      
      if (!response.ok) {
        throw new Error(`API请求失败: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.choices && data.choices[0] && data.choices[0].message) {
        setResponse(data.choices[0].message.content);
      } else {
        throw new Error('API响应格式无效');
      }
    } catch (error) {
      console.error('测试失败:', error);
      setError(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto bg-zinc-800 border-zinc-700 text-white">
      <CardHeader>
        <CardTitle>API测试工具</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="输入您的消息..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="min-h-[100px] bg-zinc-900 border-zinc-700 text-white"
          />
          <Button 
            onClick={handleTest}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isLoading ? '处理中...' : '发送请求'}
          </Button>
        </div>
        
        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-md text-red-200">
            {error}
          </div>
        )}
        
        {response && (
          <div className="space-y-2">
            <h3 className="font-medium">响应:</h3>
            <div className="p-4 bg-zinc-900 rounded-md whitespace-pre-wrap">
              {response}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 