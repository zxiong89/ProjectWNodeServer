import { IGameActionParams } from "./IGameActionParams";

export class GameGetStateParams implements IGameActionParams {
    GameId?: string;
    UserId?: string;
    Checksum?: string;
}