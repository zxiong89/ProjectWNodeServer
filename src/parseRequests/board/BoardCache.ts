import { AWSError, DynamoDB, Request } from "aws-sdk";
import { WordDictionary } from "../dictionary/wordDictionary";
import { SessionData } from "../messages/data/SessionData";
import { TileData } from "../messages/data/tiles/TileData";
import { TileBag } from "./TileBag";

const gamesTable = `projectWGames`;

export class BoardCache {
    Client: DynamoDB.DocumentClient;
    GameId?: string;
    SessionData?: SessionData;
    Tiles?: TileData[][];
    TileBag?: TileBag;
    dictionary?: WordDictionary;

    constructor(client: DynamoDB.DocumentClient) {
        this.Client = client;
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

        return this.Client.put(params);
    }

    private addBoardCacheToParams(params: DynamoDB.DocumentClient.PutItemInput): void {
        if (this.Tiles) params.Item["tiles"] = JSON.stringify(this.Tiles);
        if (this.TileBag) params.Item["tileBag"] = JSON.stringify(this.TileBag);
    }

    public async getGameState(): Promise<boolean> {
        if (!this.GameId) return false;
        if (this.Tiles && this.TileBag) return true;

        let response = await this.Client.get({
            TableName: gamesTable,
            Key: {
                "gameId": this.GameId
            }
        }).promise();

        if (!response.Item) return false;

        if (response.Item["tiles"]) this.Tiles = await JSON.parse(response.Item["tiles"]);
        if (response.Item["tileBag"]) this.TileBag = await JSON.parse(response.Item["tileBag"]);
        
        return true;
    }
}