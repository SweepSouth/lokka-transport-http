/* global fetch */
import LokkaTransport from 'lokka/transport';
// In some envionment like in ReactNative, we don't need fetch at all.
// Technically, this should be handle by 'isomorphic-fetch'.
// But it's not happening. So this is the fix

let fetchUrl = fetch;
// if (typeof fetch === 'function') {
//   // has a native fetch implementation
//   fetchUrl = fetch;
// } else if (typeof __dirname !== 'undefined') {
//   // for Node.js
//   fetchUrl = require('node-fetch');
//   fetchUrl.Promise = Promise;
// } else {
//   // for the browser
//   fetchUrl = require('whatwg-fetch');
// }

export class Transport extends LokkaTransport {
  constructor(endpoint, options = {}) {
    if (!endpoint) {
      throw new Error('endpoint is required!');
    }

    super();
    this._httpOptions = {
      auth: options.auth,
      headers: options.headers || {}
    };
    this.endpoint = endpoint;
  }

  replaceHeaders(headers) {
    Object.assign(this._httpOptions.headers, headers);
  }

  _buildOptions(payload) {
    const options = {
      method: 'POST',
      // To pass cookies to the server. (supports CORS as well)
      credentials: 'include',
    };

    const files = payload.files;
    if (files) {
      if (!global.FormData) {
        throw new Error('Uploading files without `FormData` not supported.')
      }
      const formData = new FormData();
      formData.append('query', payload.query);
      formData.append('variables', JSON.stringify(payload.variables));
      for (const filename in files) {
        if (files.hasOwnProperty(filename)) {
          formData.append(filename, files[filename]);
        }
      }
      options.body = formData;
      options.headers = {};
    }
    else {
      options.body = JSON.stringify(payload);
      options.headers = {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      };
    }

    Object.assign(options.headers, this._httpOptions.headers);
    return options;
  }

  send(query, variables, files, operationName) {
    const payload = {query, variables, files, operationName};
    const options = this._buildOptions(payload);

    return fetchUrl(this.endpoint, options).then(response => {
      // 200 is for success
      // 400 is for bad request
      if (response.status !== 200 && response.status !== 400) {
        throw new Error(`Invalid status code: ${response.status}`);
      }

      return response.json();
    }).then(({data, errors}) => {
      if (errors) {
        const message = errors[0].message;
        const error = new Error(`GraphQL Error: ${message}`);
        error.rawError = errors;

        throw error;
      }

      return data;
    });
  }
}

export default Transport;
