import { AWSError, DynamoDB, Request } from "aws-sdk";
import { GetItemOutput } from "aws-sdk/clients/dynamodb";
import { stringify } from "querystring";
import { IGameData } from "./IGameData";
import { PlayerData } from "./PlayerData";

const { v4: uuidRand } = require(`uuid`); // v4 - random to hopefully reduce collision

const dbTableName = `projectWGameSessions`;
const dbColGameId = "gameId";
const dbColDisplayName = `displayName`;
const dbColIsActive = `isActive`;
const dbColPlayerOneId = `playerOneId`;
const dbColPlayerTwoId = `playerTwoId`;
const dbColActivePlayerId = `activePlayerId`;
const dbColTurnCount = `turnCount`;
const dbColScore = `score`;
const dbColTotalDamage = `totalDamage`;

export class SessionData implements IGameData {
    static readonly DATA_TYPE = "SessionData";
    readonly DataType = SessionData.DATA_TYPE;

    GameId?: string;
    DisplayName?: string;
    IsActive?: boolean;

    PlayerOneId?: string;
    PlayerTwoId?: string;

    IsMyTurn?: boolean;
    TurnCount?: number;
    Score?: number;
    TotalDamage?: number;

    constructor(init?: Partial<SessionData>) {
        Object.assign(this, init);
    }

    public saveSessionDataToDB(db: DynamoDB.DocumentClient, isPlayerOne = true): Request<DynamoDB.DocumentClient.PutItemOutput, AWSError> {
        const params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: dbTableName,
            Item: {
                "gameId": this.GameId
            }
        };

        if (this.DisplayName) params.Item[dbColDisplayName] = this.DisplayName;
        if (this.IsActive) params.Item[dbColIsActive] = this.IsActive;

        if (this.PlayerOneId) params.Item[dbColPlayerOneId] = this.PlayerOneId;
        if (this.PlayerTwoId) params.Item[dbColPlayerTwoId] = this.PlayerTwoId;

        params.Item[dbColActivePlayerId] = (this.IsMyTurn && isPlayerOne) || (!this.IsMyTurn && !isPlayerOne) ? 
                                            this.PlayerOneId : this.PlayerTwoId;
        if (this.TurnCount) params.Item[dbColTurnCount] = this.TurnCount;
        if (this.Score !== undefined) params.Item[dbColScore] = this.Score;
        if (this.TotalDamage !== undefined) params.Item[dbColTotalDamage] = this.TotalDamage;

        return db.put(params);
    }

    public static async GetSessionListForPlayer(db: DynamoDB.DocumentClient, playerId: string): Promise<SessionData[]> {
        const data: SessionData[] = [];
        const params: DynamoDB.DocumentClient.ScanInput = {
            TableName: dbTableName,
            FilterExpression: "playerOneId = :id or playerTwoId = :id",
            ExpressionAttributeValues: {
                ":id" : playerId 
            }
        };

        let response;
        do {
            response = await db.scan(params).promise();

            if (response.Items) {
                await Promise.all(response.Items.map(async (item) => {
                    const opponentId: string = playerId === item[dbColPlayerOneId] ? item[dbColPlayerTwoId] : item[dbColPlayerOneId];
                    const playerData = await PlayerData.GetPlayerData(db, opponentId);
                    const isMyTurn = playerId !== item[dbColActivePlayerId] ? false : true;

                    data.push(new SessionData({
                        GameId: item[dbColGameId],
                        DisplayName: playerData.DisplayName,
                        IsActive: item[dbColIsActive],
                        PlayerOneId: item[dbColPlayerOneId],
                        PlayerTwoId: item[dbColPlayerTwoId],
                        IsMyTurn: isMyTurn,
                        TurnCount: item[dbColTurnCount],
                        Score: item[dbColScore],
                        TotalDamage: item[dbColTotalDamage]
                    }));
                }));
            }
            
            params.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (params.ExclusiveStartKey);

        return data;
    }

    public static async GetGameSessionData(db: DynamoDB.DocumentClient, gameId: string) : Promise<SessionData> {
        const params: DynamoDB.DocumentClient.GetItemInput = {
            TableName: dbTableName,
            Key: {
                "gameId": gameId
            }
        };

        const sessionData = new SessionData({
            GameId: gameId
        });

        await db.get(params, (err, data) => {
            if (err) console.log(err, err.stack);
            else convertGetItemOutput(data, sessionData);
        });

        return sessionData;
    }

    public static async CreateGameSessionData(db: DynamoDB.DocumentClient, userId: string, opponentId: string): Promise<SessionData> {
        const gameId = await createSessionUUID(db);

        const sessionData = new SessionData({
            GameId: gameId,
            PlayerOneId: userId,
            PlayerTwoId: opponentId,
            IsActive: true,
            IsMyTurn: true,
            TurnCount: 1,
            Score: 0,
            TotalDamage: 0
        });

        return sessionData;
    }
}

function convertGetItemOutput(data: GetItemOutput, sessionData: SessionData, onlyConvertIsActive = false) {
    if (!data.Item) return;

    if (data.Item[dbColIsActive]) sessionData.IsActive = data.Item[dbColIsActive].BOOL;
    if (onlyConvertIsActive) return;

    if (data.Item[dbColDisplayName]) sessionData.DisplayName = data.Item[dbColDisplayName].S;
    if (data.Item[dbColPlayerOneId]) sessionData.PlayerOneId = data.Item[dbColPlayerOneId].S;
    if (data.Item[dbColPlayerTwoId]) sessionData.PlayerTwoId = data.Item[dbColPlayerTwoId].S;
    if (data.Item[dbColScore]) sessionData.Score = Number.parseFloat(data.Item[dbColScore].N as string);
    if (data.Item[dbColTotalDamage]) sessionData.TotalDamage = Number.parseFloat(data.Item[dbColTotalDamage].N as string);
}

async function createSessionUUID(db: DynamoDB.DocumentClient): Promise<string> {
    let gameId = uuidRand();
    let isActive = true;

    do {
        const sessionData = await SessionData.GetGameSessionData(db, gameId);
        if (sessionData.IsActive) gameId = uuidRand();
        else isActive = false;
    } while (isActive)
    return gameId;
}