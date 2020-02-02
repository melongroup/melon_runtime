export function ThrowError(...args: any) {
    console.error.call(undefined, ...args);
}


export function Log(...args: any) {
    console.log.call(undefined, ...args);
}

export function Error(...args: any) {
    console.error.call(undefined, ...args);
}