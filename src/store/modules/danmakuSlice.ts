import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// 弹幕数据结构
export interface DanmakuItem {
  id: string;
  text: string;
  x: number;
  y: number;
  speed: number;
  color: string;
  fontSize: number;
  opacity: number;
  width: number;
  timestamp: number;
  type: 'scroll' | 'top' | 'bottom';
}

// Redux状态类型
export interface DanmakuState {
  danmakus: DanmakuItem[];
  isPlaying: boolean;
  settings: {
    opacity: number;
    fontSize: number;
    speed: number;
    density: number;
    showDanmaku: boolean;
  };
}

// 初始状态
const initialState: DanmakuState = {
  danmakus: [],
  isPlaying: true,
  settings: {
    opacity: 0.8,
    fontSize: 20,
    speed: 1,
    density: 100,
    showDanmaku: true,
  },
};

// 创建 slice
export const danmakuSlice = createSlice({
  name: 'danmaku',
  initialState,
  reducers: {
    // 添加弹幕
    addDanmaku: (state, action: PayloadAction<DanmakuItem>) => {
      state.danmakus.push(action.payload);
    },

    // 删除弹幕
    removeDanmaku: (state, action: PayloadAction<string>) => {
      state.danmakus = state.danmakus.filter((d) => d.id !== action.payload);
    },

    // 修改配置
    updateSettings: (
      state,
      action: PayloadAction<Partial<typeof state.settings>>,
    ) => {
      state.settings = { ...state.settings, ...action.payload };
    },

    // 控制播放
    togglePlay: (state) => {
      state.isPlaying = !state.isPlaying;
    },

    // 清除弹幕
    clearDanmakus: (state) => {
      state.danmakus = [];
    },

    // 更新弹幕位置的 reducer（用于避免直接修改状态）
    updateDanmakuPosition: (
      state,
      action: PayloadAction<{ id: string; x: number }>,
    ) => {
      const danmaku = state.danmakus.find((d) => d.id === action.payload.id);
      if (danmaku) {
        danmaku.x = action.payload.x;
      }
    },
  },
});

// 导出 actions
export const {
  addDanmaku,
  removeDanmaku,
  updateSettings,
  togglePlay,
  clearDanmakus,
  updateDanmakuPosition,
} = danmakuSlice.actions;

// 导出 reducer
export default danmakuSlice.reducer;
