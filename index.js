const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

let T = 0;
let testCases = [];
let caseIndex = 0;
let lineCount = 0;

rl.on('line', (line) => {
  line = line.trim();
  if (line === '') return;
  if (T === 0) {
    // 读取测试组数 T
    T = parseInt(line);
  } else {
    if (caseIndex < T) {
      // 每组读 2 行：第 1 行是节点数 n，第 2 行是传输限制 d
      if (lineCount % 2 === 0) {
        const num = parseInt(line);
        testCases.push({ num, d: [] }); // 初始化每组数据（包含 num 和 d）
      } else {
        const d = line.split(' ').map(Number);
        testCases[caseIndex].d = d; // 给当前组的 d 赋值
        caseIndex++;
      }
      lineCount++;
    }
    if (caseIndex === T) {
      // 处理所有测试用例
      testCases.forEach((testCase) => {
        console.log(getMinServicePoints(testCase.num, testCase.d));
      });
      rl.close();
    }
  }
});

function getMinServicePoints(n, d) {
  if (n === 0) return 0;
  let res = 0;
  let i = 0;
  while (i < n) {
    const right = i + 1 + d[i]; // 节点 i+1 的覆盖右边界
    res++;
    let maxRight = right;
    let j = i;
    // 遍历当前服务点能覆盖的所有节点，更新最大右边界
    while (j < n && j + 1 <= maxRight) {
      maxRight = Math.max(maxRight, j + 1 + d[j]);
      j++;
    }
    i = j; // 跳到下一个未覆盖的节点
  }
  return res;
}
