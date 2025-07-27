import { useState } from 'react';
import { Button } from 'antd';
import './App.scss';
import Test from '@/components/Test';
function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Test />
    </>
  );
}

export default App;
