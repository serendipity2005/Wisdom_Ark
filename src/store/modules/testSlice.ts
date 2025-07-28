import { createSlice } from '@reduxjs/toolkit';
export const authSlice = createSlice({
  name: 'test',
  initialState: {
    token: sessionStorage.getItem('token') || null,
    menuList: [],
  },
  reducers: {
    setToken: (state, action) => {
      state.token = action.payload;
      sessionStorage.setItem('token', action.payload);
    },
    clearToken: (state) => {
      state.token = null;
      sessionStorage.removeItem('token');
    },
    setMenu: (state, action) => {
      console.log('authSlice');

      state.menuList = action.payload;
    },
  },
});
export const { setToken, clearToken, setMenu } = authSlice.actions;
export default authSlice.reducer;
