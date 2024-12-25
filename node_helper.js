// Malako Generic node_helper.js 1.0.0
const NodeHelper = require("node_helper")
const express = require("express")
const Log = require("logger")

module.exports = NodeHelper.create({
  notifications: {
    GET_JSON: 'GET_JSON',
    GET_JSONS: 'GET_JSONS',
    INVALID_NOTIFICATION_TYPE: 'INVALID_NOTIFICATION_TYPE',
    ERROR: 'ERROR'
  },

  async socketNotificationReceived (notification, payload) {
    try {
      switch (notification) {
        case this.notifications.GET_JSON:
          const response = await this.getJson(payload)
          this.sendSocketNotification(this.notifications.GET_JSON, response)
          break

        case this.notifications.GET_JSONS:
          const responses = await this.getJsons(payload)
          this.sendSocketNotification(this.notifications.GET_JSONS, responses)
          break          
  
        default:
          this.sendSocketNotification(notification.INVALID_NOTIFICATION_TYPE, { message: notification })
      }
    }
    catch (error) {
      Log.error(error)
      this.sendSocketNotification(this.notifications.ERROR, { 
        notification,
        error 
      })
    }
  },

  start () {
    Log.info(`Starting module: ${this.name}`)

    try {
      this.expressApp.use(
        "/" + this.name + "/resources",
        express.static(this.path + "/resources")
      );
      Log.info('/resources configured');

    } catch (error) {
      Log.error(error);
    }
  },

  get: async function (payload) {
    return await fetch(payload.url, {
      method: 'GET',
      headers: payload.headers
    })  
  },

  getJson: async function (payload) {
    let clientResponse, apiResponse

    try {
      apiResponse = await this.get(payload)
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

    return Object.assign(clientResponse, { endpoint: payload.endpoint })
  },

  getJsons: async function (payload) {
    const responses = await Promise.all(payload.urls.map(async (url) => {
      return await this.getJson({ url, headers: payload.headers, endpoint: payload.endpoint })
    }))

    return Object.assign(responses)
  },
});

