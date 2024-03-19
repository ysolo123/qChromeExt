let mostRecentRequest = null
let mostRecentBody = null
let startedReq = false

let artistBodyMap = new Map()
let artistHeaderMap = new Map()

var onBeforeSendHeadersListener = function(details) {
    console.log("REQUEST DETAILS ", details)
    mostRecentRequest = details
    if (mostRecentRequest && mostRecentBody && mostRecentBody.requestBody && mostRecentBody.requestBody.formData) {
        artistHeaderMap.set(mostRecentBody.requestBody.formData['data[Order][event_name]'][0], details)
    }
}

var onBeforeRequestListener = function(details) {
    console.log("BODY DETAILS ", details)
    if (details && details.requestBody && details.requestBody.formData) {
        mostRecentBody = details
        console.log(details.requestBody.formData)
        console.log(details.requestBody.formData['data[Order][event_name]'][0])
        artistBodyMap.set(details.requestBody.formData['data[Order][event_name]'][0], details)
    }
}

chrome.webRequest.onBeforeSendHeaders.addListener(onBeforeSendHeadersListener, {
    urls: ["https://tickets.qnightclub.com/orders/calculate_price"]
}, ["requestHeaders", "extraHeaders"]);

chrome.webRequest.onBeforeRequest.addListener(onBeforeRequestListener, {
    urls: ["https://tickets.qnightclub.com/orders/calculate_price"]
}, ["requestBody", "extraHeaders"]);

chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse) {
      if (request.message === "getBaseRequest" && mostRecentRequest != null && mostRecentBody != null) {
        console.log(request.artist)
        console.log(artistHeaderMap.get(request.artist))
        console.log(artistBodyMap.get(request.artist))
        sendResponse({request: artistHeaderMap.get(request.artist), body: artistBodyMap.get(request.artist)});
        return true;
      }
    }
  );

