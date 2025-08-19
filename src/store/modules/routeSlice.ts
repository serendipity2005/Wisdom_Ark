import type { BackendRoute } from '@/types/routes';
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export interface RouteState {
  route: {
    routes: BackendRoute[];
  };
}

const routeSlice = createSlice({
  name: 'route',
  initialState: {
    routes: [] as BackendRoute[],
  },
  reducers: {
    setRoutes: (state, action: PayloadAction<BackendRoute[]>) => {
      state.routes = action.payload;
      console.log(state, action);
    },
  },
});

export const { setRoutes } = routeSlice.actions;
export default routeSlice.reducer;
