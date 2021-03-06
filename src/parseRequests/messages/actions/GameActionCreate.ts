import { IGameData } from "../data/IGameData";
import { BoardData } from "../data/BoardData";
import { SessionData } from "../data/SessionData";
import { IGameAction } from "./IGameAction";
import { GameCreateParams } from "./params/GameCreateParams";
import { TileData } from "../data/tiles/TileData";
import { BoardChangeTypesEnum } from "../data/BoardChangeTypesEnum";
import { TileBag } from "../../board/TileBag";
import { BoardCache } from "../../board/BoardCache";
import { PlayerData } from "../data/PlayerData";
import { CharacterType } from "../data/playerData/CharacterType";

export class GameActionCreate implements IGameAction {
    private static readonly TEST_USER_1_ID = `us-east-2:b5845163-19e0-4bb1-b391-6f40f0d99458`;
    private static readonly TEST_USER_2_ID = `us-east-2:1ed624d1-9f97-4479-9825-25dbb2b6b707`;
    static readonly MESSAGE_NAME = `Create`;
    readonly Name = GameActionCreate.MESSAGE_NAME;
    Params: GameCreateParams = { Rows: 7, Cols: 7};
    
    async parse(data: IGameData[], cache: BoardCache): Promise<string | undefined> {
        if (!this.Params.UserId) return undefined;

        const db = cache.DB;
        const opponentId = this.fetchOpponentId();

        const sessionData = await SessionData.CreateGameSessionData(db, this.Params.UserId, opponentId);
        cache.SessionData = sessionData;

        const gameId = sessionData.GameId as string;
        cache.GameId = gameId;

        cache.TileBag = new TileBag();
        cache.Tiles = createGameBoard(this.Params.Rows, this.Params.Cols, cache.TileBag);
        let boardData = new BoardData({
            Board: cache.Tiles,
            ChangeType: BoardChangeTypesEnum.Add
        });

        const playerData = PlayerData.CreateDefaultPlayerData(this.Params.UserId);
        const enemyData = PlayerData.CreateDefaultPlayerData(opponentId, CharacterType.Enemy);

        sessionData.UpdateChecksum(cache, playerData, enemyData);
        await sessionData.SaveSessionDataToDB(db, this.Params.UserId as string).promise();
        data.push(sessionData);

        await cache.requestSaveToDB().promise();
        data.push(boardData);

        await playerData.SavePlayerDataForGame(db, gameId).promise();
        data.push(playerData);

        await enemyData.SavePlayerDataForGame(db, gameId).promise();
        data.push(enemyData);
        
        return undefined;
    }

    constructor(init?: Partial<GameActionCreate>) {
        Object.assign(this, init);
    }
    
    private fetchOpponentId(): string {
        if (typeof this.Params.OpponentId != `undefined` && this.Params.OpponentId) {
            return this.Params.OpponentId;
        }

        return this.Params.UserId == GameActionCreate.TEST_USER_1_ID ? GameActionCreate.TEST_USER_2_ID
            : GameActionCreate.TEST_USER_1_ID;
    }
}

function createGameBoard(rows: number, cols: number, tileBag: TileBag): TileData[][] {
    let tiles: TileData[][] = [];

    for(let r = 0; r < rows; r++) {
        tiles[r] = [];
        for(let c = 0; c < cols; c++) {
            tiles[r][c] = TileBag.GetRandomTileData(tileBag);
        }
    }
    
    return tiles;
}