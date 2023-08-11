
export class CacheMgr<T = any> {

    private poll: Record<string, T> = {}

    set(key: string, value: any) {
        this.poll[key] = value;
    }

    get(key: string) {
        return this.poll[key];
    }

    has(key: string) {
        return !!this.poll[key];
    }

    del(key: string) {
        delete this.poll[key];
    }

    clean() {
        this.poll = {};
    }
}