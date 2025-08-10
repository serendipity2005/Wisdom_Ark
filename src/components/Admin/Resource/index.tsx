import type React from 'react';
import {
  FolderOutlined,
  FileOutlined,
  FileZipOutlined,
  FileImageOutlined,
  FileTextOutlined,
  MoreOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import {
  Layout,
  Input,
  Progress,
  Button,
  Table,
  Dropdown,
  Typography,
  Card,
} from 'antd';
import Storage from './Storage';

const { Content } = Layout;
const { Title } = Typography;

interface FileItem {
  key: string;
  name: string;
  type: 'file' | 'folder';
  fileType?: 'html' | 'zip' | 'image' | 'text' | 'video' | 'audio' | 'document';
  modifiedDate: string;
  size: string;
}

const FileManager: React.FC = () => {
  const fileData: FileItem[] = [
    {
      key: '1',
      name: 'index.html',
      type: 'file',
      fileType: 'html',
      modifiedDate: '12-10-2020, 09:45',
      size: '09 KB',
    },
    {
      key: '2',
      name: 'Project-A.zip',
      type: 'file',
      fileType: 'zip',
      modifiedDate: '11-10-2020, 17:05',
      size: '115 KB',
    },
    {
      key: '3',
      name: 'Img-1.jpeg',
      type: 'file',
      fileType: 'image',
      modifiedDate: '11-10-2020, 13:26',
      size: '86 KB',
    },
    {
      key: '4',
      name: '更新list.txt',
      type: 'file',
      fileType: 'text',
      modifiedDate: '10-10-2020, 11:32',
      size: '08 KB',
    },
    {
      key: '5',
      name: '项目B',
      type: 'folder',
      modifiedDate: '10-10-2020, 10:51',
      size: '72 KB',
    },
    {
      key: '6',
      name: '更改list.txt',
      type: 'file',
      fileType: 'text',
      modifiedDate: '09-10-2020, 17:05',
      size: '07 KB',
    },
    {
      key: '7',
      name: 'Img-2.png',
      type: 'file',
      fileType: 'image',
      modifiedDate: '09-10-2020, 15:12',
      size: '31 KB',
    },
    {
      key: '8',
      name: '项目 C',
      type: 'folder',
      modifiedDate: '09-10-2020, 10:11',
      size: '20 KB',
    },
    {
      key: '9',
      name: 'starter-page.html',
      type: 'file',
      fileType: 'html',
      modifiedDate: '08-10-2020, 03:22',
      size: '11 KB',
    },
  ];

  const getFileIcon = (item: FileItem) => {
    if (item.type === 'folder') {
      return <FolderOutlined className="text-orange-400" />;
    }

    switch (item.fileType) {
      case 'html':
        return <FileOutlined className="text-blue-500" />;
      case 'zip':
        return <FileZipOutlined className="text-orange-500" />;
      case 'image':
        return <FileImageOutlined className="text-green-500" />;
      case 'text':
        return <FileTextOutlined className="text-gray-500" />;
      default:
        return <FileOutlined className="text-gray-400" />;
    }
  };

  const dropdownMenu = {
    items: [
      { key: 'open', label: '打开' },
      { key: 'rename', label: '重命名' },
      { key: 'delete', label: '删除' },
      { key: 'share', label: '分享' },
    ],
  };

  const columns = [
    {
      title: '名字',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: FileItem) => (
        <div className="flex items-center gap-3">
          {getFileIcon(record)}
          <span>{text}</span>
        </div>
      ),
    },
    {
      title: '修改日期',
      dataIndex: 'modifiedDate',
      key: 'modifiedDate',
      className: 'text-gray-500',
    },
    {
      title: '大小',
      dataIndex: 'size',
      key: 'size',
      className: 'text-gray-500',
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: () => (
        <Dropdown menu={dropdownMenu} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Card>
      <div className="content-header">
        <Title className="content-title" level={4}>
          直播管理
        </Title>
      </div>
      {/* 数据表格 */}
      <Layout>
        <Content>
          <div className="grid grid-cols-4 gap-6">
            <Storage />

            <div className="col-span-3 bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <Title level={4}>最近的文件</Title>
                <div className="flex items-center gap-4">
                  <Input
                    placeholder="搜索..."
                    prefix={<SearchOutlined />}
                    className="w-200"
                  />
                  <Button type="text" icon={<MoreOutlined />} />
                  {/* <Button type="link" className="text-blue-500">
                    查看全部
                  </Button> */}
                </div>
              </div>

              <Table
                columns={columns}
                dataSource={fileData}
                pagination={false}
                className="file-table"
                showHeader={true}
              />
              <p className="text-center mt-4">
                <span className="center cursor-pointer text-blue-500 hover:text-blue">
                  查看更多
                </span>
              </p>
            </div>
          </div>
        </Content>
      </Layout>
    </Card>
  );
};

export default FileManager;
