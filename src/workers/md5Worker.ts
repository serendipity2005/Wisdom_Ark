import SparkMD5 from 'spark-md5';

self.onmessage = async (e: MessageEvent) => {
  const { file, chunkSize } = (e.data || {}) as {
    file: File;
    chunkSize: number;
  };
  if (!file || !chunkSize) {
    (self as any).postMessage({ type: 'error', error: '参数缺失' });
    return;
  }

  try {
    const spark = new SparkMD5.ArrayBuffer();
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const buf = await file.slice(start, end).arrayBuffer();
      spark.append(buf);

      const progress = Math.round(((i + 1) / totalChunks) * 100);
      if (progress % 25 === 0 || progress === 100) {
        (self as any).postMessage({ type: 'progress', progress });
      }
    }

    const md5 = spark.end();
    (self as any).postMessage({ type: 'done', md5 });
  } catch (err: any) {
    (self as any).postMessage({
      type: 'error',
      error: err?.message || String(err),
    });
  }
};
