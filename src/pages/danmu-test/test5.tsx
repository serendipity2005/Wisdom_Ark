// Player.tsx
import React, { useRef } from 'react';
import {
  Switch,
  Popover,
  Checkbox,
  Slider,
  Button,
  Input,
  Select,
  Radio,
  Drawer,
  Tag,
  InputNumber,
  Space,
} from 'antd';
import {
  SettingOutlined,
  PictureFilled,
  FireOutlined,
} from '@ant-design/icons';
import './BarragePlayer.scss';
import videoSrc from '@/assets/video/play.mp4';

const { Option } = Select;

const Player: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="main">
      <div className="player">
        {/* 视频容器 */}
        <div id="container">
          <video ref={videoRef} src={videoSrc} id="video" controls autoPlay />
        </div>

        {/* 弹幕控制栏 */}
        <div className="barrage-container">
          <div className="controls">
            {/* 弹幕开关 */}
            <Switch className="barrage-switch" />

            {/* 弹幕渲染配置 */}
            <Popover
              placement="top"
              overlayClassName="barrage-setting"
              content={
                <div className="barrage-setting-inner">
                  <div className="setting-type">按类型屏蔽</div>
                  <Checkbox>示例类型</Checkbox>

                  <div className="setting-type">智能云屏蔽</div>
                  <Slider step={1} min={1} max={10} />

                  <Button type="primary" size="small" style={{ marginTop: 10 }}>
                    添加屏蔽词
                  </Button>

                  <div className="setting-type" style={{ marginTop: 10 }}>
                    不透明度
                  </div>
                  <Slider min={0} max={100} />

                  <div className="setting-type">显示区域</div>
                  <Radio.Group style={{ marginTop: 10 }}>
                    <Radio.Button value="all">全屏</Radio.Button>
                  </Radio.Group>

                  <div className="setting-type" style={{ marginTop: 10 }}>
                    弹幕速度（像素/每秒）
                  </div>
                  <Radio.Group style={{ marginTop: 10 }}>
                    <Radio.Button value="fast">快</Radio.Button>
                  </Radio.Group>

                  <div className="setting-type" style={{ marginTop: 10 }}>
                    弹幕禁止重叠
                  </div>
                  <Switch />

                  <div className="setting-type" style={{ marginTop: 10 }}>
                    描边类型
                  </div>
                  <Radio.Group style={{ marginTop: 10 }}>
                    <Radio.Button value="none">无</Radio.Button>
                  </Radio.Group>

                  <div className="setting-type" style={{ marginTop: 10 }}>
                    人像防挡
                  </div>
                  <Switch />
                </div>
              }
              trigger="hover"
            >
              <SettingOutlined style={{ fontSize: 25, cursor: 'pointer' }} />
            </Popover>

            {/* 弹幕输入框 */}
            <Input
              placeholder="ヾ(*´▽‘*)ﾉ 发个弹幕呗！！"
              size="small"
              className="barrage-input"
              prefix={
                <Popover
                  placement="top"
                  overlayClassName="barrage-setting"
                  trigger="hover"
                  content={
                    <div className="barrage-setting-inner">
                      <div className="setting-type">字号</div>
                      <Radio.Group size="small" className="mg-10">
                        <Radio.Button value="small">小</Radio.Button>
                        <Radio.Button value="large">大</Radio.Button>
                      </Radio.Group>

                      <div className="setting-type">模式</div>
                      <Radio.Group size="small" className="mg-10">
                        <Radio.Button value="scroll">滚动</Radio.Button>
                      </Radio.Group>

                      <div className="setting-type">颜色</div>
                      <div className="colors mg-10">
                        <div className="color-item" />
                      </div>
                    </div>
                  }
                >
                  <Button icon={<FireOutlined />} />
                </Popover>
              }
              suffix={
                <Popover
                  placement="top"
                  overlayClassName="barrage-setting"
                  trigger="hover"
                  content={
                    <div className="image-select">
                      <Radio.Group size="small" style={{ marginBottom: 10 }}>
                        <Radio.Button value="emoji">表情</Radio.Button>
                      </Radio.Group>
                      <div style={{ maxHeight: 370, overflowY: 'auto' }}>
                        <img className="barrage-img" src="" alt="弹幕图" />
                      </div>
                    </div>
                  }
                >
                  <PictureFilled style={{ fontSize: 20, cursor: 'pointer' }} />
                </Popover>
              }
              addonAfter={
                <Space.Compact>
                  <Button>发送</Button>
                  <Button>发祝福</Button>
                  <Popover
                    placement="top"
                    overlayClassName="barrage-setting"
                    trigger="hover"
                    content={
                      <div className="senior-barrage-config">
                        <div className="header">
                          <div className="title">高级弹幕配置</div>
                        </div>
                        <div className="content">
                          <div className="setting-type">起始点</div>
                          <div className="setting-items">
                            <div className="setting-item">
                              <div className="label">x</div>
                              <InputNumber
                                precision={1}
                                step={0.1}
                                size="small"
                              />
                            </div>
                            <div className="setting-item">
                              <div className="label">y</div>
                              <InputNumber
                                precision={1}
                                step={0.1}
                                size="small"
                              />
                            </div>
                          </div>
                          <div className="setting-type">结束点</div>
                          <div className="setting-items">
                            <div className="setting-item">
                              <div className="label">x</div>
                              <InputNumber
                                precision={1}
                                step={0.1}
                                size="small"
                              />
                            </div>
                            <div className="setting-item">
                              <div className="label">y</div>
                              <InputNumber
                                precision={1}
                                step={0.1}
                                size="small"
                              />
                            </div>
                          </div>
                          <div className="setting-type">生存时间（ms）</div>
                          <InputNumber size="small" />

                          <div className="setting-type">延迟时间（ms）</div>
                          <InputNumber size="small" />

                          <div className="setting-type">运动时长（ms）</div>
                          <InputNumber size="small" />
                        </div>
                        <div className="footer">
                          <Button type="primary">发送</Button>
                        </div>
                      </div>
                    }
                  >
                    <Button>高级弹幕</Button>
                  </Popover>
                </Space.Compact>
              }
            />

            {/* 视频切换 */}
            <Select style={{ marginLeft: 10, width: 120 }}>
              <Option value="1">视频1</Option>
            </Select>
          </div>
        </div>
      </div>

      {/* 屏蔽词抽屉 */}
      <Drawer title="屏蔽词管理" placement="right">
        <Tag closable style={{ marginRight: 10 }}>
          示例词
        </Tag>
        <Input size="small" style={{ width: 120, marginRight: 10 }} />
        <Button size="small">+ New Word</Button>
        <Button size="small" style={{ marginLeft: 8 }}>
          Clear All
        </Button>
      </Drawer>
    </div>
  );
};

export default Player;
