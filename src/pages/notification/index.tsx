// import '@/pages/notification/styles/index.scss';
// import { useScrollVisibility } from '@/hooks/useScrollVisibility';
// import Header from '@/layouts/frontLayout/Header';

// import Typography from 'antd/es/typography/Typography';
// import { Link } from 'react-router-dom';
// import { Avatar, Layout, List } from 'antd';
// // const { Text } = Ty;
// const data = [
//   {
//     title: 'Ant Design Title 1',
//   },
//   {
//     title: 'Ant Design Title 2',
//   },
//   {
//     title: 'Ant Design Title 3',
//   },
//   {
//     title: 'Ant Design Title 4',
//   },
// ];

// export default function Nofication() {
//   const visible = useScrollVisibility();
//   return (
//     <>
//       <Header></Header>
//       {/* className={visible ? '' : 'hide'} */}
//       <nav className={`notification-nav ${visible ? '' : 'hide'}`}>
//         <ul className="nav-detail">
//           <li>
//             <Link to="/comment">评论</Link>
//           </li>
//           <li>
//             <Link>赞和收藏</Link>
//           </li>
//           <li>新增粉丝</li>
//           <li>私信</li>
//           <li>系统通知</li>
//         </ul>
//       </nav>
//       <div className="notifiacion-container"></div>
//       <main className="notification-main-container">
//         <div className="notification-list">
//           <List
//             itemLayout="horizontal"
//             dataSource={data}
//             renderItem={(item, index) => (
//               <>
//                 <List.Item className="list-item">
//                   <List.Item.Meta
//                     avatar={<Avatar src={``} />}
//                     title={<a href="https://ant.design">{item.title}</a>}
//                     description="Ant Design, a design language for background applications, is refined by Ant UED Team"
//                   />
//                   <div>2020-08-08</div>
//                 </List.Item>
//               </>
//             )}
//           />
//         </div>
//       </main>
//     </>
//   );
// }
