import { AWSError, DynamoDB, Request } from "aws-sdk";
import { IGameData } from "./IGameData";

const gamesTable = `projectWGames`;


export class SessionData implements IGameData {
    static readonly DATA_TYPE = "SessionData";
    readonly DataType = SessionData.DATA_TYPE;

    GameId?: string;
    DisplayName?: string;
    IsActive?: boolean;
    OpponentId?: string;

    Score?: number;
    TotalDamage?: number;

    constructor(init?: Partial<SessionData>) {
        Object.assign(this, init);
    }

    public addSessionDataToParams(params: DynamoDB.DocumentClient.PutItemInput): void {
        if (this.DisplayName) params.Item["displayName"] = JSON.stringify(this.DisplayName);
        if (this.IsActive) params.Item["isActive"] = JSON.stringify(this.IsActive)
    }
}