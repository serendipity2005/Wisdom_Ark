import { Avatar, List } from 'antd';
import { Flame, RotateCcw, Flower, Award } from 'lucide-react';

export default function VideoList() {
  const data = [
    { title: 'Ant Design Title 1' },
    { title: 'Ant Design Title 2' },
    { title: 'Ant Design Title 3' },
    { title: 'Ant Design Title 4' },
  ];

  // 定义前三名的颜色
  const rankColors = ['#ffde57', '#C0C0C0', '#CD7F32'];

  return (
    <div className="w-350 h-400 bg-white rounded-10 p-15">
      <div className="font-bold flex items-center mb-10">
        <Flame className="mr-5 w-20 h-20" />
        热门主播榜
        <span className="ml-auto text-primary flex items-center font-300 text-13 cursor-pointer">
          <RotateCcw className="mr-3 w-15 h-15 font-300" />
          刷新
        </span>
      </div>

      <List
        itemLayout="horizontal"
        dataSource={data}
        renderItem={(item, index) => (
          <List.Item className="py-3">
            {index < 3 && (
              <div className="mr-4 flex items-start pt-1">
                <Award
                  className="w-22 h-22"
                  style={{
                    color: rankColors[index],
                  }}
                />
              </div>
            )}
            {index >= 3 && <div className="mr-4 w-22 h-22"></div>}
            <List.Item.Meta
              avatar={
                <Avatar
                  src={`https://api.dicebear.com/7.x/miniavs/svg?seed=${index}`}
                />
              }
              title={<a href="https://ant.design">{item.title}</a>}
              description={
                <div>
                  <div className="flex items-center">
                    <Flower className="text-#ff77a3 w-15 h-15 mr-4" />
                    <span className="text-14 color-#ff77a3">2211</span>
                  </div>
                </div>
              }
            />
            <div className="flex items-center">1121</div>
          </List.Item>
        )}
      />
      {/* <div className="w-full">
        <Button type="text">发起直播</Button>
      </div> */}
    </div>
  );
}
