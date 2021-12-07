import { BoardCache } from "../../board/BoardCache";
import { BoardChangeTypesEnum } from "../data/BoardChangeTypesEnum";
import { BoardData } from "../data/BoardData";
import { IGameData } from "../data/IGameData";
import { SessionData } from "../data/SessionData";
import { IGameAction } from "./IGameAction";
import { GameGetStateParams } from "./params/GameGetStateParams";


export class GameActionGetState implements IGameAction {
    static readonly MESSAGE_NAME = "GetState";
    readonly Name = GameActionGetState.MESSAGE_NAME;
    Params: GameGetStateParams = {};

    async parse(data: IGameData[], cache: BoardCache): Promise<string | undefined> {
        if (!this.Params.GameId)  return `No game Id given`;

        cache.GameId = this.Params.GameId;
        await cache.getGameState();
        
        let sessionData = new SessionData({
            GameId: cache.GameId
        });
        data.push(sessionData);

        cache.TileBag = cache.TileBag;
        let boardData = new BoardData({
            Board: cache.Tiles,
            ChangeType: BoardChangeTypesEnum.Add
        });
        data.push(boardData);

        return undefined;
    }


    constructor(init?: Partial<GameActionGetState>) {
        Object.assign(this, init);
    }
}