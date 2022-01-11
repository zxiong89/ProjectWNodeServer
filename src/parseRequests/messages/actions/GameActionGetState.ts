import { BoardCache } from "../../board/BoardCache";
import { BoardChangeTypesEnum } from "../data/BoardChangeTypesEnum";
import { BoardData } from "../data/BoardData";
import { IGameData } from "../data/IGameData";
import { PlayerData } from "../data/PlayerData";
import { CharacterType } from "../data/playerData/CharacterType";
import { SessionData } from "../data/SessionData";
import { IGameAction } from "./IGameAction";
import { GameGetStateParams } from "./params/GameGetStateParams";


export class GameActionGetState implements IGameAction {
    static readonly MESSAGE_NAME = "GetState";
    readonly Name = GameActionGetState.MESSAGE_NAME;
    Params: GameGetStateParams = {};

    async parse(data: IGameData[], cache: BoardCache): Promise<string | undefined> {
        if (!this.Params.GameId)  return `No game Id given`;

        const playerId = this.Params.UserId as string;
        const gameId = this.Params.GameId;
        
        cache.GameId = gameId;
        await cache.getGameState();

        const db = cache.DB;

        const sessionData = await SessionData.GetGameSessionData(db, gameId, playerId);
        cache.SessionData = sessionData;
        data.push(sessionData);

        cache.TileBag = cache.TileBag;
        const boardData = new BoardData({
            Board: cache.Tiles,
            ChangeType: BoardChangeTypesEnum.Add
        });
        data.push(boardData);

        const playerData = await PlayerData.GetPlayerData(db, playerId, CharacterType.Player, gameId);
        data.push(playerData);

        if (sessionData) {
            const enemyData = await PlayerData.GetPlayerData(db, sessionData.GetOpponentId(playerId), CharacterType.Enemy, gameId);
            data.push(enemyData);
        }

        return undefined;
    }


    constructor(init?: Partial<GameActionGetState>) {
        Object.assign(this, init);
    }
}