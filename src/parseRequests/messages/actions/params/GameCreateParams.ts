import { IGameActionParams } from "./IGameActionParams";

export class GameCreateParams implements IGameActionParams {
    UserId?: string;
    OpponentId?: string;

    Rows: number = 7;
    Cols: number = 7;
}