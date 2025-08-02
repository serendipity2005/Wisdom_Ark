// 接收1.headerMenu,
import './index.scss';
import {
  Layout,
  Menu,
  Row,
  theme,
  Col,
  type MenuProps,
  Input,
  Dropdown,
  Avatar,
  Space,
  Badge,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { BellFilled, CaretDownFilled } from '@ant-design/icons';

import { useScrollVisibility } from '@/hooks/useScrollVisibility';

type MenuItem = Required<MenuProps>['items'][number];
interface MyHeaderProps {
  headMenu?: MenuItem[];
  children?: React.ReactNode;
}
const { Header } = Layout;
const { Search } = Input;

// 默认头部菜单
const defaultHeadMenu: MenuItem[] = [
  {
    key: '/',
    label: '首页',
  },
  {
    key: '/pins',
    label: '沸点',
  },
  {
    key: '/dowbload',
    label: '下载',
  },
  {
    key: '/live',
    label: '直播',
  },
];
// 创作者中心菜单
const items = [
  {
    key: '1',
    label: '写文章',
  },
  {
    key: '2',
    label: '写沸点',
  },
];

export default function MyHeader(props?: MyHeaderProps) {
  const { headMenu } = props || {};

  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const handleMenu: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };
  const navigate = useNavigate();
  const visible = useScrollVisibility();
  return (
    <Header
      className={`myHeader ${visible ? '' : 'hide'}`}
      style={{
        background: colorBgContainer,
      }}
    >
      <Row className=" header-container max-w-[1440px] w-full">
        {/* logo */}
        <Col span={4} className="flex-center">
          <div className="logo flex-center">
            <img src="/logo.png" alt="" />
          </div>
        </Col>
        {/* 导航菜单 */}
        <Col span={20}>
          <Row>
            <Col span={12}>
              {!props?.children && (
                <Menu
                  selectedKeys={[location.pathname]}
                  onClick={handleMenu}
                  mode="horizontal"
                  items={headMenu || defaultHeadMenu}
                />
              )}
              {props?.children}
            </Col>

            {/* 右侧菜单 */}
            <Col
              span={12}
              className="flex-center"
              style={{ alignItems: 'center', display: 'flex' }}
            >
              <Space align="center" style={{ width: '100%' }} size="middle">
                <Search className="top-search" placeholder="搜索" allowClear />

                <Dropdown.Button
                  type="primary"
                  menu={{ items }}
                  icon={<CaretDownFilled />}
                >
                  创作者中心
                </Dropdown.Button>

                {/* 通知 */}
                <Badge count={1} size="small">
                  <BellFilled
                    style={{
                      fontSize: '20px',
                      color: `#8a919f`,
                    }}
                  />
                </Badge>

                {/* 头像 */}
                <Dropdown>
                  <Avatar
                    src="https://avatars.githubusercontent.com/u/1?v=4"
                    style={{ cursor: 'pointer' }}
                  />
                </Dropdown>
              </Space>
            </Col>
          </Row>
        </Col>
      </Row>
    </Header>
  );
}
