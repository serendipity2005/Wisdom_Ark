// MySider
import { Menu, theme, type MenuProps } from 'antd';
import Sider from 'antd/es/layout/Sider';
import { useEffect } from 'react';
import './index.scss';
import { BookMarked, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface MySiderProps {
  isHeaderVisible?: boolean;
  children?: React.ReactNode;
  menu?: MenuProps['items'];
  defaultSelectedKeys?: string[];
}

const defaultMenu = [
  {
    key: '/following',
    icon: <BookMarked className="icon" size={15} />,
    label: '关注',
  },
  {
    key: '/synthesis',
    icon: <Star size={15} />,
    label: '综合',
  },
];

const MySider: React.FC<MySiderProps> = (props: MySiderProps) => {
  const { isHeaderVisible, menu, defaultSelectedKeys } = props;
  const navigate = useNavigate();

  console.log('Side接收到', menu, defaultSelectedKeys);
  useEffect(() => {
    console.log('Side接收到', menu, defaultSelectedKeys);
  }, [menu, defaultSelectedKeys]);

  const {
    token: { colorBgContainer },
  } = theme.useToken();
  const handleMenu = (e: any) => {
    navigate(e.key);
  };

  return (
    <Sider
      className={`sider ${isHeaderVisible ? '' : 'sideTop'}`}
      style={{ background: colorBgContainer }}
      width={200}
    >
      {!props.children ? (
        <Menu
          mode="inline"
          defaultSelectedKeys={defaultSelectedKeys || ['/following']}
          defaultOpenKeys={['sub1']}
          style={{ height: '100%' }}
          onClick={handleMenu}
          items={menu || defaultMenu}
        />
      ) : (
        props.children
      )}
    </Sider>
  );
};
export default MySider;
