import { DynamoDB } from "aws-sdk";
import { IGameData } from "./IGameData";

/** This is dev is not synced with client side as the client 
 *  queries  directly for character customization. 
 *  This should only be used to store server-side specific data. */
const dbTableName = `projectWPlayers`;
const dbColDisplayName = `displayName`;

export class PlayerData implements IGameData {
    static readonly DATA_TYPE = "PlayerData";
    readonly DataType = PlayerData.DATA_TYPE;

    DisplayName?: string;

    constructor(init?: Partial<PlayerData>) {
        Object.assign(this, init);
    }

    public static async GetPlayerData(db: DynamoDB.DocumentClient, playerId: string): Promise<PlayerData> {
        const params: DynamoDB.DocumentClient.GetItemInput = {
            TableName: dbTableName,
            AttributesToGet: [
                dbColDisplayName
            ],
            Key: {
                "userId" : playerId
            }
        };

        const response = await db.get(params).promise();

        if (!response.Item) return new PlayerData();
        
        return new PlayerData({
            DisplayName: response.Item[dbColDisplayName]
        });
    }
    
}