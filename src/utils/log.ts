export function log(label: string, message?: any) {
    console.log(label);
    if (message) {
        console.log(message);
    }
}