// aiTools.ts
import { z } from 'zod';

// 声明工具集
const toolsMap = new Map([
  [
    'writeCode',
    {
      type: 'function',
      function: {
        name: 'writeCode',
        description: '将代码储存为文件',
        parameters: z.object({
          code: z.string().describe('代码'),
        }),
      },
      fun: async ({ code }: { code: string }) => {
        try {
          // 在浏览器中创建一个可下载的文件
          const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'code.txt'; // 默认文件名
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url); // 清理 URL

          return {
            role: 'tool',
            content: '代码生成成功',
          };
        } catch (error) {
          return {
            role: 'tool',
            content: '代码下载失败',
          };
        }
      },
    },
  ],
]);

export default toolsMap;
