// Format the value to a more readable format
function getValueFormatted(value, options) {
  // Defaults
  options.decimalSeparator = options.decimalSeparator || '.'
  options.thousandsSeparator = options.thousandsSeparator || ' '
  options.plusMinusSign = options.plusMinusSign || null
  options.numberOfDecimals = options.fixedDecimals || -1
  options.prefix = options.prefix || null
  options.suffix = options.suffix || null

  value = parseFloat(value)
  let sign

  // Add +/- sign if applicable
  if (options.plusMinusSign) {
    sign = value < 0 ? '-' : '+'
    value = Math.abs(value)
  }
  else {
    sign = ''
  }

  let numberOfDecimals = options.numberOfDecimals

  // Auto set number of decimals if not set
  if (numberOfDecimals === -1) {
    if (value >= 10000) {
      numberOfDecimals = 0
    }
    else {
      numberOfDecimals = 2
    }
  }

  // Set number of decimals
  value = value.toFixed(numberOfDecimals)

  // Set separators
  value = value.replace(',', '|').replace('.', '|')
  value = value.toString().replace('|', options.decimalSeparator)
  value = value.replace(/\B(?=(\d{3})+(?!\d))/g, options.thousandsSeparator)

  // Remove trailing zeros
  if (options.fixedDecimals === -1) {
    const index = value.substr(options.thousandsSeparator)

    console.error(index)

    if (index) {
      value = value.substr(index + 1)
    }
  }

  // Set prefix and suffix
  if (options.prefix) {
    value = `${options.prefix}${value}`
  }

  if (options.suffix) {
    value = `${value}${options.suffix}`
  }

  // Set +/- sign
  value = `${sign}${value}`

  return value
}  
