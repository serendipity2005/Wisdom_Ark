// uno.config.ts
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  transformerDirectives,
  transformerVariantGroup,
  presetWind3,
} from 'unocss';
import presetRemToPx from '@unocss/preset-rem-to-px';

export default defineConfig({
  // 预设配置
  presets: [
    presetAttributify(), // 属性化模式
    presetWind3(), //Taliwind 3.0 预设
    presetIcons({
      //   cdn: 'https://esm.sh/',
      collections: {
        lucide: () =>
          import('@iconify-json/lucide/icons.json').then((i) => i.default), //适配lucide  i-lucide-heart
      },
    }), // 图标预设
    // presetTypography(), // 排版预设(antd替代)
    // presetWebFonts({
    //   fonts: {
    //     sans: 'Inter:400,600,800',
    //     mono: 'JetBrains Mono:400,600',
    //   },
    // }), // 网络字体预设(使用antd默认预设)
    presetRemToPx({
      //默认情况下(1单位 = 0.25rem)html默认字体是16,改为4)每单位就是1px
      baseFontSize: 4,
    }),
  ],

  // 转换器
  transformers: [
    transformerDirectives(), // 支持 @apply 指令
    transformerVariantGroup(), // 支持变体组语法
  ],

  // 主题配置 - 仿掘金配色
  theme: {
    colors: {
      // eg:text-primary
      // 主色调
      primary: {
        DEFAULT: '#1e80ff',
        50: '#f0f8ff',
        100: '#e0f0ff',
        200: '#bae0ff',
        300: '#7cc8ff',
        400: '#1e80ff',
        500: '#0066cc',
        600: '#0052a3',
        700: '#004080',
        800: '#003366',
        900: '#002952',
      },
      // 成功色
      success: {
        DEFAULT: '#52c41a',
        50: '#f6ffed',
        100: '#d9f7be',
        200: '#b7eb8f',
        300: '#95de64',
        400: '#73d13d',
        500: '#52c41a',
        600: '#389e0d',
        700: '#237804',
        800: '#135200',
        900: '#092b00',
      },
      // 警告色
      warning: {
        DEFAULT: '#faad14',
        50: '#fffbe6',
        100: '#fff1b8',
        200: '#ffe58f',
        300: '#ffd666',
        400: '#ffc53d',
        500: '#faad14',
        600: '#d48806',
        700: '#ad6800',
        800: '#874d00',
        900: '#613400',
      },
      // 错误色
      error: {
        DEFAULT: '#ff4d4f',
        50: '#fff1f0',
        100: '#ffccc7',
        200: '#ffa39e',
        300: '#ff7875',
        400: '#ff4d4f',
        500: '#f5222d',
        600: '#cf1322',
        700: '#a8071a',
        800: '#820014',
        900: '#5c0011',
      },
      // 灰色系
      gray: {
        50: '#fafafa',
        100: '#f5f5f5',
        200: '#f0f0f0',
        300: '#d9d9d9',
        400: '#bfbfbf',
        500: '#8c8c8c',
        600: '#595959',
        700: '#434343',
        800: '#262626',
        900: '#1f1f1f',
        950: '#141414',
      },
      // 掘金特色色彩
      juejin: {
        blue: '#1e80ff',
        orange: '#ff6b35',
        green: '#00d4aa',
        purple: '#8b5cf6',
        pink: '#ec4899',
        yellow: '#f59e0b',
      },
    },
    // 断点配置  使用Antd Grid
    // breakpoints: {
    //   xs: '480px',
    //   sm: '640px',
    //   md: '768px',
    //   lg: '1024px',
    //   xl: '1280px',
    //   '2xl': '1536px',
    // },
    // 字体大小
    fontSize: {
      xs: ['12px', '16px'],
      sm: ['14px', '20px'],
      base: ['16px', '24px'],
      lg: ['18px', '28px'],
      xl: ['20px', '32px'],
      '2xl': ['24px', '36px'],
      '3xl': ['30px', '40px'],
      '4xl': ['36px', '48px'],
      '5xl': ['48px', '56px'],
      '6xl': ['60px', '72px'],
    },
    // 间距配置
    spacing: {
      '18': '4.5rem',
      '88': '22rem',
      '120': '30rem',
    },
    // 圆角配置
    borderRadius: {
      '4xl': '2rem',
      '5xl': '2.5rem',
    },
    // 阴影配置
    boxShadow: {
      juejin: '0 2px 12px 0 rgba(0, 0, 0, 0.1)',
      'juejin-hover': '0 4px 20px 0 rgba(0, 0, 0, 0.15)',
      card: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      'card-hover':
        '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    },
    // 动画配置
    animation: {
      'fade-in': 'fadeIn 0.5s ease-in-out',
      'slide-up': 'slideUp 0.3s ease-out',
      'bounce-in': 'bounceIn 0.6s ease-out',
    },
  },

  // 自定义规则
  rules: [
    // 文字省略号
    [
      'text-ellipsis-1',
      {
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
        'white-space': 'nowrap',
      },
    ],
    [
      'text-ellipsis-2',
      {
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
        display: '-webkit-box',
        '-webkit-line-clamp': '2',
        '-webkit-box-orient': 'vertical',
      },
    ],
    [
      'text-ellipsis-3',
      {
        overflow: 'hidden',
        'text-overflow': 'ellipsis',
        display: '-webkit-box',
        '-webkit-line-clamp': '3',
        '-webkit-box-orient': 'vertical',
      },
    ],

    // Flex 居中
    [
      'flex-center',
      {
        display: 'flex',
        'align-items': 'center',
        'justify-content': 'center',
      },
    ],

    // 绝对居中
    [
      'absolute-center',
      {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      },
    ],
    [
      'text-hover',
      {
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:cursor': 'pointer',
        '&:hover': {
          color: '#1e80ff',
        } as any,
      },
    ],
  ],

  // 快捷方式
  shortcuts: [
    // 页面布局
    ['container-fluid', 'w-full px-4 mx-auto'],
    ['container-md', 'max-w-screen-md mx-auto px-4'],
    ['container-lg', 'max-w-screen-lg mx-auto px-4'],
    ['container-xl', 'max-w-screen-xl mx-auto px-4'],

    // 掘金特色样式
    ['juejin-gradient', 'bg-gradient-to-r from-juejin-blue to-juejin-green'],
    [
      'juejin-text-gradient',
      'bg-gradient-to-r from-juejin-blue to-juejin-green bg-clip-text text-transparent',
    ],

    // 更丰富的悬停效果
    [
      'hover-blue',
      'hover:bg-primary hover:text-white hover:shadow-juejin-hover transition-all duration-200 ease-in-out',
    ],
  ],

  // 安全列表 - 确保这些类始终被包含
  safelist: ['prose', 'prose-sm', 'prose-lg', 'prose-xl', 'prose-2xl'],

  // 内容扫描路径
  content: {
    filesystem: ['src/**/*.{js,jsx,ts,tsx}', 'public/index.html'],
  },
});
