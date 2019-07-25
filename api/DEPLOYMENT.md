# Deployment

## Configuration

To configure the `api` you should copy `./src/data/config.template.json` to `./src/data/config.local.json` and modify the content.

```js
{
    "cmcApiKey": "CMC_API_KEY"                       /* API Key for using CoinMarketCap */
    "fixerApiKey": "FIXER_API_KEY"                   /* API Key for using fixer.io */
    "dynamoDbConnection": {
        "region": "AWS-REGION",                      /* AWS Region e.g. eu-central-1 */
        "accessKeyId": "AWS-ACCESS-KEY-ID",          /* AWS Access Key e.g. AKIAI57SG4YC2ZUCSABC */
        "secretAccessKey": "AWS-SECRET-ACCESS-KEY",  /* AWS Secret e.g. MUo72/UQWgL97QArGt9HVUA */
        "dbTablePrefix": "DATABASE-TABLE-PREFIX"     /* Prefix for database table names e.g. tangle-utils-dev- */
    },
    "zmqMainNet": {                                  /* ZMQ Configuration for mainnet */
        "endpoint": "ZMQ-ENDPOINT"                   /* IRI Node ZMQ Endpoint */
    },
    "zmqDevNet": {                                   /* ZMQ Configuration for devnet */
        "endpoint": "ZMQ-ENDPOINT"                   /* IRI Node ZMQ Endpoint */
    },
    "allowedDomains": [                              /* A list of domains for the api allow-origin */
        "www.mydomain.com"
    ]
}
```

## Build

```shell
npm run build
```

## Deploy

The `api` package is setup to be deployed to zeit/now, you should modify the config in `./now.json` to suit your own requirements and then execute the following.

If you want to use a different name for the config file you can specify an environment variable of CONFIG_ID, e.g. set CONFIG_ID to `dev` will load `config.dev.json` instead.

```shell
now
```
