// import '@/pages/notification/styles/index.scss';
import { useScrollVisibility } from '@/hooks/useScrollVisibility';
import Header from '@/layouts/frontLayout/Header';
import styled from 'styled-components';
import Typography from 'antd/es/typography/Typography';
import { Link } from 'react-router-dom';
import { Avatar, Layout, List } from 'antd';
import { Outlet } from 'react-router-dom';
// const { Text } = Ty;
const data = [
  {
    title: 'Ant Design Title 1',
  },
  {
    title: 'Ant Design Title 2',
  },
  {
    title: 'Ant Design Title 3',
  },
  {
    title: 'Ant Design Title 4',
  },
];

// 样式
const StyledNav = styled.nav`
  background-color: #fff;
  position: sticky;
  top: 4rem;
  left: 0;
  width: 100vw;
  height: 45px;
  z-index: 100;
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  transform: translateY(0);
  margin-left: calc(50% - 51vw) !important;
  margin-right: calc(50% - 51vw) !important;
  a {
    color: #515767;
  }
  ul {
    height: 100%;
    display: flex;
    width: 1200px;
    margin: auto;
    align-items: center;

    li {
      margin-right: 30px;
      font-size: 14px;
    }
  }
  &.hide {
    top: 0rem;
  }
`;

export default function Nofication() {
  const visible = useScrollVisibility();
  return (
    <>
      <Header></Header>
      {/* className={visible ? '' : 'hide'} */}
      <StyledNav className={` ${visible ? '' : 'hide'}`}>
        <ul className="nav-detail">
          <li>
            <Link to="/comment">评论</Link>
          </li>
          <li>
            <Link>赞和收藏</Link>
          </li>
          <li>新增粉丝</li>
          <li>私信</li>
          <li>系统通知</li>
        </ul>
      </StyledNav>
      <div className="notifiacion-container"></div>
      <main
        className="notification-main-container"
        style={{ height: '1400px', padding: '24px 0' }}
      >
        {/* <div className="notification-list">
          <List
            itemLayout="horizontal"
            dataSource={data}
            renderItem={(item, index) => (
              <>
                <List.Item className="list-item">
                  <List.Item.Meta
                    avatar={<Avatar src={``} />}
                    title={<a href="https://ant.design">{item.title}</a>}
                    description="Ant Design, a design language for background applications, is refined by Ant UED Team"
                  />
                  <div>2020-08-08</div>
                </List.Item>
              </>
            )}
          />
        </div> */}
        <Outlet />
      </main>
    </>
  );
}
