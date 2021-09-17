import { TileData } from "../messages/data/tiles/TileData";
import { DefaultLetterSet } from "./letterSets/Default";

export class TileBag {
    tiles: TileData[] = new Array();

    constructor(init?: Partial<TileBag>) {
        if (init) {
            Object.assign(this, init);
        }
        else {
            const tileSet = new DefaultLetterSet();
            tileSet.Letters.forEach((letter) => {
                const tile: TileData = { 
                    Letter: letter.Letter,
                    Score: letter.Score
                }

                for (let i = 0; i < letter.Frequency; i++) {
                    this.tiles.push(tile);
                }
            })
        }
    }
    
    public static GetRandomTileData(tileBag: TileBag): TileData {
        let i = TileBag.getRandomTileIndex(tileBag);
        let splicedTiles = tileBag.tiles.splice(i, 1);
        return splicedTiles[0];
    }

    private static getRandomTileIndex(tileBag: TileBag): number  {
        return Math.floor(Math.random() * tileBag.tiles.length);
    }

    public static ReturnTileData(tileBag: TileBag, tileData: TileData): void {
        tileBag.tiles.push(tileData);
    }
}