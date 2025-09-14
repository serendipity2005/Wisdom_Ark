import FrontLayout from '@/layouts/frontLayout';
import MyContent from '@/layouts/frontLayout/MyContent';
import MainContainer from '@/layouts/frontLayout/MainContainer';

import { Outlet } from 'react-router-dom';

export default function DanmuTest() {
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
