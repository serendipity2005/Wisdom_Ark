import { Marked } from 'marked';
const marked = new Marked();

const renderer = new marked.Renderer();
renderer.heading = (data): string => {
  const { text, depth } = data;

  switch (depth) {
    case 1:
      return `<h1 class="hClass">${text}</h1>`;
    case 2:
      return `<h2 class="hClass">${text}</h2>`;
    case 3:
      return `<h3 class="hClass">${text}</h3>`;
    case 4:
      return `<h4 class="hClass">${text}</h4>`;
    case 5:
      return `<h5 class="hClass">${text}</h5>`;
    case 6:
      return `<h6 class="hClass">${text}</h6>`;
    default:
      return `<h${depth} class="hClass">${text}</h${depth}>`; // 兜底处理
  }
};

renderer.html = (html) => {
  console.log(html);
  const { text } = html;
  return `<div class="htmlClass">${text}</div>`;
};
// marked.use(renderer); //类型错误
marked.use({ renderer });
marked.setOptions({
  gfm: true,

  breaks: true,
  pedantic: false,
});

export default marked;
