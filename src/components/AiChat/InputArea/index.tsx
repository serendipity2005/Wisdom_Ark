import type React from 'react';
import { useRef, useState } from 'react';
import { Input, Button, Space, Card, Tooltip, Dropdown } from 'antd';
import {
  SendOutlined,
  AudioOutlined,
  AppstoreAddOutlined,
  LoadingOutlined,
} from '@ant-design/icons';
import './index.scss';

interface InputAreaProps {
  quickActions: {
    key: string;
    icon: React.ReactElement;
    label: string;
    // color: string;
  }[];
  handleMenuClick: (e: any) => void;
  aiType: React.ReactNode;
  setAiType: (aiType: any) => void;
  handleSendMessage: (message: string) => void;
  msgLoading: boolean;
}

const { TextArea } = Input;

// 扩展Window接口类型
declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

function InputArea({
  quickActions,
  handleMenuClick,
  aiType,
  setAiType,
  handleSendMessage,
  msgLoading,
}: InputAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('准备就绪');
  const recognitionRef = useRef<any>(null);

  const startListening = () => {
    // 如果已经在监听，则先停止
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    setStatus('正在监听...');
    setIsListening(true);

    const recognition = new window.webkitSpeechRecognition();
    recognitionRef.current = recognition;

    recognition.lang = 'zh-CN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 5;
    // 设置超时时间
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setStatus('请说话...');
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setTranscript(transcript);
      setStatus(`识别结果: ${transcript}`);
    };

    recognition.onerror = (event: any) => {
      console.error('语音识别错误:', event.error);
      setIsListening(false);
      recognitionRef.current = null;
      switch (event.error) {
        case 'no-speech':
          setStatus('未检测到语音，请大声一点说话');
          break;
        case 'audio-capture':
          setStatus('未检测到麦克风设备');
          break;
        case 'not-allowed':
          setStatus('麦克风权限被拒绝，请允许使用麦克风');
          break;
        default:
          setStatus(`识别出错: ${event.error}`);
      }
      console.log(setStatus);
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatus('识别结束');
      recognitionRef.current = null;
    };

    try {
      recognition.start();
    } catch (error) {
      console.error('启动语音识别失败:', error);
      setStatus('启动语音识别失败');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      setStatus('已停止');
    }
  };

  const handleGainMessage = () => {
    if (inputValue.trim()) {
      handleSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <div className="input-area">
      <Card className="input-card">
        {aiType !== null && (
          <Tooltip title="点击退出技能">
            <Button
              className="ai-type"
              size="small"
              onClick={() => setAiType(null)}
            >
              {aiType}
            </Button>
          </Tooltip>
        )}
        <TextArea
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="发消息... 输入 @ 选择技能或 / 选择文件"
          autoSize={{ minRows: 1, maxRows: 6 }}
          className="input-textarea"
          onPressEnter={(e) => {
            if (e.shiftKey) return;
            e.preventDefault();
            handleGainMessage();
          }}
          value={inputValue || transcript}
        />

        <div className="input-actions">
          <Space>
            {/* <Tooltip title="附件">
              <Button type="text" icon={<PaperClipOutlined />} size="small" />
            </Tooltip>
            <Tooltip title="深度思考">
              <Button type="text" size="small" style={{ fontSize: "12px" }}>
                🧠 深度思考
              </Button>
            </Tooltip> */}
            <Dropdown menu={{ items: quickActions, onClick: handleMenuClick }}>
              <Button className="action-button" type="text" size="small">
                <AppstoreAddOutlined />
                技能
              </Button>
            </Dropdown>
          </Space>

          <Space>
            {isListening ? (
              <Tooltip title="停止语音输入">
                <Button
                  type="text"
                  onClick={stopListening}
                  icon={<LoadingOutlined style={{ fontSize: '16px' }} />}
                  size="small"
                  className="voice-button"
                />
              </Tooltip>
            ) : (
              <Tooltip title="语音输入">
                <Button
                  type="text"
                  onClick={startListening}
                  icon={<AudioOutlined style={{ fontSize: '16px' }} />}
                  size="small"
                  className="voice-button"
                />
              </Tooltip>
            )}
            <Button
              type="primary"
              icon={<SendOutlined style={{ fontSize: '16px' }} />}
              size="small"
              className="send-button"
              style={{ borderRadius: '6px' }}
              onClick={handleGainMessage}
              disabled={!inputValue.trim() || msgLoading}
            />
          </Space>
        </div>
      </Card>
    </div>
  );
}

export default InputArea;
