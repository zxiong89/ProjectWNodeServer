import { IGameData } from "./IGameData";


export class SessionData implements IGameData {
    static readonly DATA_TYPE = "SessionData";
    readonly DataType = SessionData.DATA_TYPE;

    GameId?: string;
    DisplayName?: string;
    OpponentId?: string;

    Score?: number;
    TotalDamage?: number;

    constructor(init?: Partial<SessionData>) {
        Object.assign(this, init);
    }
}