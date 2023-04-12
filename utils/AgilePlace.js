import { sleep } from "./helpers";

class AgilePlace {
	constructor(url, username, password, key) {
		this.url = url;
		this.username = username;
		this.password = password;
		this.key = key;

	}

	async xfr(params) {

		params.baseUrl = "https://" + this.url + "/io"

		var headers = { "Accept": "application/json" };
		if (params.type) {
			headers["Content-type"] = params.type;
		} else {
			headers["Content-type"] = "application/json";
		}
		if (this.key) {
			headers["Authorization"] = "Bearer " + this.key;
		}
		else {
			var Base64 = { _keyStr: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=", encode: function (e) { var t = ""; var n, r, i, s, o, u, a; var f = 0; e = Base64._utf8_encode(e); while (f < e.length) { n = e.charCodeAt(f++); r = e.charCodeAt(f++); i = e.charCodeAt(f++); s = n >> 2; o = (n & 3) << 4 | r >> 4; u = (r & 15) << 2 | i >> 6; a = i & 63; if (isNaN(r)) { u = a = 64 } else if (isNaN(i)) { a = 64 } t = t + this._keyStr.charAt(s) + this._keyStr.charAt(o) + this._keyStr.charAt(u) + this._keyStr.charAt(a) } return t }, decode: function (e) { var t = ""; var n, r, i; var s, o, u, a; var f = 0; e = e.replace(/[^A-Za-z0-9\+\/\=]/g, ""); while (f < e.length) { s = this._keyStr.indexOf(e.charAt(f++)); o = this._keyStr.indexOf(e.charAt(f++)); u = this._keyStr.indexOf(e.charAt(f++)); a = this._keyStr.indexOf(e.charAt(f++)); n = s << 2 | o >> 4; r = (o & 15) << 4 | u >> 2; i = (u & 3) << 6 | a; t = t + String.fromCharCode(n); if (u != 64) { t = t + String.fromCharCode(r) } if (a != 64) { t = t + String.fromCharCode(i) } } t = Base64._utf8_decode(t); return t }, _utf8_encode: function (e) { e = e.replace(/\r\n/g, "\n"); var t = ""; for (var n = 0; n < e.length; n++) { var r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r) } else if (r > 127 && r < 2048) { t += String.fromCharCode(r >> 6 | 192); t += String.fromCharCode(r & 63 | 128) } else { t += String.fromCharCode(r >> 12 | 224); t += String.fromCharCode(r >> 6 & 63 | 128); t += String.fromCharCode(r & 63 | 128) } } return t }, _utf8_decode: function (e) { var t = ""; var n = 0; var r = c1 = c2 = 0; while (n < e.length) { r = e.charCodeAt(n); if (r < 128) { t += String.fromCharCode(r); n++ } else if (r > 191 && r < 224) { c2 = e.charCodeAt(n + 1); t += String.fromCharCode((r & 31) << 6 | c2 & 63); n += 2 } else { c2 = e.charCodeAt(n + 1); c3 = e.charCodeAt(n + 2); t += String.fromCharCode((r & 15) << 12 | (c2 & 63) << 6 | c3 & 63); n += 3 } } return t } }
			var token = this.username + ":" + this.password;
			headers["Authorization"] = "Basic " + Base64.encode(token);
		}

		var req = new Request(params.baseUrl + params.url, { headers: headers, method: params.mode });
		const res = await fetch(req).then(
			async (response) => {
				if (!response.ok) {
					var statusCode = response.status;
					switch (statusCode) {
						case 400:
						case 401:
						case 403:
						case 404:
						case 405:
						case 409: {
							console.log(`${response.statusText} for URL: ${response.url}`)
							break;
						}
						case 422: {
							console.log(`${response.statusText}: ${response.text()}`)
						}
						case 429: {
							var serverTime = new Date(response.headers.get("date"))
							var waitTime = new Date(response.headers.get("retry-after"))
							var timeDelay = waitTime.getTime() - serverTime.getTime();
							console.log(`Hit transaction limit. Delaying for: ${timeDelay / 1000} secs`)
							await sleep(timeDelay);
						}

						//Fall-thru

						case 408: // Request timeout - try your luck with another one....
						case 500: // Server fault
						case 502: // Bad Gateway
						case 503: // Service unavailable
						case 504: // Gateway timeout
							{
								console.log(`${response.statusText} for URL: ${response.url}`)
								/** 
								 * Try once more, if not then fail out with a null return
								 */
								var req2 = new Request(params.baseUrl + params.url, { headers: headers, method: params.mode });
								var res2 = await fetch(req2).then(
									(resp2) => {
										if (resp2.ok) {
											return resp2;
										}
										console.log(`Failed on retry of access to ${response.url}`)
										return null;
									}
								)
								return res2;
							}
					}
					return null;
				}

				return response
			}
		)
		var data = null;
		if (res)
			data = await res.json()
		return data;
	}

}

export default AgilePlace;