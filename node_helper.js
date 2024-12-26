// Malako Generic node_helper.js 1.0.0
const NodeHelper = require("node_helper")
const express = require("express")
const Log = require("logger")

module.exports = NodeHelper.create({
  async start () {
    Log.info(`Starting module: ${this.name}`)

    try {
      this.expressApp.use(
        "/" + this.name + "/resources",
        express.static(this.path + "/resources")
      )
      Log.info('/resources configured')

      this.expressApp.get(`/${this.name}/get-json`, async (req, res) => {
        request = await JSON.parse(req.query.request)
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(await this.getJson(request)))
      })
      Log.info('/get-info configured')
    }
    catch (error) {
      Log.error(error);
    }
  },

  get: async function (request) {
    return await fetch(request.url, {
      method: 'GET',
      headers: request.headers
    })  
  },

  getJson: async function (request) {
    let clientResponse, apiResponse

    try {
      apiResponse = await this.get(request)
      json = await apiResponse.json()

      if (!apiResponse.ok) {
        clientResponse = { ok: false, data: json }
      }
  
      clientResponse = { ok: true, data: json }
    }
    catch (error) {
      if (!error)
        error = 'Unknown error'

      Log.error(error)
      clientResponse = { ok: false, data: error }
    }

    return clientResponse
  }
});