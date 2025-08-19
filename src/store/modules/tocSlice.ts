import { createSlice } from '@reduxjs/toolkit';
export const tocSlice = createSlice({
  name: 'toc',
  initialState: {
    tocItems: [],
  },
  reducers: {
    setTocItems: (state, action) => {
      state.tocItems = action.payload;
    },
  },
});
export const { setTocItems } = tocSlice.actions;
export default tocSlice.reducer;
