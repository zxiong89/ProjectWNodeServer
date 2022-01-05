import { BoardCache } from "../../../board/BoardCache";
import { SessionData } from "../SessionData";
import { TileData } from "../tiles/TileData";

/**
 * Reflection of GameRunState for local saves
 * Meant to serialize only the neccessary data
 */
export class GameRunStateChecksum {
    Tiles?: TileData[][];
    TurnCount?: number;
    Score?: number;
    TotalDamage?: number;

    constructor(init?: Partial<GameRunStateChecksum>) {
        Object.assign(this, init);
    }

    public static CreateGameRunState(cache: BoardCache, sessionData: SessionData): GameRunStateChecksum {
        return new GameRunStateChecksum({
            Tiles: cache.Tiles,
            TurnCount: sessionData.TurnCount,
            Score: sessionData.Score,
            TotalDamage: sessionData.TotalDamage
        });
    }
}