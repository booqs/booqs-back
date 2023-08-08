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

export async function generateAnswer(context: ReadingContext, question: string) {
    let prompt = buildPromptForAnswer(context, question)
    let result = await getChatCompletions(prompt)
    if (!result) {
        return undefined
    }
    return result.join('\n')
}

function parseSuggestion(suggestion: string): string[] {
    return suggestion.split('?')
        .map(s => {
            let trimmed = trimNumberPrefix(s)
            console.log('suggestion', `"${s}"`, `"${trimmed}"`)
            if (trimmed === '') {
                return undefined
            } else {
                return trimmed + '?'
            }
        })
        .filter((s): s is string => s !== undefined)
}

function trimNumberPrefix(s: string) {
    return s.replace(/^\s*\d*[. ]/, '').trim()
}

function buildPromptForSuggestions(context: ReadingContext) {
    return [{
        role: 'system' as const,
        content: `You are assisting user to read ${bookDescription(context)}. User might want to ask different questions about the particular part of the book. You'll be supplied with excerpt of the book and the context around it. You should suggest from 1 to 3 questions that user is likely to ask about the excerpt. Each question must be a single sentense and end with question mark.
        Prioritize this potential questions:
        - Questions about cultural references
        - Questions about used special terms if they are not obvious
        - Questions about previous interactions with the character (if you know the book well and if the character is mentioned in the excerpt)
        - Questions about meaning of the excerpt if it is not obvious
        `,
    }, {
        role: 'user' as const,
        content: `I selected excerpt "${context.text}" within the context "${context.context}". Please suggest questions that I might want to ask about this excerpt.`,
    }]
}

function buildPromptForAnswer(context: ReadingContext, question: string) {
    return [{
        role: 'system' as const,
        content: `You are assisting user to read ${bookDescription(context)}. User want to ask question "${question}" about the particular part of the book. You'll be supplied with excerpt of the book and the context around it. You should answer the question. If the book is well-known and studied, you should prioritize references to scholar interpritations of the book. If the book is not well-known, you should prioritize your own interpritation of the book.`,
    }, {
        role: 'user' as const,
        content: `I selected excerpt "${context.text}" within the context "${context.context}". My question is: ${question}.`,
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