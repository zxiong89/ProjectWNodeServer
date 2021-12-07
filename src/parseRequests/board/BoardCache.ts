import { AWSError, DynamoDB, Request } from "aws-sdk";
import { WordDictionary } from "../dictionary/wordDictionary";
import { SessionData } from "../messages/data/SessionData";
import { TileData } from "../messages/data/tiles/TileData";
import { TileBag } from "./TileBag";

const gamesTable = `projectWGames`;

export class BoardCache {
    client: DynamoDB.DocumentClient;
    GameId?: string;
    SessionData?: SessionData;
    tiles?: TileData[][];
    tileBag?: TileBag;
    dictionary?: WordDictionary;

    constructor(client: DynamoDB.DocumentClient) {
        this.client = client;
    }

    public requestSaveToDB(): Request<DynamoDB.DocumentClient.PutItemOutput, AWSError> {
        if (!this.SessionData || !this.GameId) throw new Error(`Cannot create request to save without gameId`);

        let params: DynamoDB.DocumentClient.PutItemInput = {
            TableName: gamesTable,
            Item: {
                "gameId": this.GameId
            }
        }

        this.SessionData.addSessionDataToParams(params);
        this.addBoardCacheToParams(params);

        return this.client.put(params);
    }

    private addBoardCacheToParams(params: DynamoDB.DocumentClient.PutItemInput): void {
        if (this.tiles) params.Item["tiles"] = JSON.stringify(this.tiles);
        if (this.tileBag) params.Item["tileBag"] = JSON.stringify(this.tileBag);
    }

    public async getGameState(): Promise<boolean> {
        if (!this.GameId) return false;
        if (this.tiles && this.tileBag) return true;

        let response = await this.client.get({
            TableName: gamesTable,
            Key: {
                "gameId": this.GameId
            }
        }).promise();

        if (!response.Item) return false;

        if (response.Item["tiles"]) this.tiles = await JSON.parse(response.Item["tiles"]);
        if (response.Item["tileBag"]) this.tileBag = await JSON.parse(response.Item["tileBag"]);
        
        return true;
    }
}