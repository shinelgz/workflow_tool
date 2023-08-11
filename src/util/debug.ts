export class Debug {

    debug = false;
    constructor(bool = false) {
        this.debug = bool;
    }
    enable() {
        this.debug = true;
    }
    close() {
        this.debug = false;
    }
    info(...arg: any) {
        this.debug && console.info(...arg);
    }
    forceLog(...arg: any) {
        console.info(...arg);
    }
}