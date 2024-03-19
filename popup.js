var artistName = document.getElementById('event-name').children[0].innerHTML;
console.log(artistName)

var prefixes = ['WP']
var percents = ['50']

var determinedPromoCodes = false

function loopRequest() {
  requestLatestInfo()
  if (!determinedPromoCodes) {
    setTimeout(loopRequest, 5000)
  }
}

function generateAllStringCombosUpToSizeLimit(charArray, currentString, allCombos, index, sizeLimit) {
  if (allCombos.size > sizeLimit) { 
    return
  }
  if (index == charArray.length) {
    // All codes seen so far at 5 characters
    if (currentString.length >= 4) {
      allCombos.add(currentString)
    }
    return
  }

  generateAllStringCombosUpToSizeLimit(charArray, currentString + charArray[index], allCombos, index + 1)
  generateAllStringCombosUpToSizeLimit(charArray, currentString, allCombos, index + 1)
}

function requestLatestInfo() {
  chrome.runtime.sendMessage({message: "getBaseRequest", artist: artistName}, function(response) {
    
    console.log("MAKE REQUESTS")
    console.log(response)

    if (determinedPromoCodes) {
      console.log("PROMO CODES ALREADY DETERMINED")
      return;
    }

    if (!response) {
      console.log("WAITING FOR RESPONSE DATA")
      return;
    }

    let baseRequest = response.request;
    let baseRequestUrl = baseRequest.url;
    let baseBody = response.body;

    if (!baseBody.requestBody || !baseBody.requestBody.formData) {
      console.log("NO FORM DATA YET")
      return;
    }

    artistName = artistName.replace(/[^a-zA-Z0-9]/g, "")

    let artistNameAsArray = Array.from(artistName)

    let allArtistCombos = new Set()
    if (artistName.length <= 9) {
      generateAllStringCombosUpToSizeLimit(artistNameAsArray, "", allArtistCombos, 0, 150)
    } 

    let baseStr = ""
    for (let i = 0; i < artistNameAsArray.length; i++) {
      baseStr += artistNameAsArray[i]
      allArtistCombos.add(baseStr)
    }

    let allArtistCombosArray = Array.from(allArtistCombos)

    let headers = {};
    for(let header of baseRequest.requestHeaders) {
      headers[header.name] = header.value;
    }
    
    determinedPromoCodes = true

    let foundSet = new Set()

    // make several requests with varying data
    alert("STARTING PROMO CODE SEARCH")
    var delayTimeMs = 1000
    for (var j = 0; j < prefixes.length; j++) {
      for (var i = 0; i < allArtistCombosArray.length; i++) {
        for (var k = 0; k < percents.length; k++) {
          const copyJ = j
          const copyI = i
          const copyK = k
          setTimeout(
            () => {
              let currentPromoCode = prefixes[copyJ] + allArtistCombosArray[copyI] + percents[copyK]
              let formData = new URLSearchParams();
              for (let key in baseBody.requestBody.formData) {
                if (key.indexOf('PromoCode') > -1) {
                  formData.append(key, currentPromoCode);
                } else {
                  formData.append(key, baseBody.requestBody.formData[key]);
                }
              }
      
              let newRequestUrl = baseRequestUrl;
              fetch(newRequestUrl, {
                method: baseRequest.method,
                headers: headers,
                body: formData.toString(),
                referrerPolicy: 'strict-origin-when-cross-origin',
                credentials: "same-origin"
              })
              .then(response => {
                return response.text();
              })
              .then(data => {
                const jsonBlob = JSON.parse(data)
                console.log(jsonBlob.promoCodeMessage)
                if (jsonBlob 
                    && (jsonBlob.promoCodeMessage.indexOf("Promo code accepted") > -1 
                        || jsonBlob.promoCodeMessage.indexOf("Does not apply") > -1)) {
                  if (!foundSet.has(currentPromoCode)) {
                    alert("PROMO CODE VALID " + currentPromoCode)
                    console.log("CORRECT PROMO CODE ", currentPromoCode)
                    var promoBox = document.getElementById('promo_field_sm')
                    if (promoBox) {
                      promoBox.value = currentPromoCode
                    }
                    var promoBox2 = document.getElementById('promo_field')
                    if (promoBox2) {
                      promoBox2.value = currentPromoCode
                    }
                    foundSet.add(currentPromoCode)
                  }
                } else {
                  console.log("INVALID PROMO CODE ", currentPromoCode)
                }
              })
              .catch(error => console.error('Error:', error));
              if (copyJ == prefixes.length - 1 && copyI == allArtistCombosArray.length - 1 && copyK == percents.length - 1) {
                const numberCombinations = prefixes.length * allArtistCombosArray.length * percents.length
                alert("TESTED A SET OF POTENTIAL " + numberCombinations.toString() + " PROMO CODES")
              }
            }, delayTimeMs
          )
          delayTimeMs += 750 + Math.random() * 500
        }
      }
    }
  });
}

loopRequest()