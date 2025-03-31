import { ApiTester } from "@/components/ApiTester";

export default function ApiTestPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 bg-zinc-900 text-white">
      <h1 className="text-3xl font-bold mb-8">DeepSeek API 测试</h1>
      <ApiTester />
    </div>
  );
} 