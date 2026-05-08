#!/bin/bash

MONGODB_DIR="/home/yass/mongodb"
MONGODB_BIN="$MONGODB_DIR/bin/mongod"
MONGODB_DATA="$MONGODB_DIR/data"
MONGODB_LOG="$MONGODB_DIR/mongod.log"
APP_PORT=3000

# MongoDBが実際に応答しているか確認
mongo_is_ready() {
    (echo > /dev/tcp/127.0.0.1/27017) 2>/dev/null && return 0 || return 1
}

# MongoDBの起動確認・必要なら起動
if mongo_is_ready; then
    echo "[OK] MongoDB は起動済みです。"
else
    echo "MongoDB を起動します..."
    mkdir -p "$MONGODB_DATA"
    "$MONGODB_BIN" --dbpath "$MONGODB_DATA" --logpath "$MONGODB_LOG" --fork

    for i in $(seq 1 10); do
        sleep 1
        if mongo_is_ready; then
            echo "[OK] MongoDB 起動完了。"
            break
        fi
        if [ $i -eq 10 ]; then
            echo "[エラー] MongoDB の起動に失敗しました。ログ: $MONGODB_LOG"
            exit 1
        fi
    done
fi

# ポート3000が使用中なら既存プロセスを停止
if (echo > /dev/tcp/127.0.0.1/$APP_PORT) 2>/dev/null; then
    echo "ポート $APP_PORT が使用中のため、既存のアプリを停止します..."
    pkill -f "node app.js" 2>/dev/null || true
    sleep 1
fi

echo ""
echo "======================================"
echo " yatt 起動中 → http://localhost:$APP_PORT"
echo " 停止: Ctrl+C"
echo "======================================"
echo ""

cd "$(dirname "$0")"
node app.js
