import FrontLayout from '@/layouts/frontLayout';
import { Layout, theme } from 'antd';
import { CircleArrowOutUpLeftIcon } from 'lucide-react';
import { Outlet } from 'react-router';

export default function Home() {
  const {
    token: { colorBgContainer },
  } = theme.useToken();
  return <FrontLayout></FrontLayout>;
}
