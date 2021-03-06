'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Transport = undefined;

var _stringify = require('babel-runtime/core-js/json/stringify');

var _stringify2 = _interopRequireDefault(_stringify);

var _assign = require('babel-runtime/core-js/object/assign');

var _assign2 = _interopRequireDefault(_assign);

var _getPrototypeOf = require('babel-runtime/core-js/object/get-prototype-of');

var _getPrototypeOf2 = _interopRequireDefault(_getPrototypeOf);

var _classCallCheck2 = require('babel-runtime/helpers/classCallCheck');

var _classCallCheck3 = _interopRequireDefault(_classCallCheck2);

var _createClass2 = require('babel-runtime/helpers/createClass');

var _createClass3 = _interopRequireDefault(_createClass2);

var _possibleConstructorReturn2 = require('babel-runtime/helpers/possibleConstructorReturn');

var _possibleConstructorReturn3 = _interopRequireDefault(_possibleConstructorReturn2);

var _inherits2 = require('babel-runtime/helpers/inherits');

var _inherits3 = _interopRequireDefault(_inherits2);

var _transport = require('lokka/transport');

var _transport2 = _interopRequireDefault(_transport);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// In some envionment like in ReactNative, we don't need fetch at all.
// Technically, this should be handle by 'isomorphic-fetch'.
// But it's not happening. So this is the fix

var fetchUrl = fetch;
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

/* global fetch */

var Transport = exports.Transport = function (_LokkaTransport) {
  (0, _inherits3.default)(Transport, _LokkaTransport);

  function Transport(endpoint) {
    var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];
    (0, _classCallCheck3.default)(this, Transport);

    if (!endpoint) {
      throw new Error('endpoint is required!');
    }

    var _this = (0, _possibleConstructorReturn3.default)(this, (0, _getPrototypeOf2.default)(Transport).call(this));

    _this._httpOptions = {
      auth: options.auth,
      headers: options.headers || {}
    };
    _this.endpoint = endpoint;
    return _this;
  }

  (0, _createClass3.default)(Transport, [{
    key: 'replaceHeaders',
    value: function replaceHeaders(headers) {
      (0, _assign2.default)(this._httpOptions.headers, headers);
    }
  }, {
    key: '_buildOptions',
    value: function _buildOptions(payload) {
      var options = {
        method: 'POST',
        // To pass cookies to the server. (supports CORS as well)
        credentials: 'include'
      };

      var files = payload.files;
      if (files) {
        if (!global.FormData) {
          throw new Error('Uploading files without `FormData` not supported.');
        }
        var formData = new FormData();
        formData.append('query', payload.query);
        formData.append('variables', (0, _stringify2.default)(payload.variables));
        for (var filename in files) {
          if (files.hasOwnProperty(filename)) {
            formData.append(filename, files[filename]);
          }
        }
        options.body = formData;
        options.headers = {};
      } else {
        options.body = (0, _stringify2.default)(payload);
        options.headers = {
          Accept: 'application/json',
          'Content-Type': 'application/json'
        };
      }

      (0, _assign2.default)(options.headers, this._httpOptions.headers);
      return options;
    }
  }, {
    key: 'send',
    value: function send(query, variables, files, operationName) {
      var payload = { query: query, variables: variables, files: files, operationName: operationName };
      var options = this._buildOptions(payload);

      return fetchUrl(this.endpoint, options).then(function (response) {
        // 200 is for success
        // 400 is for bad request
        if (response.status !== 200 && response.status !== 400) {
          throw new Error('Invalid status code: ' + response.status);
        }

        return response.json();
      }).then(function (_ref) {
        var data = _ref.data;
        var errors = _ref.errors;

        if (errors) {
          var message = errors[0].message;
          var error = new Error('GraphQL Error: ' + message);
          error.rawError = errors;

          throw error;
        }

        return data;
      });
    }
  }]);
  return Transport;
}(_transport2.default);

exports.default = Transport;