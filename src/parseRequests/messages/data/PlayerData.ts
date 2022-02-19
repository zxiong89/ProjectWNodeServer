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

    /**
     * Heal a player
     * @param hp amount to heal
     */
    public Heal(hp: number): void {
        this.Health = (this.Health ? this.Health : 0) + hp;
        if (this.MaxHealth && this.Health > this.MaxHealth) this.Health = this.MaxHealth;
    }

    /**
     * Make a player take damage
     * @param dmg amount of damage to take
     * @returns True if the player is still alive, false otherwise
     */
    public TakeDamage(dmg: number): boolean {
        this.Health = this.Health ? this.Health - dmg : 0;
        return this.Health > 0;
    }

    /**
     * Adds mana to the player
     * @param mana amount of mana to add
     */
    public AddMana(mana: number): void {
        this.Mana = (this.Mana ? this.Mana : 0) + mana;
    }

    /**
     * Attempts to use the amount of mana
     * @param mana amount of mana to use
     * @returns True if the mana was used, false if there wasn't enough mana
     */
    public UseMana(mana: number): boolean {
        if (!this.Mana || this.Mana < mana) return false;
        this.Mana -= mana;
        return true;
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