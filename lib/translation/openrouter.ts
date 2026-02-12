import OpenAI from 'openai'

export interface TranslationConfig {
  model: string
  fallbackModels?: string[]
  temperature?: number
  maxTokens?: number
}

export interface TranslationContext {
  fileName: string
  projectName: string
  projectDescription?: string
}

export interface TranslationResult {
  text: string
  model: string
  usage: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export class OpenRouterEngine {
  private client: OpenAI
  private config: TranslationConfig

  constructor(apiKey: string, config: TranslationConfig) {
    this.client = new OpenAI({
      apiKey: apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'GitHub Global',
      },
    })
    this.config = config
  }

  async translate(
    text: string,
    from: string,
    to: string,
    context?: TranslationContext
  ): Promise<TranslationResult> {
    const systemPrompt = this.buildSystemPrompt(from, to, context)

    try {
      const response = await this.client.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: this.config.temperature || 0.3,
        max_tokens: this.config.maxTokens || 4000,
      })

      const translatedText = response.choices[0].message.content || ''

      return {
        text: translatedText,
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      // 如果配置了 fallback，自动降级
      if (this.config.fallbackModels && this.config.fallbackModels.length > 0) {
        return this.translateWithFallback(text, from, to, context, 0)
      }
      throw error
    }
  }

  private async translateWithFallback(
    text: string,
    from: string,
    to: string,
    context: TranslationContext | undefined,
    fallbackIndex: number
  ): Promise<TranslationResult> {
    if (fallbackIndex >= this.config.fallbackModels!.length) {
      throw new Error('All translation models failed')
    }

    const fallbackModel = this.config.fallbackModels![fallbackIndex]

    try {
      const systemPrompt = this.buildSystemPrompt(from, to, context)

      const response = await this.client.chat.completions.create({
        model: fallbackModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: text },
        ],
        temperature: this.config.temperature || 0.3,
        max_tokens: this.config.maxTokens || 4000,
      })

      const translatedText = response.choices[0].message.content || ''

      return {
        text: translatedText,
        model: response.model,
        usage: {
          promptTokens: response.usage?.prompt_tokens || 0,
          completionTokens: response.usage?.completion_tokens || 0,
          totalTokens: response.usage?.total_tokens || 0,
        },
      }
    } catch (error) {
      // 尝试下一个 fallback
      return this.translateWithFallback(text, from, to, context, fallbackIndex + 1)
    }
  }

  private buildSystemPrompt(from: string, to: string, context?: TranslationContext): string {
    let prompt = `You are a professional translator. Translate the following text from ${from} to ${to}.

Important rules:
1. Preserve Markdown structure (code blocks, links, images)
2. Do not translate code content inside code blocks
3. Do not translate URLs
4. Preserve image alt text but translate it
5. Maintain the original formatting
6. For technical terms, keep the English term and add translation in parentheses if needed`

    if (context) {
      prompt += `\n\nContext: This is from a ${context.fileName} in the ${context.projectName} project.`
      if (context.projectDescription) {
        prompt += `\nProject description: ${context.projectDescription}`
      }
    }

    return prompt
  }
}
