# Module: MMM-CoinGecko
MMM-CoinGecko is a [MagicMirror²](https://github.com/MichMich/MagicMirror/) module that displays data from [CoinGecko](https://www.coingecko.com/).

![Screenshot of MMM-CoinGecko](images/screenshot.png?raw=true "Example screenshot")

## About
This module uses CoinGecko's public API to fetch crypto data. Read more about the API at [Public API users (Demo plan)](https://docs.coingecko.com/v3.0.1/reference/introduction).

You can also add your holdings to display the value in selected currency per coin/token, and also as a total bottom line.

## Get started

### API key
1. Sign up for an CoinGecko API plan at [CoinGecko Crypto Data API Plans](https://www.coingecko.com/en/api/pricing).

![CoinGecko API plan](images/api-step-1.png?raw=true "CoinGecko API plan")

2. Log in to and navigate to [CoinGecko's developer dashboard](https://www.coingecko.com/en/developers/dashboard).

3. Create an API key and copy it

### Add MMM-CoinGecko to config.js

1. Add MMM-CoinGecko to MagicMirror²'s `config/config.js`. The only required setting is `apiKey`. Minimal example:

```
{
  module: "MMM-CoinGecko",
  position: "lower_third",
  header: "CoinGecko",
  config: {
    apiKey: '<your api key>',
  }
}
```

### Options
Some options have default settings to get you up and running quickly.

| Option | Default | Description |
| :--- | :--- | :--- |
| `apiKey` | `null` | Your API key.<br/><br/>**REQUIRED** |
| `plan` | `'demo'` | Use `'demo'` for free plan, or `'analyst'`, `'lite'` `'pro'` or `'enterprise'` for paid plan.<br/><br/>Read more on demo plan limitations below.
| `coinIds` | `['bitcoin', 'ethereum', 'solana']` | CoinGecko coin IDs. Copy from URL: ![Screenshot of MMM-CoinGecko](images/select-from-url.png?raw=true "Copy from URL screenshot") or see [complete list](https://docs.coingecko.com/v3.0.1/reference/coins-list).
| `currency` | `'usd'` | Currency to convert to. [Available currencies](https://docs.coingecko.com/v3.0.1/reference/simple-supported-currencies). |
| `thousandsSeparator` | `','` | Thousands separator |
| `decimalSeparator` | `'.'` | Decimal separator |
| `numberOfDecimals` | `-1` | Number of decimals to display. -1 for auto. |
| `grayScaleSymbols` | `false` | Gray scale coin symbols |
|	`columns` | `['1h', '24h', '7d', 'sparkline_7d', '30d', '1y']`| Columns to display. The following options are available: `1h`, `24h`, `7d`, `sparkline_7d`, `14d`, `30d`, `60d`, `200d` and `1y`. |
| `fetchInterval` | `-1` | Fetch interval in ms. `-1` means auto and is described below. |
| `headingType` | `'inline'` | Heading type. Available options: `inline`, `top` or `none`. |
`displayHoldings` | `true` | Displays holdings.<br /> <br />**Requires `holdings` to be set**. |
| `displayTotalHoldings` | `true` | Displays total holdings in each column.<br /><br />**Only applicable if `displayHoldings` is `true`**. |
| `zoom` | `1.0` | Change display size of module. |
| `displayMetrics.priceAtTime` | `false` | Displays the price at the time. | 
| `displayMetrics.changeInCurrency`| `true` | Displays the change in `currency`. |
| `displayMetrics.changeInPercent`| `true` | Displays the change in percent. |
| `holdings` |  `{ 'bitcoin': 0.5, 'ethereum': 1, 'solana': 1.5 }` | Your coin holdings.<br /><br />**Required if you want to to use `displayHoldings` and `displayTotalHoldings`**. |

## CoinGecko API plans
Demo API allows 10000 requests/month and each coin requires a separate call.

If you are on a paid CoinGecko plan, change the `plan` option to your plan. Keeping `fetchInterval` set to auto (`-1`) will calculate the appropriate interval so you don't run out of credits.

Example: If you list four coins with `plan: 'demo'` and `fetchInterval: -1`, data will be updated every ~20 min. 

## Improvements?
Feel free to add issues and suggestions in [issues](https://github.com/malako/MMM-CoinGecko/issues).

You can find the change log [here](https://github.com/malako/MMM-CoinGecko/blob/master/CHANGELOG.md).

/Malako