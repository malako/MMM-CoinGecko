// MMM-CoinGecko module
Module.register("MMM-CoinGecko", {
	// Module config defaults. See https://github.com/malako/MMM-CoinGecko#readme for information.
	defaults: {
		apiKey: null, // Your API key. See https://docs.coingecko.com/reference/setting-up-your-api-key
		coinIds: ['bitcoin', 'ethereum', 'solana'], // CoinGecko coin IDs. Copy from URL or see complete list: https://docs.coingecko.com/v3.0.1/reference/coins-list
		currency: 'usd', // Currency to display the values in
		thousandsSeparator: ',',
		decimalSeparator: '.',
		numberOfDecimals: -1, // Number of decimals to display. -1 for auto
		grayScaleSymbols: false, // Gray coin coin symbols
		columns: ['1h', '24h', '7d', 'sparkline_7d', '30d', '1y'], // Available columns: 1h, 24h, 7d, sparkline_7d, 14d, 30d, 60d, 200d, 1y
		fetchInterval: 10 * 1000, // Fetch interval in ms
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

	constants: {
		apiHost: 'https://api.coingecko.com/api/v3',
		headers: {
			'Content-Type': 'application/json',
			'x-cg-demo-api-key': null			
		},
		endpoints: {
			coins: '/coins'
		},
	},
	
	notifications: {
		GET_JSON: 'GET_JSON',
		GET_JSONS: 'GET_JSONS',
		INVALID_NOTIFICATION_TYPE: 'INVALID_NOTIFICATION_TYPE',
		ERROR: 'ERROR'
	},

	currencySymbol: null,
	resources: { },

	//#region MM overrides
	async start () {
		Log.info('Starting module: ' + this.name)
		this.constants.headers['x-cg-demo-api-key'] = this.config.apiKey
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

	getCoinsData () {
		params = { 
			market_data: true,
			community_data: false,
			developer_data: false,
			sparkline: false
		}

		const urls = []

		for (const coinId of this.config.coinIds) {
			urls.push(this.urlBuilder(`${this.constants.endpoints.coins}/${coinId}`, params))
		}

		this.sendSocketNotification(this.notifications.GET_JSONS, { 
			headers: this.constants.headers,
			urls: urls,
			endpoint: this.constants.endpoints.coins
		})
	},

	socketNotificationReceived: function (notification, payload) {
		switch (notification) {
			case this.notifications.GET_JSONS:
				this.getJsonsCallback(payload)
				break

			case this.notifications.INVALID_NOTIFICATION_TYPE:
				Log.error(`Invalid notification type: ${notification}`)
				break

			case this.notifications.ERROR:
				Log.error(`${payload.notification} ERROR:`, payload.error)
				break

			default:
				Log.error(`THiS bE iMPOSSiBRU!: ${payload.notification}`)
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

	getJsonCallback: function (response) {
		if (!response.ok) {
			Log.error('Error in getJsonCallback', response)
			return
		}

		switch (response.endpoint) {
			case this.constants.endpoints.coins:
				this.coinsCallback(response)
				break

			default:
				Log.error(`Unknown endpoint: ${response.endpoint}`)
		}
	},

	getJsonsCallback: function (responses) {
		const sums = []
		sums['current'] = 0

		// Initiate holdings
		for (const column of this.config.columns) {
			sums[column] = 0
		}

		for (const response of responses) {
			this.getJsonCallback(response)
			if (this.config.displayHoldings && this.config.displayTotalHoldings) {
				sums['current'] += response.data.market_data.current_price[this.config.currency] * this.config.holdings[response.data.id]
				for (const column of this.config.columns) {
					if (column === 'sparkline_7d') {
						continue
					}
					const changeInPercent = parseFloat(response.data.market_data[`price_change_percentage_${column}_in_currency`][this.config.currency])
					if (!isNaN(changeInPercent)) {
						const priceAtTime = response.data.market_data.current_price[this.config.currency] / (1 + changeInPercent / 100)
						sums[column] += priceAtTime * this.config.holdings[response.data.id]
					}
				}
			}
		}

		if (this.config.displayHoldings && this.config.displayTotalHoldings) {
			const numberFormatOptions = { 
				thousandsSeparator: this.config.thousandsSeparator,
				decimalSeparator: this.config.decimalSeparator,
				plusMinusSign: false,
				numberOfDecimals: this.config.numberOfDecimals,
				prefix: this.currencySymbol.prefix,
				suffix: this.currencySymbol.suffix
			}
	
			const totalsRow = this.getWrapper().querySelector('.total-holdings')
			totalsRow.querySelector('.total-holdings-current').innerHTML = getValueFormatted(sums['current'], numberFormatOptions)

			for (let column of this.config.columns) {
				if (column === 'sparkline_7d') {
					sums['sparkline_7d'] = sums['7d']
				}
				totalsRow.querySelector(`.total-holdings-${column}`).innerHTML = getValueFormatted(sums[column], numberFormatOptions)
			}
			setTimeout(() => { this.getCoinsData() }, this.config.fetchInterval)
		}
	},	
	//#endregion

	//#region Helpers
	urlBuilder (endpoint, options) {
		let ret = `${this.constants.apiHost}${endpoint}`

		if (options) {
			const urlEncodedParams = Object.entries(options).map(([key, val]) => `${key}=${encodeURIComponent(val)}`).join('&')
			ret += `?${urlEncodedParams}`
		}

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

