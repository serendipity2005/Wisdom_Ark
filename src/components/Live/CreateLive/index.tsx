import './index.scss';
import { Button, Modal, DatePicker, Form, Input, Select, Upload } from 'antd';
import type { GetProp, UploadFile, UploadProps } from 'antd';
import ImgCrop from 'antd-img-crop';
import { Plus } from 'lucide-react';
import giftUrl from '@/assets/img/Social.gif';
import { useState } from 'react';

type FileType = Parameters<GetProp<UploadProps, 'beforeUpload'>>[0];
const { RangePicker } = DatePicker;

const formItemLayout = {
  labelCol: {
    xs: { span: 24 },
    sm: { span: 6 },
  },
  wrapperCol: {
    xs: { span: 24 },
    sm: { span: 14 },
  },
};

export default function CreateLive() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  const showModal = () => {
    setIsModalOpen(true);
  };

  const handleOk = () => {
    setIsModalOpen(false);
  };

  const handleCancel = () => {
    setIsModalOpen(false);
  };
  //上传组件逻辑
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const onChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  const onPreview = async (file: UploadFile) => {
    let src = file.url as string;
    if (!src) {
      src = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file.originFileObj as FileType);
        reader.onload = () => resolve(reader.result as string);
      });
    }
    const image = new Image();
    image.src = src;
    const imgWindow = window.open(src);
    imgWindow?.document.write(image.outerHTML);
  };
  return (
    <>
      <div className="createCon w-300 h-100 bg-white mt-15 flex justify-center items-center">
        <div className="giftCon w-50% h-100%">
          <img src={giftUrl} className="w-full h-160% " />
        </div>
        <Button
          color="primary"
          variant="dashed"
          className="w-50% ml-auto mr-10"
          onClick={showModal}
        >
          <Plus className="w-20 h-20" />
          开启直播之旅
        </Button>
      </div>
      <Modal
        title="创建直播"
        closable={{ 'aria-label': 'Custom Close Button' }}
        open={isModalOpen}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Form
          {...formItemLayout}
          form={form}
          style={{ maxWidth: 600 }}
          initialValues={{ variant: 'outlined' }}
        >
          <Form.Item
            label="直播标题"
            name="Input"
            rules={[{ required: true, message: '请输入直播标题!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="直播介绍"
            name="TextArea"
            rules={[{ required: true, message: '请输入!' }]}
          >
            <Input.TextArea />
          </Form.Item>

          <Form.Item
            label="主持人姓名"
            name="name"
            rules={[{ required: true, message: '请输入主持人姓名!' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="直播类型"
            name="Select"
            rules={[{ required: true, message: '请输入直播类型!' }]}
          >
            <Select />
          </Form.Item>
          <Form.Item
            label="直播封面"
            name="Upload"
            rules={[{ required: true, message: '请上传直播封面!' }]}
          >
            <ImgCrop rotationSlider>
              <Upload
                action="https://660d2bd96ddfa2943b33731c.mockapi.io/api/upload"
                listType="picture-card"
                fileList={fileList}
                onChange={onChange}
                onPreview={onPreview}
              >
                {fileList.length < 5 && '+ Upload'}
              </Upload>
            </ImgCrop>
          </Form.Item>

          <Form.Item
            label="直播时间"
            name="RangePicker"
            rules={[{ required: true, message: '请输入直播时间!' }]}
          >
            <RangePicker />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
