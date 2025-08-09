import type React from 'react';
import { Modal, Button, Space, DatePicker, type DatePickerProps } from 'antd';
import { EditOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import './index.scss';
import type { RangePickerProps } from 'antd/es/date-picker';

interface ArticleReviewModalProps {
  visible: boolean;
  onClose: () => void;
}

dayjs.extend(customParseFormat);

const onOk = (value: DatePickerProps['value'] | RangePickerProps['value']) => {
  console.log('onOk: ', value);
};

const LivingPopup: React.FC<ArticleReviewModalProps> = ({
  visible,
  onClose,
}) => {
  // 禁用今天之前的日期
  const disabledDate = (current: Dayjs) => {
    // 今天之前的日期全部禁用
    return current && current < dayjs().startOf('day');
  };

  // 禁用今天已过去的时间（仅在选中今天时生效）
  const disabledTime = (current: Dayjs | null) => {
    if (!current || !current.isSame(dayjs(), 'day')) {
      return {};
    }

    // 当前时间的小时、分钟、秒
    const now = dayjs();
    return {
      disabledHours: () => range(0, now.hour()),
      disabledMinutes: (selectedHour: number) => {
        if (selectedHour === now.hour()) {
          return range(0, now.minute());
        }
        return [];
      },
      disabledSeconds: (selectedHour: number, selectedMinute: number) => {
        if (selectedHour === now.hour() && selectedMinute === now.minute()) {
          return range(0, now.second());
        }
        return [];
      },
    };
  };

  // 生成范围数组的辅助函数
  const range = (start: number, end: number) => {
    const result = [];
    for (let i = start; i < end; i++) {
      result.push(i);
    }
    return result;
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-3">
          <EditOutlined className="text-blue-500" />
          <span>修改解封时间</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={500}
      footer={null}
      className="article-review-modal"
    >
      <div className="max-h-[80vh] overflow-y-auto">
        <p className="text-lg font-bold">请选择解除封禁时间：</p>
        <div className="mt-10">
          <DatePicker
            showTime
            disabledDate={disabledDate}
            disabledTime={disabledTime}
            onChange={(value, dateString) => {
              console.log('Selected Time: ', value);
              console.log('Formatted Selected Time: ', dateString);
            }}
            onOk={onOk}
          />
        </div>
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
};

export default LivingPopup;
