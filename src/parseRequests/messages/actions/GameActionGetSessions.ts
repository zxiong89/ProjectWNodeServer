import { BoardCache } from "../../board/BoardCache";
import { IGameData } from "../data/IGameData";
import { SessionData } from "../data/SessionData";
import { IGameAction } from "./IGameAction";
import { GameGetSessionsParams } from "./params/GameGetSessionsParams";

export class GameActionGetSessions implements IGameAction {
    static readonly MESSAGE_NAME = "GetSessions";
    readonly Name = GameActionGetSessions.MESSAGE_NAME;
    Params: GameGetSessionsParams = {};

    
    async parse(data: IGameData[], cache: BoardCache): Promise<string | undefined> {
        if (!this.Params.UserId)  return `No user id given`;

        cache.GameId = this.Params.UserId;
        let sessionDatas = await SessionData.GetGameSessionData(cache.DB, this.Params.UserId);
        data.push(sessionDatas);

        return undefined;
    }


    constructor(init?: Partial<GameActionGetSessions>) {
        Object.assign(this, init);
    }

}