# ActivityPub Relay

# 分散型SNSのリレーサーバー

* サポートされる分散型SNS
  * Mastodon
  * Pleroma
  * Misskey(予定)

# 使い方

## ■Docker

* 公開鍵暗号用に公開鍵と秘密鍵を作成
~~~
$ openssl genrsa 1024 > private.pem
$ openssl rsa -in private.pem -pubout -out public.pem
~~~

* .env.productionファイルを作成
~~~
$ cp .env.sample .env.production
$ vi .env.production

# Relay
RELAY_URL="{あなたのリレーサーバーのURL}"
PRIVATE_KEY="{private.pemの中身}"
PUBLIC_KEY="{public.pemの中身}"
~~~

* Dockerコンテナのビルド
~~~
$ docker-compose build relay
~~~

* DBマイグレーション実行(初回のみ)
~~~
$ docker-compose run --rm relay npm run build:migrate
~~~

* 起動
~~~
$ docker-compose up -d
~~~