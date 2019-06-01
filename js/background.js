chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        fetch(request.url)
            .then(response => response.text())
            .then(response_text => sendResponse(response_text))
            .catch(error => console.log(error));
        return true;
    }
);
