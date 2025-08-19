import type React from 'react';
import { useEffect, useRef } from 'react';
import {
  Card,
  Row,
  Col,
  Avatar,
  Button,
  Progress,
  Tabs,
  Typography,
  Divider,
} from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  TagOutlined,
  FacebookOutlined,
  TwitterOutlined,
  InstagramOutlined,
  LockOutlined,
  RightOutlined,
} from '@ant-design/icons';
import * as echarts from 'echarts';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

type DashboardProps = object;

const Dashboard: React.FC<DashboardProps> = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chartRef.current) {
      const chart = echarts.init(chartRef.current);

      const option = {
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['Video Ads', 'Direct', 'Search Engine'],
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '20%',
          top: '3%',
          containLabel: true,
        },
        // toolbox: {
        //   feature: {
        //     saveAsImage: {},
        //   },
        // },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: 'Video Ads',
            type: 'line',
            stack: 'Total',
            data: [150, 232, 201, 154, 190, 330, 410],
          },
          {
            name: 'Direct',
            type: 'line',
            stack: 'Total',
            data: [320, 332, 301, 334, 390, 330, 320],
          },
          {
            name: 'Search Engine',
            type: 'line',
            stack: 'Total',
            data: [820, 932, 901, 934, 1290, 1330, 1320],
          },
        ],
      };

      chart.setOption(option);

      const handleResize = () => {
        chart.resize();
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        chart.dispose();
      };
    }
  }, []);

  const statsData = [
    {
      title: '订单',
      value: '1,235',
      icon: <ShoppingCartOutlined style={{ fontSize: 24, color: '#fff' }} />,
      bgColor: '#4F7CFF',
    },
    {
      title: '收入',
      value: '35,723 美元',
      icon: <DollarOutlined style={{ fontSize: 24, color: '#fff' }} />,
      bgColor: '#4F7CFF',
    },
    {
      title: '平均价格',
      value: '16.2 美元',
      icon: <TagOutlined style={{ fontSize: 24, color: '#fff' }} />,
      bgColor: '#4F7CFF',
    },
  ];

  const socialData = [
    {
      platform: 'Facebook',
      sales: '125 销售',
      icon: <FacebookOutlined style={{ fontSize: 32, color: '#1877f2' }} />,
      description:
        'Maecenas nec odio et ante tincidunt tempus.Donec vitae sapien ut libero venenatis faucibus tincidunt.',
    },
    {
      platform: '脸书',
      sales: '125 销售',
      icon: <FacebookOutlined style={{ fontSize: 24, color: '#1877f2' }} />,
    },
    {
      platform: '哈',
      sales: '112 销售',
      icon: <TwitterOutlined style={{ fontSize: 24, color: '#1da1f2' }} />,
    },
    {
      platform: 'Instagram',
      sales: '104 销售',
      icon: <InstagramOutlined style={{ fontSize: 24, color: '#e4405f' }} />,
    },
  ];

  const activityData = [
    {
      time: '22 十一月',
      content: '哈应黑求"击倪者活动"',
    },
    {
      time: '17 十一月',
      content: '每个人都意识到为什么一种新的通用语言是可取的...阅读更多',
    },
    {
      time: '15 十一月',
      content: '加入"营销会技术论坛"小组',
    },
    {
      time: '22 十一月',
      content: '回应黑求"实物机会"',
    },
  ];

  const cityData = [
    { city: '旧金山', value: 1456, color: '#4F7CFF' },
    { city: '洛杉矶', value: 1123, color: '#4FFFB8' },
    { city: '圣地亚哥', value: 1026, color: '#FFB84F' },
  ];

  return (
    <div className="bg-[#f5f5f5] min-h-100vh">
      {/* Header */}
      {/* <div
        style={{
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Title level={3} style={{ margin: 0, color: '#666' }}>
          档泥板
        </Title>
      </div> */}

      {/* Welcome Card */}
      <Card
        style={{
          marginBottom: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <Row align="middle">
          <Col span={12}>
            <div style={{ color: 'white' }}>
              <Title level={4} style={{ color: 'white', marginBottom: '8px' }}>
                欢迎回来！
              </Title>
              <Text style={{ color: 'rgba(255,255,255,0.8)' }}>
                Skote 仪表板
              </Text>
            </div>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <div style={{ position: 'relative', height: '80px' }}>
              <div
                style={{ position: 'absolute', right: 0, top: 0, opacity: 0.3 }}
              >
                <div
                  style={{
                    width: '60px',
                    height: '60px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                  }}
                ></div>
              </div>
            </div>
          </Col>
        </Row>
      </Card>

      <Row gutter={24}>
        <Col
          span={24}
          className="grid"
          style={{ gridTemplateColumns: '1fr 2fr' }}
        >
          <div className="mr-10">
            {/* User Info Card */}
            <Card className="mb-24 mr-10">
              <Row align="middle">
                <Col span={4}>
                  <Avatar
                    size={48}
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=felix"
                  />
                </Col>
                <Col span={8}>
                  <div>
                    <Title level={5} className="m-0">
                      亨利·普菜斯
                    </Title>
                    <Text type="secondary">UI/UX 设计师</Text>
                  </div>
                </Col>
                <Col span={6} className="text-center">
                  <div>
                    <Title level={5} className="m-0">
                      125
                    </Title>
                    <Text type="secondary">项目</Text>
                  </div>
                </Col>
                <Col span={6} className="text-center">
                  <div>
                    <Title level={5} className="m-0">
                      1245 美元
                    </Title>
                    <Text type="secondary">收入</Text>
                  </div>
                </Col>
              </Row>
              <div className="mt-16px">
                <Button type="primary">查看个人资料</Button>
              </div>
            </Card>

            {/* Monthly Income Card */}
            <Card className="mb-24">
              <Row>
                <Col span={12}>
                  <Title level={5}>每月收入</Title>
                  <Text type="secondary">这个月</Text>
                  <div style={{ marginTop: '16px' }}>
                    <Title level={3} style={{ margin: 0, color: '#52c41a' }}>
                      34,252 美元
                    </Title>
                    <Text style={{ color: '#52c41a' }}>12% ↑ 从上个期开始</Text>
                  </div>
                  <div style={{ marginTop: '16px' }}>
                    <Button type="primary">查看更多</Button>
                  </div>
                </Col>
                <Col span={12}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      height: '200px',
                    }}
                  >
                    <Progress
                      type="circle"
                      percent={67}
                      size={120}
                      strokeColor="#4F7CFF"
                      format={() => (
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                            67%
                          </div>
                          <div style={{ fontSize: '12px', color: '#999' }}>
                            A系列
                          </div>
                        </div>
                      )}
                    />
                  </div>
                </Col>
                <Text type="secondary" className="mt-0 block">
                  我们好选数字、图形和哲理思维。
                </Text>
              </Row>
            </Card>
          </div>

          <div className="">
            {/* Stats Cards */}
            <Row gutter={16} className="mb-24">
              {statsData.map((stat, index) => (
                <Col span={8} key={index}>
                  <Card>
                    <Row align="middle">
                      <Col span={8}>
                        <div
                          className="w-48 h-48 rounded-8 flex-center justify-center"
                          style={{ backgroundColor: stat.bgColor }}
                        >
                          {stat.icon}
                        </div>
                      </Col>
                      <Col span={16}>
                        <div className="text-right">
                          <Text type="secondary">{stat.title}</Text>
                          <div>
                            <Title level={4} className="m-0">
                              {stat.value}
                            </Title>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Chart Card */}
            <Card>
              <div className="flex items-center justify-between mb-16">
                <Title level={5}>电子邮件发送</Title>
                <Tabs defaultActiveKey="年" size="small">
                  <TabPane tab="周" key="周" />
                  <TabPane tab="月" key="月" />
                  <TabPane tab="年" key="年" />
                </Tabs>
              </div>
              <div ref={chartRef} className="h-195"></div>
            </Card>
          </div>
        </Col>

        <Col className="grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
          {/* Social Sources */}
          <Card className="mr-10">
            <Title level={5}>社交来源</Title>
            <div style={{ marginBottom: '16px' }}>
              <Row align="middle" style={{ marginBottom: '12px' }}>
                <Col span={6}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#f0f2ff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <FacebookOutlined
                      style={{ fontSize: 24, color: '#1877f2' }}
                    />
                  </div>
                </Col>
                <Col span={18}>
                  <div>
                    <Text strong>Facebook - 125 销售</Text>
                    <div style={{ marginTop: '4px' }}>
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        Maecenas nec odio et ante tincidunt tempus.Donec vitae
                        sapien ut libero venenatis faucibus tincidunt.
                      </Text>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>

            <Button type="link" style={{ padding: 0, color: '#4F7CFF' }}>
              了解更多信息 <RightOutlined />
            </Button>

            <Divider />

            <Row gutter={[16, 16]}>
              {socialData.slice(1).map((item, index) => (
                <Col span={8} key={index} style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#f0f2ff',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 8px',
                    }}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <Text strong style={{ fontSize: '12px' }}>
                      {item.platform}
                    </Text>
                    <div>
                      <Text type="secondary" style={{ fontSize: '11px' }}>
                        {item.sales}
                      </Text>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>

          {/* Activity */}
          <Card className="mr-10">
            <Title level={5}>活动</Title>
            <div>
              {activityData.map((activity, index) => (
                <Row key={index} style={{ marginBottom: '16px' }} align="top">
                  <Col span={2}>
                    <LockOutlined style={{ color: '#999', marginTop: '2px' }} />
                  </Col>
                  <Col span={6}>
                    <Text type="secondary" style={{ fontSize: '12px' }}>
                      {activity.time}
                    </Text>
                  </Col>
                  <Col span={2}>
                    <RightOutlined
                      style={{
                        color: '#999',
                        fontSize: '12px',
                        marginTop: '2px',
                      }}
                    />
                  </Col>
                  <Col span={14}>
                    <Text style={{ fontSize: '13px' }}>{activity.content}</Text>
                  </Col>
                </Row>
              ))}
            </div>
            <Button
              type="link"
              style={{ padding: 0, color: '#4F7CFF', marginTop: '8px' }}
            >
              查看更多 <RightOutlined />
            </Button>
          </Card>

          {/* Top Cities */}
          <Card>
            <Title level={5}>畅销城市产品</Title>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: '#f0f2ff',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 12px',
                }}
              >
                <div style={{ fontSize: '24px' }}>📍</div>
              </div>
              <Title level={3} style={{ margin: 0 }}>
                1,456
              </Title>
              <Text type="secondary">旧金山</Text>
            </div>

            <div>
              {cityData.map((city, index) => (
                <Row
                  key={index}
                  align="middle"
                  style={{ marginBottom: '12px' }}
                >
                  <Col span={8}>
                    <Text>{city.city}</Text>
                  </Col>
                  <Col span={6}>
                    <Text>{city.value.toLocaleString()}</Text>
                  </Col>
                  <Col span={10}>
                    <div
                      style={{
                        height: '4px',
                        backgroundColor: '#f0f0f0',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          backgroundColor: city.color,
                          width: `${(city.value / 1456) * 100}%`,
                          borderRadius: '2px',
                        }}
                      ></div>
                    </div>
                  </Col>
                </Row>
              ))}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
