const fs = require("fs");
const readline = require("readline")

module.exports = function(account, activity) {
    
    /**
     * ドメインフィルター
     * @param {} account 
     * @param {*} domain 
     */
    const domainFilter = function(account, domain) {

        return account.domain == domain;
    }
    
    /**
     * アカウントフィルター
     * @param {} account 
     * @param {*} username 
     */
    const accountFilter = function(account, userdomain) {

        const [name, domain] = userdomain.split('@');

        return account.domain == domain
            && account.username == name;
    }
    
    /**
     * タグフィルター
     * @param {} activity 
     * @param {*} hashTag 
     */
    const tagFilter = function(activity, hashTag) {

        // タグなし
        if (!activity.object.tag) {
            return false;
        }

        // タグチェック
        for (var tag in activity.object.tag) {
            if (tag.name == hashTag) {
                return true;
            }
        }
        return false;
    }

    // ファイル読み込み
    const stream = fs.createReadStream('./block.txt', {
        encoding: 'utf8',
        highWateMark: 1024
    });
    const reader = readline.createInterface({ input: stream });


    // １行ずつチェック
    reader.on("line", (line) => {
        if (line.indexOf('#') == 0) {
            // タグ
            return tagFilter(activity, line);
        } else if (line.indexOf('@') > 0) {
            // アカウント
            return accountFilter(account, line);
        } else {
            // ドメイン
            return domainFilter(account, line);
        }
    });
    return false;
}