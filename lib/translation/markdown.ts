export class MarkdownProcessor {
  // 保留特定结构的翻译
  async translateWithStructurePreservation(
    markdown: string,
    translator: (text: string) => Promise<string>
  ): Promise<string> {
    // 分离代码块和非代码块
    const codeBlocks: RegExpMatchArray[] = []
    let processedMarkdown = markdown.replace(/```[\s\S]*?```/g, (match) => {
      codeBlocks.push([match])
      return `__CODE_BLOCK_${codeBlocks.length - 1}__`
    })

    // 分离 inline code
    processedMarkdown = processedMarkdown.replace(/`[^`]+`/g, (match) => {
      codeBlocks.push([match])
      return `__INLINE_CODE_${codeBlocks.length - 1}__`
    })

    // 分离链接
    processedMarkdown = processedMarkdown.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, text, url) => {
        codeBlocks.push([text, url])
        return `__LINK_${codeBlocks.length - 1}__`
      }
    )

    // 翻译剩余文本
    const translatedText = await translator(processedMarkdown)

    // 恢复代码块和链接
    let result = translatedText
    for (const [i, block] of codeBlocks.entries()) {
      result = result.replace(
        new RegExp(`__(CODE_BLOCK|INLINE_CODE|LINK)_${i}__`, 'g'),
        () => (block.length === 1 ? block[0] : `[${block[0]}](${block[1]})`)
      )
    }

    return result
  }

  // 提取需要翻译的文本块
  extractTranslatableBlocks(markdown: string): string[] {
    const blocks: string[] = []

    // 移除代码块
    let withoutCodeBlocks = markdown.replace(/```[\s\S]*?```/g, '')

    // 移除 inline code
    withoutCodeBlocks = withoutCodeBlocks.replace(/`[^`]+`/g, '')

    // 提取段落和标题
    const lines = withoutCodeBlocks.split('\n')
    for (const line of lines) {
      const trimmed = line.trim()
      // 跳过空行、链接、图片
      if (
        trimmed &&
        !trimmed.startsWith('[') &&
        !trimmed.startsWith('![') &&
        !trimmed.startsWith('http')
      ) {
        blocks.push(trimmed)
      }
    }

    return blocks
  }

  // 重建 Markdown 文件路径
  buildTranslatedPath(originalPath: string, targetLanguage: string): string {
    // 处理路径：docs/README.md -> docs/en/README.md 或 docs/README.en.md
    const parts = originalPath.split('/')
    const fileName = parts.pop() || ''

    if (fileName.endsWith('.md')) {
      const nameWithoutExt = fileName.slice(0, -3)
      // 选择路径模式：{dir}/{lang}/{file}.md 或 {dir}/{file}.{lang}.md
      // 这里使用第一个模式
      parts.push(targetLanguage)
      parts.push(`${nameWithoutExt}.md`)
    } else {
      parts.push(targetLanguage)
      parts.push(fileName)
    }

    return parts.join('/')
  }
}
