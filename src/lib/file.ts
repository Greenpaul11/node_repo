import fs from "fs";

export function dirExistsSync(path: string) {
    try {
        return fs.statSync(path).isDirectory();
    } catch {
        return false;
    }
}
