import editor from '@/pages/editor/config/editorConfig';
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  StrikethroughOutlined,
  OrderedListOutlined,
  UnorderedListOutlined,
  CodeOutlined,
  QuestionCircleOutlined,
  TableOutlined,
  LinkOutlined,
  PictureOutlined,
  HighlightOutlined,
  AlignCenterOutlined,
  AlignLeftOutlined,
  AlignRightOutlined,
} from '@ant-design/icons';
import {
  Button,
  Divider,
  Dropdown,
  Popover,
  Select,
  Space,
  Tooltip,
} from 'antd';
import { ListTodo } from 'lucide-react';
import TextAlign from '@tiptap/extension-text-align';
type ToolbarButton =
  | {
      type: 'divider';
    }
  | {
      icon: React.ReactNode;
      tooltip: string;
      action: () => void;
      isActive?: () => boolean;
    }
  | {
      icon: React.ReactNode;
      tooltip: string;
      type: 'dropdown';
      actions: {
        value: React.ReactNode;
        action: () => void;
        label: string;
        key: string;
      }[];
    };

// 工具栏
const toolbarButtons = [
  //   {
  //     icon: <FontSizeOutlined />,
  //     tooltip: '标题',
  //     action: () => insertHeading(1),
  //     isActive: () => editor?.isActive('heading', { level: 1 }) || false,
  //   },
  { type: 'divider' },
  {
    icon: <BoldOutlined />,
    tooltip: '粗体 (Ctrl+B)',
    action: () => editor?.chain().focus().toggleBold().run(),
    // isActive: () => editor?.isActive('bold') || false,
  },
  {
    icon: <ItalicOutlined />,
    tooltip: '斜体 (Ctrl+I)',
    action: () => editor?.chain().focus().toggleItalic().run(),
    // isActive: () => editor?.isActive('italic') || false,
  },
  {
    icon: <UnderlineOutlined />,
    tooltip: '下划线 (Ctrl+U)',
    action: () => editor?.chain().focus().toggleUnderline().run(),
    isActive: () => editor?.isActive('underline') || false,
  },
  {
    icon: <StrikethroughOutlined />,
    tooltip: '删除线',
    action: () => editor.chain().focus().toggleStrike().run(),
    isActive: () => editor?.isActive('strike') || false,
  },
  { type: 'divider' },
  {
    icon: <OrderedListOutlined />,
    tooltip: '有序列表',
    action: () => editor.chain().focus().toggleOrderedList().run(),
    isActive: () => editor?.isActive('orderedList') || false,
  },
  {
    icon: <UnorderedListOutlined />,
    tooltip: '无序列表',
    action: () => editor.chain().focus().toggleBulletList().run(),
    isActive: () => editor?.isActive('bulletList') || false,
  },

  {
    icon: <ListTodo size={15} />,
    tooltip: '任务',
    action: () => editor.chain().focus().toggleTaskList().run(),
    isActive: () => editor?.isActive('orderedList') || false,
  },
  { type: 'divider' },
  {
    icon: <CodeOutlined />,
    tooltip: '代码块',
    action: () => editor?.chain().focus().toggleCodeBlock().run(),
    isActive: () => editor?.isActive('codeBlock') || false,
  },
  {
    icon: <QuestionCircleOutlined />,
    tooltip: '引用',
    action: () => editor?.chain().focus().toggleBlockquote().run(),
    isActive: () => editor?.isActive('blockquote') || false,
  },
  {
    icon: <TableOutlined />,
    tooltip: '表格',
    action: () => editor?.chain().focus().insertTable().run(),
  },
  {
    icon: <HighlightOutlined />,
    tooltip: '高亮',
    action: () => editor?.chain().focus().toggleHighlight().run(),
  },
  {
    icon: <AlignCenterOutlined />,
    tooltip: '对齐方式',
    type: 'dropdown',
    actions: [
      {
        value: <AlignCenterOutlined />,
        action: () => editor.chain().focus().setTextAlign('justify').run(),
        label: '居中',
        key: 'justify',
      },
      {
        value: <AlignLeftOutlined />,
        action: () => editor.chain().focus().setTextAlign('left').run(),
        label: '左对齐',
        key: 'left',
      },
      {
        value: <AlignRightOutlined />,
        action: () => editor.chain().focus().setTextAlign('right').run(),
        label: '右对齐',
        key: 'right',
      },
    ],
  },
  { type: 'divider' },
  //   {
  //     icon: <LinkOutlined />,
  //     tooltip: '插入链接',
  //     action: () => insertMarkdown('[', ']()'),
  //   },
  //   {
  //     icon: <PictureOutlined />,
  //     tooltip: '插入图片',
  //     action: insertImage,
  //   },
];

export default function Toolbar() {
  return (
    <div
      style={{
        background: '#fafafa',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <Space size="large" style={{ margin: 'auto' }} wrap>
        {toolbarButtons.map((button, index) => {
          if (button.type === 'divider') {
            return <Divider key={`divider-${index}`} type="vertical" />;
          } else if (button.type === 'dropdown') {
            return (
              <Popover
                trigger="click"
                key={button.tooltip}
                content={
                  <Space direction="vertical">
                    {button.actions?.map((action) => (
                      <Button
                        key={action.key}
                        type="text"
                        onClick={() => {
                          action.action(); // 执行对应的操作
                        }}
                      >
                        {action.label}
                      </Button>
                    ))}
                  </Space>
                }
              >
                <Tooltip title={button.tooltip}>
                  <Button
                    type="text"
                    icon={button.icon}
                    onClick={button.action}
                    title={button.tooltip}
                    size="small"
                    className="hover:bg-gray-100"
                  />
                </Tooltip>
              </Popover>
            );
          } else {
            return (
              <Tooltip key={`button-${index}`} title={button.tooltip}>
                <Button
                  type={button.isActive?.() ? 'primary' : 'text'}
                  icon={button.icon}
                  onClick={button.action}
                  size="small"
                  className="hover:bg-gray-100"
                />
              </Tooltip>
            );
          }
        })}
      </Space>
    </div>
  );
}
