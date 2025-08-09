import React from 'react';
import {
  Modal,
  Radio,
  Flex,
  Button,
  Space,
  Select,
  type SelectProps,
} from 'antd';
import { CloseCircleOutlined, LineChartOutlined } from '@ant-design/icons';
import type { CheckboxGroupProps } from 'antd/es/checkbox';

import './index.scss';
import TextArea from 'antd/es/input/TextArea';

interface ArticleReviewModalProps {
  visible: boolean;
  plate: string;
  onClose: () => void;
}

const trafficType: CheckboxGroupProps<string>['options'] = [
  { label: '1000', value: '1000' },
  { label: '2000', value: '2000' },
  { label: '5000', value: '5000' },
  { label: '10000', value: '10000' },
  { label: '50000', value: '50000' },
];

const options: SelectProps['options'] = [
  { label: '政治敏感', value: '政治敏感' },
  { label: '色情', value: '色情' },
  { label: '辱骂', value: '辱骂' },
  { label: '暴恐', value: '暴恐' },
  { label: '虚假活动', value: '虚假活动' },
  { label: '不良信息', value: '不良信息' },
  { label: '不良行为', value: '不良行为' },
  { label: '诱导未成年人消费', value: '诱导未成年人消费' },
  { label: '其他', value: '其他' },
];

const handleChange = (value: string[]) => {
  console.log(`selected ${value}`);
};

const LivingPopup: React.FC<ArticleReviewModalProps> = ({
  visible,
  plate,
  onClose,
}) => {
  const [reviewReason, setReviewReason] = React.useState('');
  if (plate == 'flow') {
    return (
      <Modal
        title={
          <div className="flex items-center gap-3">
            <LineChartOutlined className="text-blue-500" />
            <span>推送流量</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        width={700}
        footer={null}
        className="article-review-modal"
      >
        <div className="max-h-[80vh] overflow-y-auto">
          <p className="text-lg font-bold">请选择推流力度：</p>
          <Flex vertical gap="middle" className="my-10">
            <Radio.Group
              block
              options={trafficType}
              defaultValue="Pear"
              optionType="button"
            />
          </Flex>
        </div>
        <div className="flex justify-end">
          <Space>
            <Button
              type="primary"
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => {
                console.log('提交审核');
              }}
            >
              确定
            </Button>
            <Button
              onClick={() => {
                onClose();
              }}
            >
              取消
            </Button>
          </Space>
        </div>
      </Modal>
    );
  } else if (plate == 'ban') {
    return (
      <Modal
        title={
          <div className="flex items-center gap-3">
            <CloseCircleOutlined className="text-red-500" />
            <span>封禁主播</span>
          </div>
        }
        open={visible}
        onCancel={onClose}
        width={700}
        footer={null}
        className="article-review-modal"
      >
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">封禁类型</label>
          <Space style={{ width: '100%' }} direction="vertical">
            <Select
              mode="multiple"
              allowClear
              style={{ width: '100%' }}
              placeholder="请选择封禁类型..."
              onChange={handleChange}
              options={options}
            />
          </Space>
        </div>
        <div className="mb-30">
          <label className="block text-sm font-medium mb-2">封禁原因</label>
          <TextArea
            rows={4}
            placeholder="请详细说明审核封禁理由..."
            maxLength={500}
            showCount
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
          />
        </div>
        <div className="flex justify-end">
          <Space>
            <Button
              type="primary"
              className="bg-blue-500 hover:bg-blue-600"
              onClick={() => {
                console.log('提交审核');
              }}
            >
              确定
            </Button>
            <Button
              onClick={() => {
                onClose();
              }}
            >
              取消
            </Button>
          </Space>
        </div>
      </Modal>
    );
  }
};

export default LivingPopup;
