import { AWSError, DynamoDB, Request } from "aws-sdk";
import { WordDictionary } from "../dictionary/wordDictionary";
import { SessionData } from "../messages/data/SessionData";
import { TileData } from "../messages/data/tiles/TileData";
import { TileBag } from "./TileBag";

const dbTableName = `projectWGames`;
const dbColTiles = `tiles`;
const dbColTileBag = `tileBag`;

export class BoardCache {
    DB: DynamoDB.DocumentClient;
    GameId?: string;
    SessionData?: SessionData;
    Tiles?: TileData[][];
    TileBag?: TileBag;
    dictionary?: WordDictionary;

    constructor(client: DynamoDB.DocumentClient) {
        this.DB = client;
    }

    public requestSaveToDB(): Request<DynamoDB.DocumentClient.PutItemOutput, AWSError> {
        if (!this.SessionData || !this.GameId) throw new Error(`Cannot create request to save without gameId`);

        let params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: dbTableName,
            Item: {
                "gameId": this.GameId
            }
        }

        this.addBoardCacheToParams(params);
        return this.DB.put(params);
    }

    private addBoardCacheToParams(params: DynamoDB.DocumentClient.PutItemInput): void {
        if (this.Tiles) params.Item[dbColTiles] = JSON.stringify(this.Tiles);
        if (this.TileBag) params.Item[dbColTileBag] = JSON.stringify(this.TileBag);
    }

    public async getGameState(): Promise<boolean> {
        if (!this.GameId) return false;
        if (this.Tiles && this.TileBag) return true;

        let params: DynamoDB.DocumentClient.GetItemInput = {
            TableName: dbTableName,
            Key: {
                "gameId": this.GameId
            }
        };

        let response = await this.DB.get(params).promise();
        if (!response.Item) return false;

        if (response.Item[dbColTiles]) this.Tiles = await JSON.parse(response.Item[dbColTiles] as string);
        if (response.Item[dbColTileBag]) this.TileBag = await JSON.parse(response.Item[dbColTileBag] as string);
        
        return true;
    }
}