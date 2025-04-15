import { generateAnswer, generateSuggestions } from '@/backend/ai'
import { IResolvers } from '@graphql-tools/utils'

export type CopilotInput = {
    text: string,
    context: string,
    start?: number[],
    end?: number[],
    id?: string,
    title?: string,
    author?: string,
    language?: string,
}
export type CopilotParent = CopilotInput
export const copilotResolver: IResolvers<CopilotParent> = {
    Copilot: {
        async suggestions(parent) {
            return generateSuggestions(parent)
        },
        async answer(parent, { question }) {
            return generateAnswer(parent, question)
        },
    },
}
