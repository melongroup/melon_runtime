var guids = {} as {[key:string]:number};

export function getGuid(key:string){
    let n = guids[key];
    if(n === undefined){
        n = 0;
    }
    guids[key] = ++n;
    
    return n;
}
