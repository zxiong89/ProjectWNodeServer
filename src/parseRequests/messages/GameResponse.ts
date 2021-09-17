import { IGameData } from "./data/IGameData";

export interface GameResponse {
    IsSuccess: boolean;
    Errors?: string[];
    Data: IGameData[];
}