const fs = require("fs");
const readline = require("readline")

module.exports = async function(account, activity) {
    
    /**
     * ドメインフィルター
     * @param {} account 
     * @param {*} domain 
     */
    const domainFilter = function(account, domain) {
        if (account.domain == domain) {
            console.log('match fintering domain.[' + domain + ']');
            return true;
        } else {
            return false;
        }
    }
    
    /**
     * アカウントフィルター
     * @param {} account 
     * @param {*} username 
     */
    const accountFilter = function(account, userdomain) {

        const [name, domain] = userdomain.split('@');

        if (account.domain == domain
            && account.username == name) {
            console.log('match fintering userdomain.[' + userdomain + ']');
            return true;
        } else {
            return false;
        }
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
        for (var idx in activity.object.tag) {
            if (activity.object.tag[idx].name == hashTag) {
                console.log('match fintering hashTag.[' + hashTag + ']');
                return true;
            }
        }
        return false;
    }

    // 
    const textFilter = function(activity, pattern) {

        // bodyなし
        if (!activity.object.content) {
            return false;
        }

        // reg
        var reg = pattern.substr(1, pattern.length-2);
        //body
        var body = activity.object.content;

        // チェック
        if (body.match(reg)) {
            console.log('match fintering pattern.[' + pattern + ']');
            return true;
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
    var result = false;
    for await (const line of reader) {
        if (line.indexOf('#') == 0) {
            // タグ
            result = result || tagFilter(activity, line);
        } else if (line.indexOf('@') > 0) {
            // アカウント
            result = result || accountFilter(account, line);
        } else if (line.startsWith('/')) {
            // text
            result = result || textFilter(activity, line);
        } else  {
            // ドメイン
            result = result || domainFilter(account, line);
        }
    };

    return result
}