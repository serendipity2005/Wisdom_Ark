import { Button } from 'antd';
import './index.scss';
import { useQuery } from '@tanstack/react-query';
import { login } from '@/api/test';

export default function Test() {
  const { data, isLoading } = useQuery({
    queryKey: ['info'],
    queryFn: () => {
      return login({
        username: 'admin',
        password: 'admin123123',
      });
    },
  });
  console.log(data, isLoading);

  return (
    <>
      <Button loading={isLoading} />

      <div className="">
        <p className="t-hover">12</p>
      </div>
    </>
  );
}
