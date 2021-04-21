declare namespace FramePlayer{
    interface ConstructorProp{
        dom?: object,
        startFrame?: number,
        endFrame?: number,
        curFrame?: number,
        prevFrame?: number,
        fps?: number,
        useCanvas?: boolean,
        loop?: number,
        yoyo?: boolean,
    }
}

declare class FramePlayer{
    constructor(prop:FramePlayer.ConstructorProp);
    set(attr: any, value?: any): void;
    get(attr: any): any;
    play(start: number|object, end: number|object, options:object): void;
    goto(goto: number): void;
    pause(): void;
    stop(): void;
    on(events:string, handler:any): any;
    one(events:string, handler:any): any;
    off(events:string, handler:any): any;
    trigger(): any;
    destroy(): void;
    sayHello(): void;
}

export default FramePlayer;
