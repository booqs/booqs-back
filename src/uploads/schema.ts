import { typedModel, TypeFromSchema, taggedObject, DocumentType } from '../mongoose';
import { LibraryCard } from '../sources';

export const userUploadedEpubsBucket = 'uu-epubs';
export const userUploadedImagesBucket = 'uu-epub-images';

const cardsSchema = {
    assetId: {
        type: String,
        required: true,
    },
    length: {
        type: Number,
        required: true,
    },
    fileHash: {
        type: String,
        required: true,
    },
    title: String,
    author: String,
    language: String,
    description: String,
    subjects: [String],
    cover: String,
    meta: taggedObject<object>(),
} as const;

export type DbUuCard = TypeFromSchema<typeof cardsSchema>;
export const uuCards = typedModel('uu-cards', cardsSchema);

export function toLibraryCard(doc: DocumentType<typeof cardsSchema>): LibraryCard {
    return {
        id: doc._id,
        length: doc.length,
        title: doc.title,
        author: doc.author,
        language: doc.language,
        description: doc.description,
        subjects: doc.subjects,
        cover: doc.cover,
    };
}

const registrySchema = {
    userId: {
        type: String,
        required: true,
    },
    cardId: {
        type: String,
        required: true,
    },
} as const;

export type DbUpload = TypeFromSchema<typeof registrySchema>;
export const uuRegistry = typedModel('uu-registry', registrySchema);
