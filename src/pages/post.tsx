import FrontLayout from '@/layouts/frontLayout';
import MyContent from '@/layouts/frontLayout/MyContent';
import MainContainer from '@/layouts/frontLayout/MainContainer';
import MiddleContent from '@/layouts/frontLayout/MiddleContent/index';
import RightSide from '@/layouts/frontLayout/RightSide';
import { Outlet } from 'react-router-dom';

export default function Post() {
  return (
    <>
      <FrontLayout>
        <MainContainer siderVisible={false}>
          <MyContent style={{ maxWidth: '1400px' }}>
            <Outlet></Outlet>
          </MyContent>
        </MainContainer>
      </FrontLayout>
    </>
  );
}
