import { Typography, Card, Col, Row, Button, Tag } from 'antd';
import '@/pages/post/styles/index.scss';
import { EyeOutlined } from '@ant-design/icons';
import { Space } from 'antd';
import RightSide from '@/layouts/frontLayout/RightSide';
import MiddleContent from '@/layouts/frontLayout/MiddleContent';
import UserCard from '@/components/UserCard';
import { EditorContent } from '@tiptap/react';
import '@/pages/post/styles/post_tiptap.scss';
import { createEditor } from '@/pages/post/config/editorConfig';
import React, { useEffect, useState } from 'react';
import { Toc } from '@/components/Toc';
// import editor from './config/editorConfig';
import { useMemo } from 'react';

import { Link, NavLink } from 'react-router-dom';
//  <MiddleContent menu={false}>
// </MiddleContent>
// <RightSide></RightSide>
// 创建响应式状态
// 创建自定义 Hook

const MemorizedToC = React.memo(Toc);
const { Title, Text } = Typography;
function PostDetail() {
  // 使用自定义 Hook
  // let editor = null;
  const [editor, setEditor] = useState(null);
  const [content, setContent] = useState([]);
  // 使用useEffct 创建editor  由于是立即执行,
  // const editor=''
  // useEffect(() => {
  //   console.log('effet');

  //   editor = createEditor(setContent); // 初始化编辑器
  // }, [editor]); // 依赖项是 editor 本身
  useEffect(() => {
    setEditor(createEditor(setContent));
  }, []);
  // editor = useMemo(() => createEditor(setContent), []);
  return (
    <>
      <MiddleContent menu={false}>
        <article className="postDetail">
          <Title level={1}>标题</Title>
          <div className="author-info">
            <Space size="middle">
              <Text className="text-[var(--text-secondary)]">姓名</Text>
              <Text type="secondary">2025-08-08</Text>
              <div
                className="views-count"
                style={{ color: 'var(--text-tertiary)' }}
              >
                <EyeOutlined
                  className="mr-3"
                  style={{ color: 'var(--text-tertiary)' }}
                />
                {3}
              </div>
            </Space>
            <></>
          </div>
          <div className="post-editor-container">
            <EditorContent editor={editor}></EditorContent>
          </div>
          <div className="post-foot">
            <div className="post-tag-text">标签:</div>
            <div className="post-tags">
              <Link to="/post/1" target="_blank" rel="noopener noreferrer">
                Link
              </Link>
              <Link to="/post/1" target="_blank" rel="noopener noreferrer">
                Link
              </Link>
              <Link to="/post/1" target="_blank" rel="noopener noreferrer">
                Link
              </Link>
            </div>
          </div>
        </article>
      </MiddleContent>
      <div className="post-rightSide">
        <RightSide>
          <Card style={{ padding: '20px', boxSizing: 'border-box' }}>
            <UserCard></UserCard>
            <Row style={{ marginTop: '16px' }} className="post-user-count">
              <Col span={8}>
                <Text strong style={{ fontSize: '16px' }}>
                  32
                </Text>
                <Text type="secondary" style={{ display: 'block' }}>
                  文章
                </Text>
              </Col>
              <Col span={8}>
                <Text strong style={{ fontSize: '16px' }}>
                  92k
                </Text>
                <Text type="secondary" style={{ display: 'block' }}>
                  阅读
                </Text>
              </Col>
              <Col span={8}>
                <Text strong style={{ fontSize: '16px' }}>
                  165
                </Text>
                <Text type="secondary" style={{ display: 'block' }}>
                  粉丝
                </Text>
              </Col>
            </Row>
            <Row gutter={24} style={{ marginTop: '16px' }}>
              <Col span={12}>
                <Button type="primary" block>
                  关注
                </Button>
              </Col>
              <Col span={12}>
                <Button type="default" block>
                  私信
                </Button>
              </Col>
            </Row>
          </Card>

          <Card className="post-toc-container">
            <h4 className="post-toc-title">文章目录</h4>
            <div className="post-toc">
              <MemorizedToC editor={editor} items={content}></MemorizedToC>
            </div>
          </Card>
        </RightSide>
      </div>
    </>
  );
}
export default PostDetail;
