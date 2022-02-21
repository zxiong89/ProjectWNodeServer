import { AWSError, DynamoDB, Request } from "aws-sdk";
import { AttributeMap } from "aws-sdk/clients/dynamodb";
import { BoardCache } from "../../board/BoardCache";
import { IGameData } from "./IGameData";
import { PlayerData } from "./PlayerData";
import { CharacterType } from "./playerData/CharacterType";
import { GameRunStateChecksum } from "./utils/BoardStateChecksum";
import { ChecksumUtils } from "./utils/ChecksumUtils";
import { PlayerDataChecksum } from "./utils/PlayerDataChecksum";

const { v4: uuidRand } = require(`uuid`); // v4 - random to hopefully reduce collision

const dbTableName = `projectWGameSessions`;
const dbColGameId = "gameId";
const dbColChecksum = `checksum`;
const dbColIsActive = `isActive`;
const dbColPlayerOneId = `playerOneId`;
const dbColPlayerTwoId = `playerTwoId`;
const dbColActivePlayerId = `activePlayerId`;
const dbColTurnCount = `turnCount`;
const dbColScore = `score`;
const dbColTotalDamage = `totalDamage`;
const dbColPlayerOneRndDmg = `playerOneRoundDamage`;
const dbColPlayerTwoRndDmg = `playerTwoRoundDamage`;

export class SessionData implements IGameData {
    static readonly DATA_TYPE = "SessionData";
    readonly DataType = SessionData.DATA_TYPE;

    GameId?: string;
    Checksum?: string;
    IsActive?: boolean;

    PlayerOneId?: string;
    PlayerTwoId?: string;

    DisplayName?: string;
    IsMyTurn?: boolean;
    TurnCount?: number;
    Score?: number;
    TotalDamage?: number;

    PlayerOneRoundDamage?: number;
    PlayerTwoRoundDamage?: number;

    constructor(init?: Partial<SessionData>) {
        Object.assign(this, init);
        
    }

    public GetOpponentId(playerId: string): string {
        return (playerId === this.PlayerOneId ? this.PlayerTwoId : this.PlayerOneId) as string;
    }

    public addTurn(playerId: string, points: number, damage?: number): number {
        if (this.TurnCount != undefined) this.TurnCount++;
        if (this.Score != undefined) this.Score += points;
        if (this.TotalDamage != undefined) this.TotalDamage += (damage != undefined ? damage : points);
        if (this.IsMyTurn != undefined)  this.IsMyTurn = !this.IsMyTurn;

        const dmg = damage != undefined ? damage : points;
        if (this.PlayerOneId === playerId) this.PlayerOneRoundDamage = dmg;
        else if (this.PlayerTwoId === playerId) this.PlayerTwoRoundDamage = dmg;

        if (this.PlayerOneRoundDamage !== undefined && this.PlayerTwoRoundDamage !== undefined) {
            const totalDmg = this.PlayerOneRoundDamage - this.PlayerTwoRoundDamage;
            this.PlayerOneRoundDamage = undefined;
            this.PlayerTwoRoundDamage = undefined;
            return this.PlayerOneId === playerId ? totalDmg : totalDmg * -1;
        }

        return 0;
    }

    public UpdateChecksum(cache: BoardCache, player: PlayerData, enemy: PlayerData): void {
        this.Checksum = ChecksumUtils.CalcChecksum(
            GameRunStateChecksum.CreateGameRunState(cache, this),
            PlayerDataChecksum.CreatePlayerDataChecksum(player),
            PlayerDataChecksum.CreatePlayerDataChecksum(enemy)
        );
    }

    public SaveSessionDataToDB(db: DynamoDB.DocumentClient, playerId: string): Request<DynamoDB.DocumentClient.PutItemOutput, AWSError> {
        const params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: dbTableName,
            Item: {
                "gameId": this.GameId
            }
        };

        params.Item[dbColChecksum] = this.Checksum;
        if (this.IsActive) params.Item[dbColIsActive] = this.IsActive;

        if (this.PlayerOneId) params.Item[dbColPlayerOneId] = this.PlayerOneId;
        if (this.PlayerTwoId) params.Item[dbColPlayerTwoId] = this.PlayerTwoId;
        
        params.Item[dbColActivePlayerId] = this.IsMyTurn ? playerId : this.GetOpponentId(playerId);
        if (this.TurnCount) params.Item[dbColTurnCount] = this.TurnCount;
        if (this.Score !== undefined) params.Item[dbColScore] = this.Score;
        if (this.TotalDamage !== undefined) params.Item[dbColTotalDamage] = this.TotalDamage;

        params.Item[dbColPlayerOneRndDmg] = this.PlayerOneRoundDamage;
        params.Item[dbColPlayerTwoRndDmg] = this.PlayerTwoRoundDamage;

        return db.put(params);
    }

    public static async GetSessionListForPlayer(db: DynamoDB.DocumentClient, playerId: string): Promise<SessionData[]> {
        const data: SessionData[] = [];
        const params: DynamoDB.DocumentClient.ScanInput = {
            TableName: dbTableName,
            FilterExpression: "(playerOneId = :id or playerTwoId = :id) and isActive = :isActive",
            ExpressionAttributeValues: {
                ":id" : playerId,
                ":isActive" : true
            }
        };

        let response;
        do {
            response = await db.scan(params).promise();

            if (response.Items) {
                await Promise.all(response.Items.map(async (item) => {
                    const opponentId: string = playerId === item[dbColPlayerOneId] ? item[dbColPlayerTwoId] : item[dbColPlayerOneId];
                    const playerData = await PlayerData.GetPlayerData(db, opponentId);
                    data.push(SessionData.CreateSessionData(item[dbColGameId], playerId, item, playerData.DisplayName));
                }));
            }
            
            params.ExclusiveStartKey = response.LastEvaluatedKey;
        } while (params.ExclusiveStartKey);

        return data;
    }

    public static async IsGameSessionActive(db: DynamoDB.DocumentClient, gameId: string) : Promise<boolean> {
        const params: DynamoDB.DocumentClient.GetItemInput = {
            TableName: dbTableName,
            Key: {
                "gameId": gameId
            }
        };

        const response = await db.get(params).promise();
        
        return response.Item ? response.Item[dbColIsActive] : false;
    }

    public static async GetGameSessionData(db: DynamoDB.DocumentClient, gameId: string, playerId: string) : Promise<SessionData> {
        const params: DynamoDB.DocumentClient.GetItemInput = {
            TableName: dbTableName,
            Key: {
                "gameId": gameId
            }
        };

        const response = await db.get(params).promise();
        return SessionData.CreateSessionData(gameId, playerId, response.Item);
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

    public static CreateSessionData(gameId: string, playerId: string, item?: AttributeMap, displayName?: string): SessionData {
        const data = new SessionData();
        if (!item) return new SessionData();

        data.GameId = gameId;
        if (displayName) data.DisplayName = displayName;
        if (item[dbColIsActive] !== undefined) data.IsActive = item[dbColIsActive] as boolean;
        if (item[dbColChecksum] !== undefined) data.Checksum = item[dbColChecksum] as string;
        if (item[dbColPlayerOneId] !== undefined) data.PlayerOneId = item[dbColPlayerOneId] as string;
        if (item[dbColPlayerTwoId] !== undefined) data.PlayerTwoId = item[dbColPlayerTwoId] as string;

        data.IsMyTurn = playerId !== item[dbColActivePlayerId] ? false : true
        if (item[dbColTurnCount] !== undefined) data.TurnCount = Number.parseFloat(item[dbColTurnCount] as string);
        if (item[dbColScore] !== undefined) data.Score = Number.parseFloat(item[dbColScore] as string);
        if (item[dbColTotalDamage] !== undefined) data.TotalDamage = Number.parseFloat(item[dbColTotalDamage] as string);
        
        if (item[dbColPlayerOneRndDmg] !== undefined) data.PlayerOneRoundDamage = Number.parseFloat(item[dbColPlayerOneRndDmg] as string);
        if (item[dbColPlayerTwoRndDmg] !== undefined) data.PlayerTwoRoundDamage = Number.parseFloat(item[dbColPlayerTwoRndDmg] as string);

        return data;
    }

}

async function createSessionUUID(db: DynamoDB.DocumentClient): Promise<string> {
    let gameId = uuidRand();
    let isActive = true;

    do {
        isActive = await SessionData.IsGameSessionActive(db, gameId);
        if (!isActive) gameId = uuidRand();
    } while (isActive)
    return gameId;
}