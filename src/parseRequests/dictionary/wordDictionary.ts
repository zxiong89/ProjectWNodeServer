import * as english2words from "./english/2-letter-words.json";
import * as english3words from "./english/3-letter-words.json";
import * as english4words from "./english/4-letter-words.json";
import * as english5words from "./english/5-letter-words.json";
import * as english6words from "./english/6-letter-words.json";
import * as english7words from "./english/7-letter-words.json";
import * as english8words from "./english/8-letter-words.json";
import * as english9words from "./english/9-letter-words.json";
import * as english10words from "./english/10-letter-words.json";
import * as english11words from "./english/11-letter-words.json";
import * as english12words from "./english/12-letter-words.json";
import * as english13words from "./english/13-letter-words.json";
import * as english14words from "./english/14-letter-words.json";
import * as english15words from "./english/15-letter-words.json";

export class WordDictionary {
    readonly words = new Map<string, boolean>();

    constructor() {
        this.addEnglishWords(3,15);
    }

    public add(words: string[]): void {
        for(const key in words) {
            const w = words[key].toString().toUpperCase();
            if (!this.words.get(w)) {
                this.words.set(w, true);
            }
        }
    }

    public addEnglishWords(minLength = 3, maxLength = 15) : void {
        for (let l = minLength; l <= maxLength; l++) this.addEnglishWord(l);
    }

    private addEnglishWord(length: number) {
        let words: string[] | undefined;
        switch(length) {
            case 2: {
                this.add(english2words);
                break;
            }

            case 3: {
                this.add(english3words);
                break;
            }

            case 4: {
                this.add(english4words);
                break;
            }

            case 5: {
                this.add(english5words);
                break;
            }

            case 6: {
                this.add(english6words);
                break;
            }

            case 7: {
                this.add(english7words);
                break;
            }

            case 8: {
                this.add(english8words);
                break;
            }

            case 9: {
                this.add(english9words);
                break;
            }

            case 10: {
                this.add(english10words);
                break;
            }

            case 11: {
                this.add(english11words);
                break;
            }

            case 12: {
                this.add(english12words);
                break;
            }

            case 13: {
                this.add(english13words);
                break;
            }

            case 14: {
                this.add(english14words);
                break;
            }

            case 15: {
                this.add(english15words);
                break;
            }

            default: {
                break;
            }
        }
    }
}