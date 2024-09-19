export class GameState {
    static State = {
        SPLASH: -1,
        NEED_SLIDES: 0,
        NEED_CLIENTS: 1,
        END: 2,
    };

    protected static _state: number = GameState.State.SPLASH;
    protected static _isChanged:boolean = false;

    public static setState(state:number) {
        if (GameState._state != state) {
            GameState._state = state;
            GameState._isChanged = true;
        }
    }

    public static getState(): number {
        return GameState._state;
    }

    public static isChanged() : boolean {
        const ret = GameState._isChanged;
        GameState._isChanged = false;
        return ret;
    }
}


