// anan-agent 轻量 Markdown 渲染器
// 正则实现：代码块、行内代码、加粗、无序列表、换行；不引入额外依赖
/**
 * 将 Markdown 文本渲染为 DOM 元素
 * 支持：代码块（```lang ... ```）、行内代码（`code`）、加粗（**text**）、无序列表（- item）
 */
export function renderMarkdown(text: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'anan-agent-md';

  // 拆分代码块与普通文本
  const codeBlockRegex = /```(\w*)\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // 代码块前的普通文本
    if (match.index > lastIndex) {
      const before = text.slice(lastIndex, match.index);
      appendInline(container, before);
    }
    // 代码块
    const lang = match[1] || '';
    const code = match[2].replace(/\n$/, '');
    container.appendChild(createCodeBlock(code, lang));
    lastIndex = match.index + match[0].length;
  }

  // 末尾普通文本
  if (lastIndex < text.length) {
    appendInline(container, text.slice(lastIndex));
  }

  return container;
}

// 创建代码块 DOM
function createCodeBlock(code: string, lang: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'anan-agent-md-code-block';
  if (lang) {
    const label = document.createElement('div');
    label.className = 'anan-agent-md-code-lang';
    label.textContent = lang;
    wrapper.appendChild(label);
  }
  const pre = document.createElement('pre');
  pre.className = 'anan-agent-md-pre';
  const codeEl = document.createElement('code');
  codeEl.textContent = code;
  pre.appendChild(codeEl);
  wrapper.appendChild(pre);
  return wrapper;
}

// 将普通文本（含行内格式）作为 HTML 追加到容器
function appendInline(container: HTMLElement, text: string): void {
  if (text.trim() === '') {
    return;
  }
  const html = renderInlineHtml(text);
  const div = document.createElement('div');
  div.className = 'anan-agent-md-text';
  div.innerHTML = html;
  container.appendChild(div);
}

// 转义 HTML，防止 XSS
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// 渲染行内格式：转义后处理行内代码、加粗、列表、换行
function renderInlineHtml(text: string): string {
  let s = escapeHtml(text);
  // 行内代码（先处理，避免内部内容被其它规则影响）
  s = s.replace(/`([^`]+)`/g, '<code class="anan-agent-md-inline-code">$1</code>');
  // 加粗
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // 逐行处理列表与换行
  const lines = s.split('\n');
  let html = '';
  let inList = false;
  for (const line of lines) {
    const listMatch = line.match(/^\s*[-*]\s+(.*)$/);
    if (listMatch) {
      if (!inList) {
        html += '<ul class="anan-agent-md-list">';
        inList = true;
      }
      html += `<li>${listMatch[1]}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (line.trim() === '') {
        html += '<br>';
      } else {
        html += `${line}<br>`;
      }
    }
  }
  if (inList) {
    html += '</ul>';
  }
  // 移除末尾多余换行
  return html.replace(/(<br>)+$/, '');
}
