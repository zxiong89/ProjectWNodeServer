import { Md5 } from "ts-md5";

export class ChecksumUtils {
    private static md5 = new Md5();

    public static CalcChecksum(...data: object[]): string {
        this.md5.start();

        for (let d of data) {
            this.md5.appendStr(JSON.stringify(d));
        }
        
        return this.md5.end().toString();
    }
}