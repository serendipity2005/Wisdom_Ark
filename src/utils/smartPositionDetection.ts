export class SmartPositionDetection {
  // 智能检测最佳插入位置
  static detectBestInsertionPoint(editor: any): number {
    const { from } = editor.state.selection;
    const doc = editor.state.doc;

    // 获取当前段落
    const $from = doc.resolve(from);
    const paragraph = $from.parent;

    // 检测段落中的关键位置
    const text = paragraph.textContent;
    const positions = this.findKeyPositions(text, from);

    // 返回最合适的位置
    return positions.length > 0 ? positions[0] : from;
  }

  // 查找关键位置
  private static findKeyPositions(text: string, currentPos: number): number[] {
    const positions: number[] = [];

    // 查找句子边界
    const sentenceEndings = /[.!?。！？]/g;
    let match;
    while ((match = sentenceEndings.exec(text)) !== null) {
      const pos = match.index + 1;
      if (Math.abs(pos - currentPos) < 50) {
        // 只考虑距离当前位置较近的位置
        positions.push(pos);
      }
    }

    // 查找逗号位置
    const commas = /[,，]/g;
    while ((match = commas.exec(text)) !== null) {
      const pos = match.index + 1;
      if (Math.abs(pos - currentPos) < 30) {
        positions.push(pos);
      }
    }

    // 按距离排序，返回最近的位置
    return positions.sort(
      (a, b) => Math.abs(a - currentPos) - Math.abs(b - currentPos),
    );
  }

  // 获取上下文信息
  static getContextInfo(editor: any, position: number) {
    const doc = editor.state.doc;
    const fullText = doc.textContent;

    return {
      prefix: fullText.substring(0, position),
      suffix: fullText.substring(position),
      fullText,
      wordCount: fullText.length,
      paragraph: this.getCurrentParagraph(editor, position),
      surroundingText: this.getSurroundingText(editor, position, 50),
    };
  }

  private static getCurrentParagraph(editor: any, position: number) {
    const $from = editor.state.doc.resolve(position);
    return $from.parent.textContent;
  }

  private static getSurroundingText(
    editor: any,
    position: number,
    radius: number,
  ) {
    const fullText = editor.getText();
    const start = Math.max(0, position - radius);
    const end = Math.min(fullText.length, position + radius);
    return fullText.substring(start, end);
  }
}
