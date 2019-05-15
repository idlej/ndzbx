'use strict';

const https = require('https');
const axios = require('axios');

class ZabbixApi {
  constructor(usr, pwd, host, port, useSSL) {
    this.usr = usr;
    this.pwd = pwd;
    if (useSSL) {
      port = port || 443;
      this.axios = axios.create({
        baseURL: `https://${host}:${port}/api_jsonrpc.php`,
        httpsAgent: new https.Agent({
          rejectUnauthorized: false,
        }),
      });
    } else {
      port = port || 80;
      this.axios = axios.create({
        baseURL: `http://${host}:${port}/api_jsonrpc.php`,
      });
    }
    this.auth = '';
    this.id = 1;
  }

  async request(method, params) {
    params = params || {};
    const data = {
      jsonrpc: '2.0',
      method,
      params,
      id: this.id,
    };
    this.id += 1;
    if (this.auth && method != 'apiinfo.version' && method != 'user.login') {
      data.auth = this.auth;
    }
    const response = await this.axios.post('', data);
    if (response.status != 200) {
      throw `Received response with error: ${response.status}`;
    }
    const responseData = response.data;
    if ('error' in responseData) {
      const error = responseData.error;
      if (['Session terminated, re-login, please.', 'Not authorised.'].includes(error.data)) {
        await this.login();
        return await this.request(method, params);
      }
      throw `Error ${error.code}: ${error.message}, ${error.data}`;
    }
    return responseData.result;
  }

  async login(usr, pwd) {
    const params = {
      user: user || this.usr,
      password: pwd || this.pwd,
    };
    this.auth = await this.request('user.login', params);
  }
}

module.exports = ZabbixApi;
