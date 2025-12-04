// 表格上方导航

import { Button, Input, Select, Dropdown, Row, Col } from 'antd';
import { SearchOutlined, MoreOutlined } from '@ant-design/icons';
const { Option } = Select; // 解构出 Option 组件

interface NumItem {
  key: number;
  label: string;
}

interface StringItem {
  key: string;
  label: string;
}

interface MenuItem {
  label: string;
  items: StringItem[];
  onChange: (value: string) => void;
}

const OriginalPage = [
  { key: 10, label: 'page 10' },
  { key: 25, label: 'page 25' },
  { key: 50, label: 'page 50' },
];

interface FilterProps {
  pageMenu?: NumItem[];
  menuItems: MenuItem[];
  pageSize: number;
  setPageSize: (size: number) => void;
  setSearchText: (text: string) => void;
}
const Filter: React.FC<FilterProps> = ({
  pageMenu = OriginalPage,
  menuItems,
  pageSize,
  setPageSize,
  setSearchText,
}) => {
  // 更多操作菜单 - 使用新的 menu 配置格式
  const moreMenu = {
    items: [
      { key: 'export', label: '导出数据' },
      { key: 'import', label: '导入数据' },
    ],
  };

  return (
    <Row className="content-filter mb-0 flex justify-between" gutter={16}>
      <Col span={4}>
        <Select
          className="content-select w-full"
          placeholder={pageMenu[0].label}
          value={pageSize}
          onChange={setPageSize}
        >
          {pageMenu.map((item) => {
            return (
              <Option key={item.key} value={item.key}>
                {item.label}
              </Option>
            );
          })}
        </Select>
      </Col>
      <Col span={5}>
        <Input
          placeholder="寻找..."
          prefix={<SearchOutlined />}
          //   value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
      </Col>
      {menuItems.map((item, index) => {
        return (
          <Col span={4} key={index}>
            <Select
              placeholder={item.label}
              className="content-select w-full"
              onChange={item.onChange}
            >
              {item.items.map((item) => {
                return (
                  <Option key={item.key} value={item.label}>
                    {item.label}
                  </Option>
                );
              })}
            </Select>
          </Col>
        );
      })}
      {/* <Col span={4}>
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
      </Col> */}
      <Col span={3}>
        <Dropdown menu={moreMenu} placement="bottomRight">
          <Button icon={<MoreOutlined />}>更多</Button>
        </Dropdown>
      </Col>
    </Row>
  );
};

export default Filter;
