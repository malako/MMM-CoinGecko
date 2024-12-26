// MMM-CoinGecko.js
Module.register("MMM-CoinGecko", {
	// Module config defaults. See https://github.com/malako/MMM-CoinGecko#readme for information.
	defaults: {
		apiKey: null, // Your API key. See https://docs.coingecko.com/reference/setting-up-your-api-key
		plan: 'demo', // 'demo' for free plan or 'pro' for paid plan
		coinIds: ['bitcoin', 'ethereum', 'solana'], // CoinGecko coin IDs. Copy from URL or see complete list: https://docs.coingecko.com/v3.0.1/reference/coins-list
		currency: 'usd', // Currency to display the values in
		thousandsSeparator: ',',
		decimalSeparator: '.',
		numberOfDecimals: -1, // Number of decimals to display. -1 for auto
		grayScaleSymbols: false, // Gray coin coin symbols
		columns: ['1h', '24h', '7d', 'sparkline_7d', '30d', '1y'], // Available columns: 1h, 24h, 7d, sparkline_7d, 14d, 30d, 60d, 200d, 1y
		fetchInterval: -1, // Fetch interval in ms. Free API has a limit of 10000 requests per month
		headingType: 'inline', // inline, top, none
		displayHoldings: true, // Displays holdings
		displayTotalHoldings: true, // Displays total holdings, only applicable if displayHoldings is true
		zoom: 1.0, // Change display size of module
		displayMetrics: {
			priceAtTime: false, // Displays the price at the time
			changeInCurrency: true, // Displays the change in currency
			changeInPercent: true, // Displays the change in percent
		},
		holdings: { // Required if displayHoldings is true
			'bitcoin': 0.5,
			'ethereum': 1,
			'solana': 1.5,
		},
	},

	api: {
		baseUrl: null,
		keyHeaderName: null,
		endpoint: '/coins',
		params: { 
			market_data: true,
			community_data: false,
			developer_data: false,
			sparkline: false
		}
	},
	
	currencySymbol: null,
	resources: { },

	//#region MM overrides
	async start () {
		Log.info(`Starting module: ${this.name}`)
		this.setApiConfig()
		this.setFetchInterval()
		await this.getResources()
		this.currencySymbol = this.resources.currencySymbols[this.config.currency]
		this.getCoinsData()
	},

	getTranslations () {
		return {
			en: "resources/translations/en.json",
			sv: "resources/translations/sv.json",
		}
	},

  getStyles () {
    return ["MMM-CoinGecko.css"];
  },

	getScripts () {
		const path = `modules/${this.name}/resources/utils`
    return [
			`${path}/numberFormat.js`
		];
	},

	getDom () {
		const wrapper = document.createElement('div')
		wrapper.classList.add("wrapper");
		wrapper.style.transform = `scale(${this.config.zoom})`
		html =`<table class="${this.config.headingType}">`

		if (this.config.headingType === 'top') {
			html += `
				<thead>
					<tr>
						<th></th>
						<th>${this.translate('currency')}</th>
						<th class="right">${this.translate('price')}</th>
						`
			for (const column of this.config.columns) {
				if (column === 'sparkline_7d') {
					html += `
					<th class="center">${this.translate(`column-${column}`)}</th>`
				}
				else {
				html += `
					<th class="right">${this.translate(`column-${column}`)}</th>`
				}
			}
			html += `
					<tr>
				</thead>
			`
		}

		for (const coinId of this.config.coinIds) {
			html += `
				<tr class="coin ${coinId}">
					<td class="image-wrapper">
						<div class="image"></div>
					</td>
					<td class="name">${coinId}</td>
					<td class="current right">
						<div class="current-price"></div>`
			if (this.config.displayHoldings) {
				html += `
						<div class="holdings-value"></div>`
			}
			html += `
					</td>
					${this.getCellsHtml()}
				</tr>`
		}

		if (this.config.displayHoldings && this.config.displayTotalHoldings) {
			html += `
			<tr class="total-holdings">
				<td colspan="2">${this.translate('total')}</td>
				<td class="right total-holdings-current"></td>`
			for (column of this.config.columns) {
				if (this.config.headingType === 'inline') {
					html += `
					<td class="inline-heading"><div>${this.translate(`column-${column}`)}</div></td>`
				}
				html += `
				<td class="right total-holdings-${column}"></td>`
			}
			html += `
			</tr>`
		}

		html += `</table>`

		wrapper.innerHTML = html

		return wrapper
	},
	//#endregion

	//#region Initialization
	setApiConfig () {
		switch (this.config.plan) {
			case 'demo':
				this.api.keyHeaderName = 'x-cg-demo-api-key'
				this.api.baseUrl = 'https://api.coingecko.com/api/v3'
				break
			
			case 'analyst':
			case 'lite':
			case 'pro':
			case 'enterprise':
				this.api.keyHeaderName = 'x-cg-pro-api-key'
				this.api.baseUrl = 'https://pro-api.coingecko.com/api/v3'
				break

			default:
				Log.error(`Invalid plan: ${this.config.plan}`)
		}
	},

	setFetchInterval () {
		if (this.config.fetchInterval === -1) {
			const millisecondsPerMonth = 31 * 24 * 60 * 60 * 1000
			const buffer = 1.2 // 20% buffer to not exceed the API limit
			let requestsPerMonth

			switch (this.config.plan) {
				case 'demo':
					requestsPerMonth = 10000 // 10k requests per month
					break
				
				case 'analyst':
					requestsPerMonth = 500000 // 500k requests per month
					break

				case 'lite':
					requestsPerMonth = 2000000 // 2m requests per month
					break

				case 'pro':
				case 'enterprise':
					requestsPerMonth = 5000000 // 5m requests per month
					break
	
				default:
					Log.error(`Invalid plan: ${this.config.plan}`)
			}
			this.config.fetchInterval = millisecondsPerMonth / requestsPerMonth * this.config.coinIds.length * buffer
			Log.info('Calculated fetchInterval:', this.convertMillisecondsToReadable(this.config.fetchInterval))
		}
		else {
			Log.info('Static fetchInterval:', convertMillisecondsToReadable(this.config.fetchInterval))
		}
	},
	//#endregion

	//#region DOM manipulation
	getWrapper () {
		return document.getElementById(this.identifier).querySelector('.wrapper')
	},

	getCellsHtml () {
		let html = ''
		for (column of this.config.columns) {

			if (column === 'sparkline_7d') {
				if (this.config.headingType === 'inline') {
					html += `
					<td class="inline-heading"><div>${this.translate('column-7d')}</div></td>`
				}
				html += `
					<td class="sparkline_7d"></td>`
			}
			else {
				if (this.config.headingType === 'inline') {
					html += `
					<td class="inline-heading"><div>${this.translate(`column-${column}`)}</div></td>`
				}
				html += `
					<td class="metrics metrics-${column}">`
				if (this.config.displayMetrics.priceAtTime) {
					html += `
						<div class="price right"></div>`
				}
				if (this.config.displayMetrics.changeInCurrency) {
					html += `
						<div class="currency right"></div>`
				}
				if (this.config.displayMetrics.changeInPercent) {
					html += `
						<div class="percentage right"></div>`
				}
				html += `
					</td>`
			}
		}

		return html
	},
	//#endregion

	//#region Communication
	async getResource(resourceName) {
		const url = `modules/${this.name}/resources/data/${resourceName}`
		let response = await fetch(url)
		return response
	},

	async getResources() {
		const promises = [
			this.getResource('currencySymbols.json').then(async data => this.resources.currencySymbols = await data.json()),
		]

		return Promise.all(promises)
	},

	async getCoinsData () {
		const urls = this.config.coinIds.map(coinId => this.urlBuilder(`${this.api.baseUrl}${this.api.endpoint}/${coinId}`, this.api.params))
		const promises = urls.map(async url => { 
			const response = await fetch(url)
			return response.json()
		})

		const responses = await Promise.all(promises)

		for (const response of responses) {
			this.coinsCallback(response)
		}
	},

	coinsCallback (response) {
		if (!response.ok) {
			Log.error('Error in coinsCallback response', response)
			return
		}

		const coinId = response.data.id
		const row = this.getWrapper().querySelector(`.${coinId}`)

		row.querySelector('.image').innerHTML = `<img src="${response.data.image.large}" class="${this.config.grayScaleSymbols ? 'gray' : 'color'}" />`
		row.querySelector('.name').innerHTML = response.data.name

		if (!this.currencySymbol) {
			this.currencySymbol = { prefix: null, suffix: null }
		}

		const numberFormatOptions = { 
			thousandsSeparator: this.config.thousandsSeparator,
			decimalSeparator: this.config.decimalSeparator,
			plusMinusSign: false,
			numberOfDecimals: this.config.numberOfDecimals,
			prefix: this.currencySymbol.prefix,
			suffix: this.currencySymbol.suffix
		}

		// Set current price
		currentPrice = parseFloat(response.data.market_data.current_price[this.config.currency])

		if (this.config.displayHoldings) {
			row.querySelector('.holdings-value').innerHTML = getValueFormatted(this.config.holdings[coinId] * currentPrice, numberFormatOptions)	
		}

		row.querySelector('.current-price').innerHTML = getValueFormatted(currentPrice, numberFormatOptions)

		for (column of this.config.columns) {
			if (column === 'sparkline_7d') {
				// Extract numerical coin id from image url
				const numericalCoinId = response.data.image.large.replace('https://coin-images.coingecko.com/coins/images/', '').split('/')[0]
				const sparklineUrl = `https://www.coingecko.com/coins/${numericalCoinId}/sparkline.svg`
				row.querySelector('.sparkline_7d').innerHTML = `<img src="${sparklineUrl}" />`
			}
			else {
				const changeInPercent = parseFloat(response.data.market_data[`price_change_percentage_${column}_in_currency`][this.config.currency])

				if (!isNaN(changeInPercent)) {
					const priceAtTime = currentPrice / (1 + changeInPercent / 100)
					const changeInCurrency = currentPrice - priceAtTime
		
					if (this.config.displayMetrics.priceAtTime) {
						row.querySelector(`.metrics-${column} .price`).innerHTML = getValueFormatted(priceAtTime, numberFormatOptions)
					}
					if (this.config.displayMetrics.changeInCurrency) {
						row.querySelector(`.metrics-${column} .currency`).innerHTML = this.getPlusMinusSpan(changeInCurrency, { ...numberFormatOptions, plusMinusSign: true })
					}
					if (this.config.displayMetrics.changeInPercent) {
						row.querySelector(`.metrics-${column} .percentage`).innerHTML = this.getPlusMinusSpan(changeInPercent, { ...numberFormatOptions, plusMinusSign: true, prefix: null, suffix: '%' })
					}
				}
	
				else {
					if (this.config.displayMetrics.priceAtTime) {
						row.querySelector(`.metrics-${column} .price`).innerHTML = '—'
					}
					if (this.config.displayMetrics.changeInCurrency) {
						row.querySelector(`.metrics-${column} .currency`).innerHTML = '—'
					}
					if (this.config.displayMetrics.changeInPercent) {
						row.querySelector(`.metrics-${column} .percentage`).innerHTML = '—'
					}
				}
			}
		}
	},
	//#endregion

	//#region Helpers
	convertMillisecondsToReadable(ms) {
		const minutes = parseInt(ms / 1000 / 60)
		const seconds = parseInt(ms / 1000 % 60)
		const milliseconds = ms % 1000
		return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s ${milliseconds.toFixed(0)}ms`
	},

	urlBuilder (url, params) {
		const reqUrl = `/${this.name}/get-json`
		
		const headers = {
			[this.api.keyHeaderName]: this.config.apiKey,
			'Content-Type': 'application/json'
		}

		url = url += `?${Object.entries(params).map(([key, val]) => `${key}=${encodeURIComponent(val)}`).join('&')}`

		const request = {
			url,
			headers,
		}

		let ret = `${reqUrl}?request=${ encodeURIComponent(JSON.stringify(request)) }`

		return ret
	},

	getPlusMinusSpan (value, options) {
		value = parseFloat(value)
		const formattedValue = getValueFormatted(value, options)

		if (value > 0) {
			return `<span class="positive">${formattedValue}</span>`
		}

		return `<span class="negative">${formattedValue}</span>`
	},
	//#endregion
})

