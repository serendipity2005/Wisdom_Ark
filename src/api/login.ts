import { post, get } from '@/utils/request';
interface LoginData {
  username?: string;
  email?: string;
  pwd: string;
  code?: string;
}
interface CodeData {
  email: string;
}

// 发送验证码
export function sendCode({ email }: CodeData) {
  return post(`/auth/email/code/${email}`);
}
export function loginWithCode({ email, code }: LoginData) {
  return post(`/auth/email/login/${email}/${code}`);
}
export function loginWithPassword(data: LoginData) {
  return post('/auth/email/login', data);
}
export function loginWithThird(type: string) {
  return post('/auth/' + type + '/login');
}
export function getMenu() {
  return get('/menu');
}
