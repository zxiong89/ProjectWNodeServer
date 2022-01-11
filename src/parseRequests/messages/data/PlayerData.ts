import { DynamoDB } from "aws-sdk";
import { IGameData } from "./IGameData";
import { CharacterDataSave } from "./playerData/CharacterDataSave";
import { CharacterType } from "./playerData/CharacterType";

/** This is dev is not synced with client side as the client 
 *  queries  directly for character customization. 
 *  This should only be used to store server-side specific data. */
const dbTableName = `projectWPlayers`;
const dbColDisplayName = `displayName`;

export class PlayerData extends CharacterDataSave implements IGameData {
    static readonly DATA_TYPE = "PlayerData";
    readonly DataType = PlayerData.DATA_TYPE;

    DisplayName?: string;

    constructor(init?: Partial<PlayerData>) {
        super(init);
        Object.assign(this, init);
    }

    public static async GetPlayerData(db: DynamoDB.DocumentClient, playerId: string, type?: CharacterType, gameId?: string): Promise<PlayerData> {
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
        
        const data = new PlayerData({
            DisplayName: response.Item[dbColDisplayName]
        });

        if (type !== undefined) {
            data.Type = type;
        }

        if (gameId !== undefined) {
            data.Id = playerId;
            await data.GetPlayerDataForGame(db, gameId);
        }
        
        return data;
    }

    public static CreateDefaultPlayerData(id: string, type = CharacterType.Player) {
        return new PlayerData({
            Id: id,
            Type: type,
            Health: 10,
            MaxHealth: 10,
            Mana: 0
        });
    }
}