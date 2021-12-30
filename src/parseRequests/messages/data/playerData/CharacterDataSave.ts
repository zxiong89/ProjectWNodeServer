import { AWSError, DynamoDB, Request } from "aws-sdk";
import { CharacterType } from "./CharacterType";

const dbTableName = `projectWGamePlayerData`;
const dbColGameId = `gameId`;
const dbColPlayerId = `playerId`;
const dbColHealth = `health`;
const dbColMaxHealth = `maxHealth`;
const dbColMana = `mana`;

export class CharacterDataSave {
    Id?: string;
    Health?: number;
    MaxHealth?: number;
    Mana?: number;

    SkillName?: string[];

    Type?: CharacterType;

    // Disabling the below as monster sprites should only be used locally
    //MonsterSpriteName? string; 

    constructor(init?: Partial<CharacterDataSave>) {
        Object.assign(this, init);
    }

    public async GetPlayerDataForGame(db: DynamoDB.DocumentClient, gameId: string, playerId?: string): Promise<boolean> {
        if (playerId) this.Id = playerId;

        const params: DynamoDB.DocumentClient.GetItemInput = {
            TableName: dbTableName,
            Key: {
                "gameId" : gameId,
                "playerId" : this.Id
            }
        };

        const response = await db.get(params).promise();

        if (!response.Item) return false;
        
        this.Health = response.Item[dbColHealth];
        this.MaxHealth = response.Item[dbColMaxHealth];
        this.Mana = response.Item[dbColMana];

        return true;
    }

    public SavePlayerDataForGame(db: DynamoDB.DocumentClient, gameId: string): Request<DynamoDB.DocumentClient.PutItemOutput, AWSError> {
        const params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: dbTableName,
            Item: {
                "gameId": gameId,
                "playerId" : this.Id
            }
        };

        params.Item[dbColHealth] = this.Health;
        params.Item[dbColMaxHealth] = this.MaxHealth;
        params.Item[dbColMana] = this.Mana;

        return db.put(params);
    }
}