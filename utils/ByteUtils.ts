export function fixHex(n: number) {
    let s = n.toString(16);
    if (s.length < 2) {
        s = "0" + s
    }
    return s.toLocaleUpperCase();
}

export function toHex(uint8: Uint8Array, tag = " ") {
    let hex = "";
    for (let i = 0; i < uint8.length; i++) {
        hex += fixHex(uint8[i]) + " "
    }
    // console.log(tag + hex);
    return tag + hex;
}
