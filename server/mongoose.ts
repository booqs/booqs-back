import {
    Schema, model, Document, connect, Model,
} from 'mongoose'
import { config } from './config'

let db: Promise<boolean> | undefined
export async function mongoDbConnection() {
    if (!db) {
        db = connectToMongoDb()
        return db
    } else {
        let current = db
        let success = await current
        if (!success && current === db) {
            db = connectToMongoDb()
        }
    }
    return db
}
async function connectToMongoDb() {
    const dbUri = config().mongodbUri
    if (dbUri) {
        console.log('Connecting to db...')
        await connect(dbUri, { dbName: 'production' })
        console.log('Connected to db')
        return true
    } else {
        console.warn('MONGODB_URI is not set')
        return false
    }
}

// TODO: remove this extra inderection layer
export async function typedModel<T extends SchemaDefinition>(name: string, schema: T): Promise<Model<DocumentType<T>>> {
    await mongoDbConnection()
    const key = `mongodb_${name}`;
    (global as any)[key] = (global as any)[key] ?? model(name, new Schema(schema))
    return (global as any)[key]
}

export function taggedObject<T>(): TaggedObject<T> {
    return Object
}

export const ObjectId = Schema.Types.ObjectId
export type ObjectId = Schema.Types.ObjectId;
type ObjectIdConstructor = typeof ObjectId;

export type DocumentType<T extends SchemaDefinition> =
    & GetSchemaType<T>
    & Document<string>
    ;

export type TypeFromSchema<T extends SchemaDefinition> =
    & GetSchemaType<T>
    & { _id: string }

type GetSchemaType<T extends SchemaDefinition> =
    & { [P in Extract<keyof T, RequiredProperties<T>>]: FieldType<T[P]>; }
    & { [P in Exclude<keyof T, RequiredProperties<T>>]?: FieldType<T[P]>; }
    ;

type RequiredProperties<T> = Exclude<{
    [K in keyof T]: T[K] extends { required: true }
    ? K
    : never
}[keyof T], undefined>;

type SchemaDefinition = {
    readonly [x: string]: SchemaField<any>,
};
type SchemaField<T extends SchemaType> = T | SchemaFieldComplex<T>;
type SchemaFieldComplex<T extends SchemaType> = {
    type: T,
    required?: boolean,
};

type TaggedObject<T> = ObjectConstructor & { _tag?: T };
type SchemaTypeSimple =
    | StringConstructor | NumberConstructor
    | BooleanConstructor | DateConstructor
    | ObjectConstructor | ObjectIdConstructor
    | TaggedObject<any>
    ;
type SchemaType =
    | SchemaTypeSimple
    | [SchemaTypeSimple] | readonly [SchemaTypeSimple]
    | SchemaTypeSimple[]
    ;

type GetTypeSimple<T> =
    T extends StringConstructor ? string :
    T extends NumberConstructor ? number :
    T extends BooleanConstructor ? boolean :
    T extends DateConstructor ? Date :
    T extends TaggedObject<infer U> ? U :
    T extends ObjectConstructor ? object :
    T extends ObjectIdConstructor ? string :
    never;
type GetType<T extends SchemaType> =
    T extends SchemaTypeSimple ? GetTypeSimple<T> :
    T extends [infer U] ? Array<GetTypeSimple<U>> :
    T extends readonly [infer RU] ? Array<GetTypeSimple<RU>> :
    T extends Array<infer AU> ? Array<GetTypeSimple<AU>> :
    never;
type FieldType<T extends SchemaField<any>> =
    T extends SchemaFieldComplex<infer U> ? GetType<U> :
    T extends SchemaType ? GetType<T> :
    never;
