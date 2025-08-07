import './index.scss';
import { useState, useRef, useEffect } from 'react';
import { Smile, Star, StarOff } from 'lucide-react';
import { Input, Button, ConfigProvider } from 'antd';
import { useResponsive } from 'antd-style';

const { TextArea } = Input;

interface ChatInputProps {
  onHeightChange: (height: number) => void;
}

interface LikeEffect {
  text: string;
  x: number;
  y: number;
  size: number;
  alpha: number;
  angle: number;
  id: number;
}

export default function ChatInput({ onHeightChange }: ChatInputProps) {
  const { xxl } = useResponsive();
  const [showStar, setShowStar] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [effects, setEffects] = useState<LikeEffect[]>([]);
  const buttonRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  const toggleStar = () => {
    setShowStar(!showStar);
  };

  const handleFocus = () => {
    setIsFocused(true);
    onHeightChange(155);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onHeightChange(85);
  };

  const handleLikeClick = () => {
    if (!buttonRef.current) return;

    const buttonRect = buttonRef.current.getBoundingClientRect();
    const iconList = [
      '🍇',
      '🍈',
      '🍉',
      '🍊',
      '🍋',
      '🍌',
      '🍍',
      '🥭',
      '🍎',
      '🍒',
      '🧄',
    ];
    const index = Math.floor(Math.random() * iconList.length);

    const newEffect: LikeEffect = {
      text: iconList[index],
      x: buttonRect.left + buttonRect.width / 2,
      y: buttonRect.top - 20,
      size: 20,
      alpha: 1,
      angle: Math.random() * Math.PI * 2,
      id: nextId.current++,
    };

    setEffects((prev) => [...prev, newEffect]);
  };

  useEffect(() => {
    if (effects.length === 0) return;

    const timer = setInterval(() => {
      setEffects((prev) =>
        prev
          .map((effect) => ({
            ...effect,
            y: effect.y - 2,
            size: effect.size + 0.5,
            alpha: effect.alpha - 0.02,
            x: effect.x + Math.cos(effect.angle) * 1,
            angle: effect.angle + 0.05,
          }))
          .filter((effect) => effect.alpha > 0),
      );
    }, 16);

    return () => clearInterval(timer);
  }, [effects]);

  return (
    <div className="chat-box w-full bg-white relative">
      {/* 点赞特效元素 */}
      {effects.map((effect) => (
        <div
          key={effect.id}
          className="fixed pointer-events-none"
          style={{
            left: `${effect.x}px`,
            top: `${effect.y}px`,
            fontSize: `${effect.size}px`,
            opacity: effect.alpha,
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.1s linear',
            zIndex: 10,
          }}
        >
          {effect.text}
        </div>
      ))}

      <div className="emoji-box flex items-center">
        <Smile className="w-20 h-20 text-gray-600 mr-10 cursor-pointer hover:text-blue-500 transition-colors" />
        {showStar ? (
          <Star
            className="w-20 h-20 text-gray-600 cursor-pointer hover:text-blue-500 transition-colors"
            onClick={toggleStar}
          />
        ) : (
          <StarOff
            className="w-20 h-20 text-gray-600 cursor-pointer hover:text-gray-400 transition-colors"
            onClick={toggleStar}
          />
        )}
        <div
          ref={buttonRef}
          className="ml-auto text-24 cursor-pointer"
          onClick={handleLikeClick}
        >
          <span className="text-9">1111</span>🎉
        </div>
      </div>
      <div className="mes-input">
        <TextArea
          showCount
          maxLength={200}
          placeholder="快来和大家一起聊天吧！"
          style={{
            height: isFocused ? 90 : 30,
            resize: 'none',
            transition: 'height 0.3s ease-in-out',
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <ConfigProvider componentSize={xxl ? 'middle' : 'small'}>
          <Button color="primary" variant="filled" className="border-0 mt-6">
            发送
          </Button>
        </ConfigProvider>
      </div>
    </div>
  );
}
