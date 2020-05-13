import { pgCards } from '../gutenberg/schema';

export async function featuredIds(limit: number) {
    return pgCards
        .find()
        .limit(limit)
        .select('_id')
        .exec()
        .then(rs => rs.map(r => r._id));
}
