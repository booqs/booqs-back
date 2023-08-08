import { ChatCompletionRequestMessage, Configuration, OpenAIApi } from 'openai'

export type ReadingContext = {
    text: string,
    context: string,
    title?: string,
    author?: string,
    language?: string,
}
export async function generateSuggestions(context: ReadingContext) {
    let prompt = buildPromptForSuggestions(context)
    let result = await getChatCompletions(prompt)
    if (!result) {
        return []
    }
    return result.map(parseSuggestion).flat()
}

function parseSuggestion(suggestion: string) {
    return suggestion.split('|||').map(s => s.trim())
}

function buildPromptForSuggestions(context: ReadingContext) {
    return [{
        role: 'system' as const,
        content: `You are assisting user to read ${bookDescription(context)}. User might want to ask different questions about the particular part of the book. You'll be supplied with excerpt of the book and the context around it. You should suggest from 1 to 3 questions that user is likely to ask about the excerpt. Each question should be split with "|||" string. For example: "What is the meaning of life? ||| What is the meaning of death? ||| What is the meaning of everything?"`,
    }, {
        role: 'user' as const,
        content: `I selected excerpt "${context.text}" within the context "${context.context}". Please suggest questions that I might want to ask about this excerpt.`,
    }]
}

function bookDescription(context: ReadingContext) {
    let description = ''
    if (context.title) {
        description += `"${context.title}"`
    }
    if (context.author) {
        description += ` by ${context.author}`
    }
    if (context.language) {
        description += ` (in "${context.language}" language)`
    }
    return description
}


async function getChatCompletions(messages: ChatCompletionRequestMessage[], n: number = 1) {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    })
    const openai = new OpenAIApi(configuration)
    try {
        let respones = await openai.createChatCompletion({
            model: 'gpt-3.5-turbo',
            messages,
            n,
        })
        if (respones.data) {
            let completions = respones.data.choices
                .map(choice => choice.message?.content)
                .filter((m): m is string => m !== undefined)
            return completions
        } else {
            return undefined
        }
    } catch (e) {
        console.error('getChatCompletions', e)
        return undefined
    }
}