import { TextSelection } from '@tiptap/pm/state';
import Editor from '../../pages/editor';

export const ToCItem = ({ item, onItemClick }) => {
  console.log(item);

  return (
    // item.isActive && !item.isScrolledOver
    <div
      className={`${item.isActive ? 'is-active' : ''} ${item.isScrolledOver ? 'is-scrolled-over' : ''}`}
      style={{
        '--level': item.level,
      }}
    >
      <a
        href={`#${item.id}`}
        onClick={(e) => onItemClick(e, item.id)}
        data-item-index={item.itemIndex}
      >
        {item.textContent}
      </a>
    </div>
  );
};

export const ToCEmptyState = () => {
  return (
    <div className="empty-state">
      <p>Start editing your document to see the outline.</p>
    </div>
  );
};

export const Toc = ({ items = [], editor }) => {
  // if (items.length === 0) {
  //   return <ToCEmptyState />
  // }

  const onItemClick = (e, id) => {
    e.preventDefault();

    if (editor) {
      const element = editor.view.dom.querySelector(`[data-toc-id="${id}"`); //查找对应目录项

      // set focus
      console.log(editor.view.dom, 'dom');
      const isScrollable = (el: HTMLElement) => {
        const style = window.getComputedStyle(el);
        const overflowY = style.overflowY || style.overflow;
        const hasOverflow = overflowY === 'auto' || overflowY === 'scroll';
        return hasOverflow;
      };

      const scrollContainer = isScrollable(
        editor.view.dom.closest('.ant-layout-content'),
      )
        ? editor.view.dom.closest('.ant-layout-content')
        : window;
      // const scrollContainer = editor.view.dom.closest('.ant-layout-content')

      if (element && scrollContainer) {
        if (scrollContainer == window) {
          // 处理 window 滚动
          const elementRect = element.getBoundingClientRect();
          const scrollTop = window.scrollY + elementRect.top;
          window.scrollTo({
            top: scrollTop,
            behavior: 'smooth',
          });
        } else {
          // 计算元素相对于容器的位置
          const containerRect = scrollContainer.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();

          // 计算需要滚动的距离
          const scrollTop =
            scrollContainer.scrollTop + elementRect.top - containerRect.top;
          scrollContainer.scrollTo({
            top: scrollTop,
            behavior: 'smooth',
          });
          const pos = editor.view.posAtDOM(element, 0);
          const tr = editor.view.state.tr;
          tr.setSelection(new TextSelection(tr.doc.resolve(pos)));

          editor.view.dispatch(tr);

          editor.view.focus();

          if (history.pushState) {
            history.pushState(null, null, `#${id}`);
          }
        }
      }

      // window.scrollTo({
      //   top: element.getBoundingClientRect().top + window.scrollY,
      //   behavior: 'smooth',
      // });
    }
  };

  return (
    <>
      {items.map((item, i) => (
        <ToCItem
          onItemClick={onItemClick}
          key={item.id}
          item={item}
          index={i + 1}
        />
      ))}
    </>
  );
};
