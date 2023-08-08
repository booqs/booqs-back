import { IResolvers } from '@graphql-tools/utils'
import { generateSuggestions } from '../ai'

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
            return `I don't know what "${question}" is, I am just silly stub. But let me give you some more characters, so you can see them in action: ${parent.text} ${parent.context}`
        },
    },
}
