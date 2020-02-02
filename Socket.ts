import { MiniDispatcher, EventX } from "./MiniDispatcher";
import { Log, ThrowError } from "./Loger";
import { singleton, recyclable, Recyclable } from "./ClassUtils";
import { AMF3Decode, AMF3Encode } from "./AMF3";
import { PBUtils } from "./utils/ProtoBuff";
import { ByteArray } from "./utils/ByteArray";
import { IEventInterests, EventInterestType, Facade } from "./MVC";
import { RecyclePro } from "./Attibute";
import { toHex } from "./utils/ByteUtils";

export const enum SocketEventX {
    OPEN = 65536,
    CLOSE,
    ERROR
}


export interface ISocketSendOption {
    code: number;
    value: any;
    proto?: number;
}

export type SocketDecode = (buff: ArrayBuffer) => Stream;

export type SocketEncode = (option: ISocketSendOption) => ArrayBuffer;

export interface ISocketExec {
    onSocketOpen(callback: wx.SocketHandler): void;
    onSocketClose(callback: wx.SocketHandler): void;
    onSocketError(callback: wx.SocketHandler): void;
    onSocketMessage(callback: wx.SocketHandler): void;
    connectSocket(option: wx.ConnectSocketOption): void;
    closeSocket(option: wx.CloseSocketOption): void
    sendSocketMessage(option: wx.SendSocketMessageOption): void;

    encode?: SocketEncode;
    decode?: SocketDecode;

    // stream?: Stream;
}

export class Stream extends EventX {
    @RecyclePro(undefined)
    data: any;

    @RecyclePro(0)
    len: number;

    toObject(v: any[], pros: string[], to?: object) {
        let n = v.length;
        if (!to) {
            to = {};
        }
        for (let i = 0; i < n; i++) {
            to[pros[i]] = v[i];
        }
        return to;
    }
}






export class Socket extends Facade implements IEventInterests {

    eventInterests: EventInterestType;

    exec: ISocketExec;

    connected = false;

    encode: SocketEncode;

    decode: SocketDecode;

    socketoption = {} as wx.SendSocketMessageOption;

    sendOption = {} as ISocketSendOption;

    constructor(exec?: ISocketExec) {
        super();

        if (!exec) {
            exec = wx as ISocketExec;
        }

        if (!exec.decode) {
            exec.decode = this.sDecode;
        }

        if (!exec.encode) {
            exec.encode = this.sEncode;
        }

        this.exec = exec;

        this.registerEvent(this.eventInterests, this);

    }

    connect(url: string) {
        let { exec } = this;
        exec.onSocketOpen(this.onOpen.bind(this));
        exec.onSocketClose(this.onClose.bind(this));
        exec.onSocketError(this.onError.bind(this));
        exec.onSocketMessage(this.onMessage.bind(this));
        exec.connectSocket({ url: url } as wx.ConnectSocketOption);
    }


    onOpen(e: any) {
        this.connected = true;
        Log("socket onOpen:", e);
        this.simpleDispatch(SocketEventX.OPEN, e);
    }


    close(reason: string) {
        let { exec } = this;
        this.connected = false;
        exec.closeSocket({ reason: reason } as wx.CloseSocketOption)
    }

    onClose(e: any) {
        Log("socket onclose:", e);
        this.simpleDispatch(SocketEventX.CLOSE, e);
    }

    onError(e: any) {
        ThrowError("socket onError:", e);
        this.simpleDispatch(SocketEventX.ERROR, e);
    }


    sDecode(data: ArrayBuffer) {
        // let input = singleton(AMF3Decode);
        // input.clear();
        // input.setArrayBuffer(data);
        // let code = input.readUint16(true);
        // let flag = input.readByte();

        // let stream = this.exec.stream;
        // let len = data.byteLength;
        // stream.type = code;
        // stream.len = len;

        // if (flag == 0) {
        //     stream.data = input.readObject();
        // } else {
        //     //todo;
        //     input.clear();
        //     data = new Zlib.Inflate(new Uint8Array(data.slice(3))).decompress().buffer;
        //     input.setArrayBuffer(data);
        //     stream.data = input.readObject();
        //     console.log(`Inflate data code:${code} length:${stream.len} => ${input.position}`);
        // }

        return undefined;

    }


    sEncode(option: ISocketSendOption) {
        // let output = singleton(AMF3Encode);
        // output.clear();
        // output.position = 0;

        // let { code, value } = option;
        // output.writeUint16(code);
        // if (value) {
        //     output.writeObject(value);
        // }

        // return output.toArrayBuffer(output.position);

        return undefined;
    }

    onMessage(e: { data: ArrayBuffer }) {
        let { decode } = this.exec;
        let stream = decode.call(this, e.data) as Recyclable<Stream>;
        if (stream) {
            this.dispatchEvent(stream);
            stream.recycle();
        }
    }

    send(option: ISocketSendOption): void {

        let { exec, socketoption } = this;

        let buff = exec.encode.call(this, option) as ArrayBuffer;

        if (undefined != buff) {
            socketoption.data = buff;
            exec.sendSocketMessage(socketoption);
        }

    }


    simpleSend(code: number, value?: any, proto?: number) {
        let { sendOption } = this;
        sendOption.code = code;
        sendOption.value = value;
        sendOption.proto = proto;
        this.send(sendOption);
    }
}

export class AMFSocket extends Socket {

    amf3Decode = singleton(AMF3Decode);
    amf3Encode = singleton(AMF3Encode);

    sDecode(data: ArrayBuffer) {
        let input = this.amf3Decode;
        input.clear();
        input.setArrayBuffer(data);
        let code = input.readUint16(true);
        let flag = input.readByte();

        let stream = recyclable(Stream);
        let len = data.byteLength;
        stream.type = code;
        stream.len = len;

        if (flag == 0) {
            stream.data = input.readObject();
        } else {
            //todo;
            // input.clear();
            // data = new Zlib.Inflate(new Uint8Array(data.slice(3))).decompress().buffer;
            // input.setArrayBuffer(data);
            // stream.data = input.readObject();
            // console.log(`Inflate data code:${code} length:${stream.len} => ${input.position}`);
        }

        return stream;

    }


    sEncode(option: ISocketSendOption) {
        let output = this.amf3Encode;
        output.clear();
        output.position = 0;

        let { code, value } = option;
        output.writeUint16(code);
        if (value) {
            output.writeObject(value);
        }

        return output.toArrayBuffer(output.position);

        // let{sendoption} = this;
        // sendoption.data = output.toArrayBuffer(output.position);
    }
}


export class ProtoSocket extends Socket {

    static command: { [key: string]: number } = {}

    amf3Decode = singleton(AMF3Decode);
    amf3Encode = singleton(AMF3Encode);

    byte = new ByteArray(new ArrayBuffer(1024), 1024);


    /**
     * 
     * @param data 
     *      msgid 16
     *      flag 8
     *      len 16
     *  
     */
    sDecode(data: ArrayBuffer) {

        console.log(`decode hex:${toHex(new Uint8Array(data))}`)
        let input = this.byte;
        input.replaceBuffer(data);
        input.position = 0;
        let code = input.readUnsignedShort();
        let flag = input.readByte();
        let datalen = input.readUnsignedShort();

        let protocode = ProtoSocket.command[code];

        let stream = recyclable(Stream);
        stream.type = code;
        stream.len = data.byteLength;

        if (flag == 0) {
            stream.data = PBUtils.readFrom(protocode, input, datalen);

            console.log(`decode data:${JSON.stringify(stream.data)}`)


        } else {
            //todo;
            // data = new Zlib.Inflate(new Uint8Array(data.slice(5))).decompress().buffer;
            // input.setArrayBuffer(data);
            // stream.data = input.readObject();
            // console.log(`Inflate data code:${code} length:${stream.len} => ${input.position}`);
        }

        return stream;

    }


    sEncode(option: ISocketSendOption) {

        let { byte, amf3Encode } = this;
        let { code, proto, value } = option;
        byte.reset();
        let buffer: ArrayBuffer;
        if (value) {
            buffer = PBUtils.writeTo(value, proto, byte).buffer;
        }

        console.log(`encode data:${JSON.stringify(value)}  hex:${toHex(new Uint8Array(buffer))}`)

        amf3Encode.clear();
        //msgcode 16
        amf3Encode.writeUint16(code);
        //flag 8
        amf3Encode.writeByte(0);
        //len;
        if (buffer) {
            amf3Encode.writeUint16(buffer.byteLength);
            amf3Encode.writeByteArray(new Uint8Array(buffer));
        }

        return amf3Encode.toArrayBuffer();


        // byte.writeUnsignedShort(code);
        // byte.writeByte(0);
        // byte.writeUnsignedShort()

        // let output = singleton(AMF3Encode);
        // output.clear();
        // output.position = 0;

        // let { code, value } = option;
        // output.writeUint16(code);
        // if (value) {
        //     output.writeObject(value);
        // }

        // return output.toArrayBuffer(output.position);

    }
}


