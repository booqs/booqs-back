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
            return [
                'What is going on here?',
                'What is the author trying to say?',
                'What is the main idea?',
            ]
        },
        async answers(parent, { question }) {
            return 'Well, it is a good question! Let me think... I don\'t know really. I am just a stub for now.'
        },
    },
}
