import type { ReactNodeViewProps } from '@tiptap/react';
import { NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { Image } from 'antd';
interface ImgViewProps extends ReactNodeViewProps {
  src?: string;
}
// 在tiptap中使用react组件需要NodeViewWrapper包裹
export const ImgView = (props: ImgViewProps) => {
  const { src, node, updateAttributes } = props;
  console.log('接收到了', node.attrs);
  return (
    <NodeViewWrapper className="react-component">
      <Image width={300} src={node.attrs.src} />
    </NodeViewWrapper>
  );
};
