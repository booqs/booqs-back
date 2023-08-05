import { typedModel, TypeFromSchema } from '../mongoose'

const schema = {
    id: {
        type: String,
        required: true,
    },
    kind: {
        type: String,
        required: true,
    },
    message: String,
    data: Object,
} as const

export type DbLog = TypeFromSchema<typeof schema>;
const logModel = typedModel('log', schema)

export async function logItem(item: DbLog) {
    return (await logModel).insertMany([item])
}

export async function logExists({ kind, id }: {
    kind: string,
    id: string,
}) {
    return (await logModel).exists({ kind, id })
}
