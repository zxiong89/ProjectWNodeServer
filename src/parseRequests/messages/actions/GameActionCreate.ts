import { IGameData } from "../data/IGameData";
import { BoardData } from "../data/BoardData";
import { SessionData } from "../data/SessionData";
import { IGameAction } from "./IGameAction";
import { GameCreateParams } from "./params/GameCreateParams";
import { TileData } from "../data/tiles/TileData";
import { BoardChangeTypesEnum } from "../data/BoardChangeTypesEnum";
import { TileBag } from "../../board/TileBag";
import { BoardCache } from "../../board/BoardCache";

export class GameActionCreate implements IGameAction {
    static readonly MESSAGE_NAME = "Create";
    readonly Name = GameActionCreate.MESSAGE_NAME;
    Params: GameCreateParams = { Rows: 7, Cols: 7};
    
    async parse(data: IGameData[], cache: BoardCache): Promise<string | undefined> {
        cache.gameId = `1`;
        let sessionData = new SessionData({
            GameId: cache.gameId
        });
        data.push(sessionData);

        cache.tileBag = new TileBag();
        cache.tiles = createGameBoard(this.Params.Rows, this.Params.Cols, cache.tileBag);
        let boardData = new BoardData({
            Board: cache.tiles,
            ChangeType: BoardChangeTypesEnum.Add
        });
        data.push(boardData);

        return undefined;
    }

    constructor(init?: Partial<GameActionCreate>) {
        Object.assign(this, init);
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