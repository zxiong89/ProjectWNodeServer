import { BoardCache } from "../../board/BoardCache";
import { IGameData } from "../data/IGameData";
import { IGameActionParams } from "./params/IGameActionParams";

export interface IGameAction {
    readonly Name: string;
    Params: IGameActionParams;

    parse(data: IGameData[], cache: BoardCache): Promise<string | undefined>;
}