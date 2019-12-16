// import { Timer, addTick } from "./Timer";




// async function main(){

//     function getnow(){

//         let nows = process.hrtime();
//         // console.log(nows);

//         return nows[1];
//         // return Data.now();
//     }

//     let startTime = getnow();
//     let lastTime = startTime;


//     function heart(){
//         let now = getnow();
//         let interval = now - lastTime;
//         lastTime = now;
//         Timer.update(now - startTime,interval)
//         // setImmediate(heart);

//         process.nextTick(heart);
//     }


//     heart();

//     // addTick((now:number,interval:number)=>{
//     //     console.log(now,interval);
//     // },this)

// }

// main();