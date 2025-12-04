import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface UserState {
  isLogin: boolean;
  username: string;
}

export const userSlice = createSlice({
  name: 'user',
  initialState: {
    isLogin: false,
    username: '',
  },
  reducers: {
    // 登录成功时调用
    setUserLogin: (state, action: PayloadAction<{ username?: string }>) => {
      state.isLogin = true;
      state.username = action.payload.username as string;
    },
    // 登出时调用
    setUserLogout: (state) => {
      state.isLogin = false;
      state.username = '';
    },
    // 更新用户名
    setUsername: (state, action: PayloadAction<string>) => {
      state.username = action.payload;
    },
  },
});
// 导出 action creators
export const { setUserLogin, setUserLogout, setUsername } = userSlice.actions;
export default userSlice.reducer;
