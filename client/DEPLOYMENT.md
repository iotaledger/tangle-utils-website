# Deployment

## Configuration

You should copy `./public/data/config.template.json` to `./public/data/config.local.json` and modify it with your own settings.

```js
{
    "apiEndpoint": "API-ENDPOINT",                   /* The url of the api endpoint e.g. https://api.my-domain.com */
    "networks": [                                    /* List of networks to support */
        {
            "network": "mynet",                      /* Network type */
            "label": "MyNet",                        /* Nework display label */
            "node": {                                /* Node for requests */
                "provider": "NODE1_PROVIDER",        /* Address for node */
                "depth": NODE1_DEPTH,                /* Depth for network */             
                "mwm": NODE1_MWM                     /* MWM for network */
            },
            "coordinatorAddress": "AAA...ZZZ"        /* Coordinator Address on network */
        }
    ]
    "googleMapsKey": "GOOGLE-MAPS-KEY",             /* Key for using with Google maps API */
    "googleAnalyticsId": "GOOGLE-ANALYTICS-ID"      /* Optional, google analytics id */
}
```

## Build

```shell
npm run build
```

## Deploy

The app is configured to use zeit/now for hosting, you can configure `./now.json` to suit your own setup.

If you want to use a different name for the config file you can specify an environment variable of CONFIG_ID, e.g. set CONFIG_ID to `dev` will load `config.dev.json` instead.

After modifying the configuration files you can deploy using the folllowing commands:

```shell
now
```
