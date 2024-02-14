chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
	renderHistory()
	renderInfo()
})

document.addEventListener("DOMContentLoaded", function() {
	renderHistory()
	renderInfo()
	document.getElementById("start-button").addEventListener("click", function() {
		chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
			chrome.storage.local.set({ startTime: tabs[0].lastAccessed }, function () {})
			renderHistory()
			renderInfo()
		})
	})
	document.getElementById("stop-button").addEventListener("click", function() {
		chrome.storage.local.set({ startTime: undefined }, function () {})
	})
	document.getElementById("share-button").addEventListener("click", function() {
		shareData()
	})
})

function shareData() {
	chrome.storage.local.get(["startTime", "history"], function(result) {
		let tabsHistory = result.history
		let startTime = result.startTime
		let name = document.getElementById("name").value
		let roll_number = document.getElementById("roll_number").value
		let timeTaken = undefined
		if (tabsHistory !== undefined && tabsHistory.length !== 0) {
			timeTaken = (tabsHistory[0].time - tabsHistory.at(-1).time)/1000
		}
		let hops = tabsHistory.length
		let tmp = ""
		tabsHistory.forEach(function (page) {
			tmp = tmp + page.url + " "
		})
		let data = {
            name: name,
            roll_number: roll_number,
            time_taken: timeTaken,
            hops: hops,
            history: tmp
        }
		console.log(data)
		fetch('http://192.168.226.142:5000/submit', {
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify({data: data})
		})
			.then(response => response.json())
			.then(data => console.log('Success:', data))
			.catch((error) => console.error('Error:', error))
	})
}

function renderInfo() {
	chrome.storage.local.get(["startTime", "history"], function(result) {
		let tabsHistory = result.history
		let startTime = result.startTime
		if (tabsHistory !== undefined && tabsHistory.length !== 0) {
			let timeTaken = (tabsHistory[0].time - tabsHistory.at(-1).time)/1000
			document.getElementById("time-taken-container").innerText = `Time Taken: ${timeTaken.toFixed(2)} secs`
			document.getElementById("hops-container").innerText = `Hops: ${tabsHistory.length}`
		}
	})
}

function renderHistory(history) {
	chrome.storage.local.get(["startTime"], function(result) {
		let startTime = result.startTime	
		chrome.history.search({ text: "*wikipedia*", maxResults: 1000, startTime: startTime }, function(data) {
			let tabsHistory = []
			let historyContainer = document.getElementById("history-container")
			historyContainer.innerHTML = ""
			data.forEach(function(page) {
				let toPush = true
				if (tabsHistory.length !== 0) {
					let lastPage = tabsHistory.at(-1)
					if (lastPage.title === page.title && lastPage.url === page.url) {
						toPush = false
					}
				}
				if (toPush) {
					tabsHistory.push({ time: page.lastVisitTime, title: page.title, url: page.url })
				}
			})
			for (let i = 0; i < tabsHistory.length; ++i) {
				let page = tabsHistory[i]
				let a = document.createElement("a")
				a.href = page.url
				a.className = "list-group-item list-group-item-action"
				if (i == 0) {
					a.className = "list-group-item list-group-item-action active"
				}
				a.setAttribute("aria-current", "true")
				let div = document.createElement("div")
				div.className = "d-flex w-100 justify-content-between"
				let h5 = document.createElement("h5")
				div.innerText = page.title
				div.appendChild(h5)
				a.appendChild(div)
				historyContainer.appendChild(a)
			}
			chrome.storage.local.set({history: tabsHistory}, function() {})
		})
	})
}
