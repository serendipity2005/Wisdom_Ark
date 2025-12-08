import { post, get } from '@/utils/request';

export interface InitUploadBody {
  originalName: string;
  md5: string;
  chunkSize: number;
  chunkNum: number;
  contentType: string;
}

export function checkFile(md5: string) {
  return get(`/minio/check/${md5}`);
}

export function initFile(body: InitUploadBody) {
  return post('/minio/init', body);
}

export function mergeChunks(md5: string) {
  return post(`/minio/merge/${md5}`);
}
