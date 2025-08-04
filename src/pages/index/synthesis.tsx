import UserPopover from '@/components/UserPopover';
import { EyeOutlined, LikeOutlined } from '@ant-design/icons';
import { List, Row, Col, Space, Tag, Typography } from 'antd';
import '@/layouts/frontLayout/Content/index.scss';
const { Text, Title } = Typography;
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
export default function Test() {
  return (
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
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {article.views}
                    </Text>
                  </Space>
                  <Space size="small">
                    <LikeOutlined style={{ fontSize: '12px' }} />
                    <Text type="secondary" style={{ fontSize: '13px' }}>
                      {article.likes}
                    </Text>
                  </Space>
                </Space>
              </Col>
              <Col>
                <Space size="small">
                  {article.tags?.map((tag) => (
                    <Tag key={tag} color="blue" style={{ fontSize: '12px' }}>
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
  );
}
