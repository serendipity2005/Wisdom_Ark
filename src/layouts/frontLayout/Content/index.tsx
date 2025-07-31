import {
  UserOutlined,
  EyeOutlined,
  LikeOutlined,
  HomeOutlined,
  CodeOutlined,
  BookOutlined,
  QuestionCircleOutlined,
  MobileOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import './index.scss';
import {
  Card,
  Col,
  Layout,
  List,
  Menu,
  Row,
  Space,
  Tag,
  Typography,
  type MenuProps,
} from 'antd';

const { Text, Title } = Typography;
import { useEffect, useRef, useState } from 'react';
import UserPopover from '@/components/UserPopover';
import RightSide from '@/layouts/frontLayout/RightSide';

type MenuItem = Required<MenuProps>['items'][number];
const headMenu: MenuItem[] = [
  {
    key: '/',
    label: '推荐',
  },
  {
    key: '/pins',
    label: '关注',
  },
];
const { Content } = Layout;
// 模拟文章数据
const mockArticles = [
  {
    id: 1,
    title: 'package.json 中 dependencies 的版本号：它真的是版本号吗？',
    content:
      '本文全面解析 package.json 中依赖版本号的各种写法，包含 ^、~、*、file:、workspace:、Git 地址等，揭示背后...',
    author: 'CAD老兵',
    time: '2天前',
    views: '4.9k',
    likes: 33,
    tags: ['前端', 'JavaScript'],
    avatar: 'https://avatars.githubusercontent.com/u/1?v=4',
  },
  {
    id: 2,
    title: '为何前端圈现在不关注源码了？',
    content:
      '大家好，我是想就老师，也是 wangEditor 作者。大家有没有发现一个现象：最近 1-2 年，前端圈不再关注源码了...',
    author: '前端双越老师',
    time: '1天前',
    views: '4.0k',
    likes: 41,
    tags: ['源码', '面试', '前端框架'],
  },
  {
    id: 3,
    title: '一个 4.7 GB 视频的浏览器拖进 OOM',
    content:
      '你给一家在线教育平台做「课程视频播放上传」功能，需求假如是这样：讲师后台一次性拖拖 20 个 4K 视频，浏览...',
    author: '前端微白',
    time: '2天前',
    views: '2.9k',
    likes: 73,
    tags: ['前端', 'JavaScript'],
  },
  {
    id: 4,
    title: '开源一个掘金自动签到的油猴脚本',
    content:
      '引言 作为一名掘金的忠实用户，我每天只开网站的第一件事就是签到，最近在写小册《油猴...',
    author: '石小石Orz',
    time: '3天前',
    views: '1.4k',
    likes: 20,
    tags: ['前端'],
  },
  {
    id: 5,
    title: 'localStorage 你很好，我选 IndexedDB',
    content:
      'localStorage 你很好，我选 IndexedDB 在 Web 开发的早期，我们对 localStorage 是爱得...',
    author: '芝士猫',
    time: '4天前',
    views: '1.2k',
    likes: 12,
    tags: ['前端', 'JavaScript', '面试'],
  },
  {
    id: 5,
    title: 'localStorage 你很好，我选 IndexedDB',
    content:
      'localStorage 你很好，我选 IndexedDB 在 Web 开发的早期，我们对 localStorage 是爱得...',
    author: '芝士猫',
    time: '4天前',
    views: '1.2k',
    likes: 12,
    tags: ['前端', 'JavaScript', '面试'],
  },
  {
    id: 5,
    title: 'localStorage 你很好，我选 IndexedDB',
    content:
      'localStorage 你很好，我选 IndexedDB 在 Web 开发的早期，我们对 localStorage 是爱得...',
    author: '芝士猫',
    time: '4天前',
    views: '1.2k',
    likes: 12,
    tags: ['前端', 'JavaScript', '面试'],
  },
];

//
const isElementInView = (element: HTMLElement): boolean => {
  if (!element) return false;

  const rect = element.getBoundingClientRect();
  console.log(rect);
  // 判断元素是否完全在窗口内
  const isInView = !(rect.bottom < 0);

  return isInView;
};

// 侧边栏菜单项
const sidebarItems = [
  { key: 'follow', icon: <UserOutlined />, label: '关注' },
  { key: 'comprehensive', icon: <HomeOutlined />, label: '综合', active: true },
  { key: 'backend', icon: <CodeOutlined />, label: '后端' },
  { key: 'frontend', icon: <BookOutlined />, label: '前端' },
  { key: 'android', icon: <MobileOutlined />, label: 'Android' },
  { key: 'ios', icon: <MobileOutlined />, label: 'iOS' },
  { key: 'ai', icon: <QuestionCircleOutlined />, label: '人工智能' },
  { key: 'tools', icon: <ToolOutlined />, label: '开发工具' },
  { key: 'career', icon: <UserOutlined />, label: '代码人生' },
  { key: 'reading', icon: <BookOutlined />, label: '阅读' },
];

export default function MyContent() {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isTop, setIsTop] = useState<boolean>(false);

  //   const handleScroll = () => {
  //     const siderbar = sidebarRef!.current;
  //     const rect = siderbar.getBoundingClientRect();
  //     const viewportWidth = window.innerWidth;
  //     const viewportHeight = window.innerHeight;
  //     const isInView =
  //       rect.top >= 0 &&
  //       rect.left >= 0 &&
  //       rect.bottom <= viewportHeight &&
  //       rect.right <= viewportWidth;
  //   };
  useEffect(() => {
    const checkSidebarInView = () => {
      if (sidebarRef.current) {
        const isInView = isElementInView(sidebarRef.current);
        setIsTop(!isInView);
      }
    };

    // 初始检查
    checkSidebarInView();

    // 监听滚动和窗口大小变化事件
    window.addEventListener('scroll', checkSidebarInView);
    window.addEventListener('resize', checkSidebarInView);

    // 清理事件监听器
    return () => {
      window.removeEventListener('scroll', checkSidebarInView);
      window.removeEventListener('resize', checkSidebarInView);
    };
  }, []);

  return (
    <Content
      className="content"
      style={{ padding: 0, minHeight: 'calc(100vh - 64px)' }}
    >
      <Row gutter={24}>
        {/* 文章列表 */}
        <Col className="article-container" span={16}>
          <Card
            size="small"
            variant="borderless"
            style={{
              background: '#fff',
              borderRadius: '8px',
            }}
          >
            {/* 顶部标签切换 */}
            <div
              className="article-container-header"
              style={{
                borderBottom: '1px solid #f0f0f0',
              }}
            >
              <Menu mode="horizontal" items={headMenu} />
            </div>

            {/* 文章列表 */}
            <div className="article-list">
              <List
                dataSource={mockArticles}
                renderItem={(article) => (
                  <List.Item className="article-list-item">
                    <div style={{ width: '100%' }}>
                      <Title
                        className="article-list-item-title"
                        style={{
                          margin: '0 0 8px 0',
                          color: '#252933',
                          cursor: 'pointer',
                        }}
                      >
                        {article.title}
                      </Title>
                      {/* <span className='title'>{article.title}</span> */}
                      <Text
                        type="secondary"
                        style={{
                          fontSize: '14px',
                          lineHeight: '22px',
                          display: 'block',
                          marginBottom: '12px',
                        }}
                      >
                        {article.content}
                      </Text>

                      <Row justify="space-between" align="middle">
                        <Col>
                          <Space size="middle">
                            <Space size="small">
                              {/* <Avatar size="small" src={article.avatar} /> */}
                              <UserPopover></UserPopover>
                            </Space>
                            <Text type="secondary" style={{ fontSize: '13px' }}>
                              {article.time}
                            </Text>
                            <Space size="small">
                              <EyeOutlined style={{ fontSize: '12px' }} />
                              <Text
                                type="secondary"
                                style={{ fontSize: '13px' }}
                              >
                                {article.views}
                              </Text>
                            </Space>
                            <Space size="small">
                              <LikeOutlined style={{ fontSize: '12px' }} />
                              <Text
                                type="secondary"
                                style={{ fontSize: '13px' }}
                              >
                                {article.likes}
                              </Text>
                            </Space>
                          </Space>
                        </Col>
                        <Col>
                          <Space size="small">
                            {article.tags?.map((tag) => (
                              <Tag
                                key={tag}
                                color="blue"
                                style={{ fontSize: '12px' }}
                              >
                                {tag}
                              </Tag>
                            ))}
                          </Space>
                        </Col>
                      </Row>
                    </div>
                  </List.Item>
                )}
              />
            </div>
          </Card>
        </Col>

        {/* 右侧边栏 */}
        <RightSide></RightSide>
      </Row>
    </Content>
  );
}
