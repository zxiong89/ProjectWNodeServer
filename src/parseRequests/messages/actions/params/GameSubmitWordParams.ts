import { TileDataSelection } from "../../data/tiles/TileDataSelection";
import { IGameActionParams } from "./IGameActionParams";

export class GameSubmitWordParams implements IGameActionParams {
    GameId?: string;
    UserId?: string;
    Word?: string;
    Selection?: TileDataSelection[];
}