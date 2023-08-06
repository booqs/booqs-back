export type Diagnostic = {
    message: string,
    severity?: 'error' | 'warning' | 'critical',
    data?: object,
};
export type Success<T> = {
    value: T,
    diags: Diagnostic[],
};
export type Failure = {
    value?: undefined,
    diags: Diagnostic[],
};

export type Result<T> = Success<T> | Failure;

export function combineResults<T>(results: Array<Result<T>>): Result<Array<T | undefined>> {
    return {
        value: results.map(r => r.value),
        diags: results.map(r => r.diags).flat(),
    }
}
