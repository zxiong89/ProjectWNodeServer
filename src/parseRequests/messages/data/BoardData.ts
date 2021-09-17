import { BoardChangeTypesEnum } from "./BoardChangeTypesEnum";
import { IGameData } from "./IGameData";
import { TileData } from "./tiles/TileData";
import { TileDataSelection } from "./tiles/TileDataSelection";


export class BoardData implements IGameData {
    static readonly DATA_TYPE = "BoardData";
    readonly DataType = BoardData.DATA_TYPE;

    Checksum?: string;
    Board?: TileData[][];
    TileDelta?: TileDataSelection[];
    ChangeType?: BoardChangeTypesEnum;

    constructor(init?: Partial<BoardData>) {
        Object.assign(this, init);
    }
}