// 表格上方导航

import { Button, Input, Select, Dropdown, Row, Col } from 'antd';
import { SearchOutlined, MoreOutlined } from '@ant-design/icons';
import { useState } from 'react';
const { Option } = Select; // 解构出 Option 组件
function Filter() {
  const [searchText, setSearchText] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [timeFilter, setTimeFilter] = useState('');
  const [pageSize, setPageSize] = useState(10);

  // 更多操作菜单 - 使用新的 menu 配置格式
  const moreMenu = {
    items: [
      { key: 'export', label: '导出数据' },
      { key: 'import', label: '导入数据' },
      { key: 'settings', label: '列设置' },
    ],
  };

  return (
    <Row className="content-filter mb-16" gutter={16}>
      <Col span={4}>
        <Select
          className="content-select w-full"
          placeholder="page 10"
          value={pageSize}
          onChange={setPageSize}
        >
          <Option value={10}>page 10</Option>
          <Option value={25}>page 25</Option>
          <Option value={50}>page 50</Option>
        </Select>
      </Col>
      <Col span={5}>
        <Input
          placeholder="寻找..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </Col>
      <Col span={4}>
        <Select
          placeholder="地点"
          className="content-select w-full"
          onChange={setLocationFilter}
        >
          <Option value="">全部地点</Option>
          <Option value="加州">加州</Option>
          <Option value="凤凰">凤凰</Option>
          <Option value="跨境部定期州">跨境部定期州</Option>
        </Select>
      </Col>
      <Col span={4}>
        <Select
          placeholder="选择类型"
          className="content-select  w-full"
          onChange={setStatusFilter}
        >
          <Option value="">全部类型</Option>
          <Option value="active">全职</Option>
          <Option value="inactive">兼职</Option>
          <Option value="pending">待定</Option>
        </Select>
      </Col>
      <Col span={4}>
        <Select
          placeholder="选择时间"
          className="content-select w-full"
          onChange={setTimeFilter}
        >
          <Option value="">全部时间</Option>
          <Option value="today">今天</Option>
          <Option value="week">本周</Option>
          <Option value="month">本月</Option>
        </Select>
      </Col>
      <Col span={3}>
        <Dropdown menu={moreMenu} placement="bottomRight">
          <Button icon={<MoreOutlined />}>更多</Button>
        </Dropdown>
      </Col>
    </Row>
  );
}

export default Filter;
