import { Popover, Avatar, Button, Typography, theme } from 'antd';
import './index.scss';

const { Text, Title } = Typography;
interface UserPopoverProps {
  username?: string;
  avatar?: string;
  focus?: number | string;
  fans?: number | string;
  description?: string;
  lvLevel?: number;
  jyLevel?: number;
  focusFn?: () => void;
  privateFn?: () => void;
}
export default function UserPopover(props: UserPopoverProps) {
  const {
    username = '小舟',
    avatar = 'https://avatars.githubusercontent.com/u/1?v=4',
    focus = 0,
    fans = 0,
    description = '暂无描述',
    lvLevel = 0,
    jyLevel = 0,
    focusFn,
    privateFn,
  } = props;
  const {
    token: {},
  } = theme.useToken();
  return (
    <Popover
      content={
        <div className="user-popover-content">
          {/* 用户头像和基本信息 */}
          <div className="user-header">
            <div className="flex align-center">
              <Avatar
                src={avatar}
                style={{ marginRight: '10px' }}
                size={50} // 固定大小，可根据需求调整
              />
              <div className="flex-wrap">
                <div className="user-name flex">
                  <Title style={{ fontSize: '16px', marginBottom: '0' }}>
                    {username}
                  </Title>
                  <div className="user-tags">
                    <span className="tag lv-tag">LV.{lvLevel}</span>
                    <span className="tag jy-tag">JY.{jyLevel}</span>
                  </div>
                </div>

                <Text
                  type="secondary"
                  style={{ display: 'block', textAlign: 'left' }}
                >
                  {description}
                </Text>
              </div>
            </div>
          </div>

          {/* 关注和私信按钮 */}
          <div className="action-buttons">
            <Button
              type="primary"
              block
              className="follow-btn"
              onClick={focusFn}
            >
              关注
            </Button>
            <Button
              variant="filled"
              className="message-btn"
              block
              onClick={privateFn}
            >
              私信
            </Button>
          </div>

          {/* 关注数和粉丝数 */}
          <div className="stats">
            <div className="stat-item">
              <Text strong>{focus}</Text>
              <Text type="secondary">关注</Text>
            </div>
            <div className="stat-item">
              <Text strong>{fans}</Text>
              <Text type="secondary">粉丝</Text>
            </div>
          </div>
        </div>
      }
      trigger="hover"
    >
      <Text className="t-hover " style={{ fontSize: '13px' }}>
        {username}
      </Text>
    </Popover>
  );
}
