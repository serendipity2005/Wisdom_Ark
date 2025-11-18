import fileToBase64 from '@/utils/fileTobase64';
import { Node, nodePasteRule } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImgView } from './reactComponent';
const insertImageComponent = (
  view: any,
  nodeType: any,
  src: string,
  alt: string,
) => {
  const { state, dispatch } = view;
  const node = nodeType.create({
    src,
    alt,
  });
  // 和state.tr.insertText的区别
  const transaction = state.tr.replaceSelectionWith(node);
  dispatch(transaction);
};
// 添加判断是否为图片URL的方法
function isImageUrl(url: string): boolean {
  // 检查是否为URL格式
  try {
    new URL(url);
  } catch {
    return false;
  }

  // 检查是否为常见图片扩展名
  const imageExtensions = /\.(jpeg|jpg|png|gif|webp|bmp|svg|ico)$/i;
  return imageExtensions.test(url);
}
const ImgNode = Node.create({
  name: 'image',
  group: 'block',
  content: 'inline*',
  addOptions() {
    return {
      base64: true,
      blob: false,
      markdown: false,
      defaultAlt: '图片',
      maxWidth: 800,
      allowDrop: true,
      allowPaste: true,
    };
  },

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
      },
      height: {
        default: null,
      },
      referrerPolicy: {
        default: 'no-referrer',
      },
    };
  },

  // parseHTML() {
  //   return [
  //     {
  //       tag: 'p',
  //       getAttrs: (node) => {
  //         console.log(node);

  //         const img = node.querySelector('img');
  //         if (!img) return false;
  //         return {
  //           src: img.getAttribute('src'),
  //           alt: img.getAttribute('alt'),
  //           title: img.getAttribute('title'),
  //           width: img.getAttribute('width'),
  //           height: img.getAttribute('height'),
  //         };
  //       },
  //     },
  //   ];
  // },

  // renderHTML({ HTMLAttributes }) {
  //   return [
  //     'div',
  //     {},
  //     [
  //       'img',
  //       {
  //         src: HTMLAttributes.src,
  //         alt: HTMLAttributes.alt,
  //         title: HTMLAttributes.title,
  //         width: HTMLAttributes.width,
  //         height: HTMLAttributes.height,
  //       },
  //     ],
  //   ];
  // },
  // 使用封装的 React 组件
  addNodeView() {
    return ReactNodeViewRenderer(ImgView);
  },
  addPasteRules() {
    return [
      // 处理 Markdown 格式的图片
      nodePasteRule({
        find: /!\[(.*?)\]\((.*?)(?:\s+"(.*?)")?\)/g,
        type: this.type,
        getAttributes: (match) => {
          const [, alt, src, title] = match;
          return { src, alt, title };
        },
      }),
    ];
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('imagePaste'),
        props: {
          handlePaste: (view, event, slice) => {
            const items = Array.from(event.clipboardData?.items || []);

            console.log(event.clipboardData?.getData('text/plain'));

            // 查找图片文件
            const imageItems = items.filter((item) => {
              return item.type.indexOf('image') === 0;
            });

            if (imageItems.length === 0) {
              return false; // 让其他处理器处理
            }
            console.log(imageItems[0]);
            // 处理第一个图片文件
            const imageItem = imageItems[0];
            const file = imageItem.getAsFile();

            if (!file) return false;
            (async () => {
              if (!this.options.markdown) {
                if (this.options.base64) {
                  const src = await fileToBase64(file);
                  insertImageComponent(view, this.type, src, file.name);
                } else if (this.options.blob) {
                  const src = URL.createObjectURL(file);
                  insertImageComponent(view, this.type, src, file.name);
                }
              } else {
                let src = '';
                if (this.options.base64) {
                  src = await fileToBase64(file);
                } else if (this.options.blob) {
                  src = URL.createObjectURL(file);
                }
                this.editor.commands.insertContent(`![${file.name}](${src})`);
              }
            })();

            // 阻止默认粘贴行为
            event.preventDefault();
            return true;
          },

          // 处理拖拽
          // handleDrop: (view, event, slice, moved) => {
          //   const files = Array.from(event.dataTransfer?.files || []);
          //   const imageFiles = files.filter(
          //     (file) => file.type.indexOf('image') === 0,
          //   );

          //   if (imageFiles.length === 0) {
          //     return false;
          //   }

          //   // 获取拖拽位置
          //   const coordinates = view.posAtCoords({
          //     left: event.clientX,
          //     top: event.clientY,
          //   });

          //   if (!coordinates) return false;

          //   // 处理每个图片文件
          //   imageFiles.forEach((file, index) => {
          //     const src = URL.createObjectURL(file);
          //     // new Image()
          //     const img = new window.Image();
          //     img.onload = () => {
          //       const { state, dispatch } = view;
          //       const node = this.type.create({
          //         src,
          //         alt: file.name,
          //         width: img.naturalWidth > 800 ? 800 : img.naturalWidth,
          //         height:
          //           img.naturalWidth > 800
          //             ? Math.round((img.naturalHeight * 800) / img.naturalWidth)
          //             : img.naturalHeight,
          //       });

          //       // 计算插入位置（为多个文件调整位置）
          //       const pos = coordinates.pos + index;
          //       const transaction = state.tr.insert(pos, node);
          //       dispatch(transaction);
          //     };

          //     img.src = src;
          //   });

          //   event.preventDefault();
          //   return true;
          // },
        },
      }),
    ];
  },
});

export default ImgNode;
