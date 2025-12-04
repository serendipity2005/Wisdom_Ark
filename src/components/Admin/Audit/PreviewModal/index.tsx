import type React from 'react';
import { useState } from 'react';
import {
  Modal,
  Button,
  Tabs,
  Input,
  Radio,
  message,
  Card,
  Tag,
  Divider,
  Space,
  Typography,
  Image,
} from 'antd';
import {
  EyeOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import ReactMarkdown from 'react-markdown';

const { TextArea } = Input;
const { Title, Paragraph, Text } = Typography;
import './index.scss';

interface Article {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  tags: string[];
  publishTime: string;
  status: 'pending' | 'approved' | 'rejected';
  coverImage?: string;
  summary: string;
  readCount: number;
}

interface ArticleReviewModalProps {
  visible: boolean;
  article: Article | null;
  plate: string;
  onClose: () => void;
  onReview: (
    articleId: string,
    status: 'approved' | 'rejected',
    reason: string,
  ) => void;
}

const previewTypeItems = [
  '暴力',
  '危害公共治安',
  '政治敏感',
  '色情',
  '辱骂',
  '广告',
  '其他',
];

const PreviewModal: React.FC<ArticleReviewModalProps> = ({
  visible,
  article,
  plate,
  onClose,
  onReview,
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [reviewStatus, setReviewStatus] = useState<
    'approved' | 'rejected' | undefined
  >(undefined);
  const [reviewReason, setReviewReason] = useState('');

  const handleReview = async (values: {
    status: 'approved' | 'rejected';
    reason: string;
  }) => {
    if (!article) return;

    setLoading(true);
    try {
      await onReview(article.id, values.status, values.reason);
      message.success(
        `文章已${values.status === 'approved' ? '通过' : '拒绝'}审核`,
      );
      setReviewStatus(undefined);
      setReviewReason('');
      onClose();
    } catch (error) {
      message.error('审核操作失败');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return '已通过';
      case 'rejected':
        return '已拒绝';
      case 'pending':
        return '待审核';
      default:
        return '未知';
    }
  };

  if (!article) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <FileTextOutlined className="text-blue-500" />
          {plate == 'article' && <span>文章审核</span>}
          {plate == 'report' && <span>举报处理</span>}
          <Tag color={getStatusColor(article.status)}>
            {getStatusText(article.status)}
          </Tag>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={1200}
      footer={null}
      className="article-review-modal"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          className="mb-4"
          items={[
            {
              key: 'preview',
              label: (
                <span className="flex items-center gap-2">
                  <EyeOutlined />
                  文章预览
                </span>
              ),
              children: (
                <div className="space-y-6">
                  {/* 文章基本信息 */}
                  <Card className="border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <Title level={3} className="mb-2 text-gray-800">
                          {article.title}
                        </Title>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                          <span className="flex items-center gap-1">
                            <UserOutlined />
                            作者：{article.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <CalendarOutlined />
                            发布时间：{article.publishTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <TagOutlined />
                            分类：{article.category}
                          </span>
                          <span>阅读量：{article.readCount}</span>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          {article.tags.map((tag) => (
                            <Tag key={tag} color="blue">
                              {tag}
                            </Tag>
                          ))}
                        </div>
                      </div>
                      {article.coverImage && (
                        <div className="ml-6">
                          <Image
                            src={article.coverImage}
                            alt="封面图"
                            width={120}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        </div>
                      )}
                    </div>

                    {/* 文章摘要 */}
                    <div className="bg-gray-50 p-4 rounded-lg mb-4">
                      <Text strong>文章摘要：</Text>
                      <Paragraph className="mt-2 mb-0 text-gray-600">
                        {article.summary}
                      </Paragraph>
                    </div>
                  </Card>

                  {/* 文章内容 */}
                  <Card title="文章内容" className="min-h-[400px]">
                    <div className="prose max-w-none">
                      <ReactMarkdown>
                        {/* <div
                          className="text-gray-700 leading-7"
                          dangerouslySetInnerHTML={{ __html: article.content }}
                        /> */}
                        {article.content}
                      </ReactMarkdown>
                    </div>
                  </Card>
                </div>
              ),
            },
            {
              key: 'review',
              label: (
                <span className="flex items-center gap-2">
                  <EditOutlined />
                  审核操作
                </span>
              ),
              children: (
                <>
                  {plate == 'report' && (
                    <div className="m-6 ">
                      <div className="my-10 mx-18 flex flex-col">
                        <Text className="text-16 fw-600">举报原因</Text>
                        <Text className="my-10 text-indent-2em">
                          举报原因是什么呢，还要从这个举报类型说起，
                          举报类型是什么呢，要根据举报原因分析，
                          所以说这个举报原因啊，原因就是这么个原因，
                          理由也是这么个理由，至于为什么举报也是因为这个举报原因
                        </Text>
                      </div>
                      <div className="my-10 mx-18 flex flex-col">
                        <Text className="text-16 fw-600">举报类型</Text>
                        <div className="flex">
                          {previewTypeItems.map((item, index) => {
                            return (
                              <Tag
                                key={index}
                                color="red"
                                className="mt-10 text-13"
                              >
                                {item}
                              </Tag>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                  <Card title="审核决定" className="mb-6 mt-0">
                    <div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                          审核结果
                        </label>
                        {plate == 'article' && (
                          <Radio.Group
                            onChange={(e) => setReviewStatus(e.target.value)}
                            value={reviewStatus}
                            className="flex my-10"
                          >
                            <Radio.Button
                              value="approved"
                              className="text-green-600 w-150 text-center"
                            >
                              <CheckCircleOutlined className="mr-1" />
                              通过审核
                            </Radio.Button>
                            <Radio.Button
                              value="rejected"
                              className="text-red-600 w-200 text-center"
                            >
                              <CloseCircleOutlined className="mr-1" />
                              拒绝审核
                            </Radio.Button>
                          </Radio.Group>
                        )}
                        {plate == 'report' && (
                          <Radio.Group
                            onChange={(e) => setReviewStatus(e.target.value)}
                            value={reviewStatus}
                            className="flex my-10"
                          >
                            <Radio.Button
                              value="approved"
                              className="text-green-600 w-150 text-center"
                            >
                              <CheckCircleOutlined className="mr-1" />
                              受理并撤销文章
                            </Radio.Button>
                            <Radio.Button
                              value="rejected"
                              className="text-red-600 w-200 text-center"
                            >
                              <CloseCircleOutlined className="mr-1" />
                              驳回举报
                            </Radio.Button>
                          </Radio.Group>
                        )}
                      </div>

                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-2">
                          审核意见
                        </label>
                        <TextArea
                          rows={4}
                          placeholder="请详细说明审核理由..."
                          maxLength={500}
                          showCount
                          value={reviewReason}
                          onChange={(e) => setReviewReason(e.target.value)}
                        />
                      </div>

                      <div>
                        <Space>
                          <Button
                            type="primary"
                            loading={loading}
                            className="bg-blue-500 hover:bg-blue-600"
                            onClick={() => {
                              if (!reviewStatus || !reviewReason) {
                                message.warning('请填写完整的审核信息');
                                return;
                              }
                              handleReview({
                                status: reviewStatus,
                                reason: reviewReason,
                              });
                            }}
                          >
                            提交审核
                          </Button>
                          <Button
                            onClick={() => {
                              setReviewStatus(undefined);
                              setReviewReason('');
                            }}
                          >
                            重置
                          </Button>
                        </Space>
                      </div>
                    </div>
                  </Card>

                  {/* 审核指南 */}
                  {plate == 'article' && (
                    <Card
                      title="审核指南"
                      className="bg-blue-50 border-blue-200 my-10 mx-25"
                    >
                      <div className="space-y-3 text-sm">
                        <div>
                          <Text strong className="text-green-600">
                            ✓ 通过标准：
                          </Text>
                          <ul className="mt-1 ml-4 space-y-1 text-gray-600 list-none">
                            <li>• 内容健康，符合平台规范</li>
                            <li>• 标题与内容匹配，无标题党</li>
                            <li>• 原创内容或已获得转载授权</li>
                            <li>• 格式规范，配图合适</li>
                          </ul>
                        </div>
                        <Divider className="my-4" />
                        <div>
                          <Text strong className="text-red-600">
                            ✗ 拒绝标准：
                          </Text>
                          <ul className="mt-1 ml-4 space-y-1 text-gray-600 list-none">
                            <li>• 内容涉及违法违规信息</li>
                            <li>• 恶意营销或过度广告</li>
                            <li>• 抄袭或侵犯他人版权</li>
                            <li>• 内容质量低，严重错误</li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                  )}
                  {plate == 'report' && (
                    <Card
                      title="举报处理指南"
                      className="bg-blue-50 border-blue-200 my-10 mx-25"
                    >
                      <div className="space-y-3 text-sm">
                        <div>
                          <Text strong className="text-green-600">
                            ✓ 受理标准：
                          </Text>
                          <ul className="mt-1 ml-4 space-y-1 text-gray-600 list-none">
                            <li>• 举报内容明确具体，提供有效证据</li>
                            <li>• 举报对象确实存在违规行为</li>
                            <li>• 举报类型属于平台处理范围</li>
                            <li>• 举报信息真实有效，无恶意举报嫌疑</li>
                          </ul>
                        </div>
                        <Divider className="my-4" />
                        <div>
                          <Text strong className="text-red-600">
                            ✗ 驳回标准：
                          </Text>
                          <ul className="mt-1 ml-4 space-y-1 text-gray-600 list-none">
                            <li>• 匿名举报且无法核实真实性</li>
                            <li>• 重复举报已处理过的相同内容</li>
                            <li>• 举报内容与事实明显不符</li>
                            <li>• 举报理由不属于平台管理范畴</li>
                          </ul>
                        </div>
                      </div>
                    </Card>
                  )}
                </>
              ),
            },
          ]}
        />
      </div>
    </Modal>
  );
};

export default PreviewModal;
