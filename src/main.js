import Web3 from 'web3'
import BigNumber from "bignumber.js"
import erc20Abi from "../contract/erc20.abi.json"
import marketplaceAbi from '../contract/marketplace.abi.json'
import { newKitFromWeb3 } from '@celo/contractkit'

/**
 * Constants
 */

const ERC20_DECIMALS = 18
const MPContractAddress = "0xad86B4A5B48DD1F4A3c43D018575EDF3f1329457"
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1"
const toggleProperties = ['name', 'img', 'desc', 'loc']

/**
 * Properties
 */

let kit
let contract
let products = []
let isAddMode = true
let modifyIndex = 0

/**
 * Connect Celo Wallet
 */

const connectCeloWallet = async function () {
	if (window.celo) {
		try {
			notification("⚠️ Please approve this DApp to use it.")
			await window.celo.enable()
			notificationOff()
			const web3 = new Web3(window.celo)
			kit = newKitFromWeb3(web3)

			const accounts = await kit.web3.eth.getAccounts()
			kit.defaultAccount = accounts[0]

			contract = new kit.web3.eth.Contract(marketplaceAbi, MPContractAddress)
		} catch (error) {
			notification(`⚠️ ${error}.`)
		}
	} else {
		notification("⚠️ Please install the CeloExtensionWallet.")
	}
}

/**
 * Get Products
 */

const getProducts = async function () {
	const _productsLength = await contract.methods.getProductsLength().call()
	const _products = []
	for (let i = 0; i < _productsLength; i++) {
		let _product = new Promise(async (resolve, reject) => {
			let p = await contract.methods.readProduct(i).call()
			resolve({
				index: i,
				owner: p[0],
				name: p[1],
				image: p[2],
				description: p[3],
				location: p[4],
				price: new BigNumber(p[5]),
				sold: p[6],
			})
		})
		_products.push(_product)
	}
	products = await Promise.all(_products)
	renderProducts()
}

/**
 * Get Balance
 */

const getBalance = async function () {
	const balanceInfo = await kit.getTotalBalance(kit.defaultAccount)
	const balance = getReadableTokenAmount(balanceInfo.cUSD)
	document.querySelector("#balance").textContent = balance
}

/**
 * Render Products
 */

function renderProducts() {
	document.getElementById("marketplace").innerHTML = ""
	products.forEach((_product) => {
		const newDiv = document.createElement("div")
		newDiv.className = "col-md-4"
		newDiv.innerHTML = productTemplate(_product)
		document.getElementById("marketplace").appendChild(newDiv)
	})
}

/**
 * Product Template
 */

function productTemplate(_product) {
	return `
		<div class="card mb-4">
			<img class="card-img-top" src="${_product.image}" alt="...">
			<div class="position-absolute top-0 end-0 bg-warning mt-4 px-2 py-1 rounded-start">
				${_product.sold} Sold
			</div>
			<div class="card-body text-left p-4 position-relative">
				<div class="translate-middle-y position-absolute top-0">
				${identiconTemplate(_product.owner)}
				</div>
				<h2 class="card-title fs-4 fw-bold mt-2">${_product.name}</h2>
				<p class="card-text mb-4" style="min-height: 82px">
					${_product.description}
				</p>
				<p class="card-text mt-4">
					<i class="bi bi-geo-alt-fill"></i>
					<span>${_product.location}</span>
				</p>
				<div class="d-grid gap-2">
					<a class="btn btn-lg btn-outline-dark product-btn buyBtn fs-6 p-3" id=${_product.index}>
						Buy for ${getReadableTokenAmount(_product.price)} cUSD
					</a>
				</div>
				<div class="d-grid gap-2">
					<a class="btn btn-lg btn-outline-dark modifyBtn fs-6 p-3" id=${_product.index} data-bs-toggle="modal" data-bs-target="#addModal">
						Modify Price
					</a>
				</div>
			</div>
		</div>
	`
}

/**
 * Identicon Template
 */

function identiconTemplate(_address) {
	const icon = blockies
		.create({
			seed: _address,
			size: 8,
			scale: 16,
		})
		.toDataURL()
	return `
	<div class="rounded-circle overflow-hidden d-inline-block border border-white border-2 shadow-sm m-0">
		<a href="https://alfajores-blockscout.celo-testnet.org/address/${_address}/transactions"
			target="_blank">
			<img src="${icon}" width="48" alt="${_address}">
		</a>
	</div>
	`
}

/**
 * Get Readable Token Amount
 */

function getReadableTokenAmount(bigNum) {
	return bigNum.shiftedBy(-ERC20_DECIMALS).toFixed(2)
}

/**
 * Get Big Number Amount
 */

function getBigNumberAmount(amount) {
	return new BigNumber(amount)
		.shiftedBy(ERC20_DECIMALS)
		.toString()
}

/**
 * Notification
 */

function notification(_text) {
	document.querySelector(".alert").style.display = "block"
	document.querySelector("#notification").textContent = _text
}

/**
 * Notification Off
 */

function notificationOff() {
	document.querySelector(".alert").style.display = "none"
}

/**
 * Hide Element
 */

function hideElement(id) {
	const elem = document.querySelector(`#${id}`)
	elem.style.display = "none"
}

/**
 * Show Element
 */

function showElement(id) {
	const elem = document.querySelector(`#${id}`)
	elem.style.display = "block"
}

/**
 * Edit Modal
 */

function editModal(labelText, buttonText) {
	const labelElem = document.querySelector('#newProductModalLabel')
	const buttonElem = document.querySelector('#newProductBtn')
	labelElem.textContent = labelText
	buttonElem.textContent = buttonText
}

/**
 * Modify Price Event
 */

function modifyPriceEvent() {
	isAddMode = false
	const name = products[modifyIndex].name
	editModal(`Modify "${name}" Price`, 'Save price')
	for (const property of toggleProperties) {
		hideElement(`prod-${property}`)
	}
}

/**
 * Add Product Event
 */

function addProductEvent() {
	isAddMode = true
	editModal('New Product', 'Add product')
	for (const property of toggleProperties) {
		showElement(`prod-${property}`)
	}
}

/**
 * Approve
 */

async function approve(_price) {
	const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress)
	const result = await cUSDContract.methods
		.approve(MPContractAddress, _price)
		.send({ from: kit.defaultAccount })
	return result
}

/**
 * Load Event Listener
 */

window.addEventListener('load', async () => {
	notification("⌛ Loading...")
	await connectCeloWallet()
	await getBalance()
	await getProducts()
	notificationOff()
})

/**
 * New Product Button Listener
 */

document
	.querySelector("#newProductBtn")
	.addEventListener("click", async (e) => {

		// Add Product
		if (isAddMode) {
			const params = [
				document.getElementById("newProductName").value,
				document.getElementById("newImgUrl").value,
				document.getElementById("newProductDescription").value,
				document.getElementById("newLocation").value,
				getBigNumberAmount(document.getElementById("newPrice").value)
			]
			notification(`⌛ Adding "${params[0]}"...`)
			try {
				await contract.methods
					.writeProduct(...params)
					.send({ from: kit.defaultAccount })
			} catch (error) {
				notification(`⚠️ ${error}.`)
			}
			notification(`🎉 You successfully added "${params[0]}".`)
			getProducts()
		}

		// Modify Price
		else {
			const name = products[modifyIndex].name
			const params = [
				modifyIndex,
				getBigNumberAmount(document.getElementById("newPrice").value)
			]
			notification(`⌛ Modifying "${name}" price...`)
			try {
				await contract.methods
					.modifyPrice(...params)
					.send({ from: kit.defaultAccount })
			} catch (error) {
				notification(`⚠️ ${error}.`)
			}
			notification(`🎉 You successfully modified "${name}" price.`)
			getProducts()
		}
	})

/**
 * Add Product Button Listener
 */

document
	.querySelector("#addProductBtn")
	.addEventListener("click", addProductEvent)

/**
 * Main Row Click
 */

document.querySelector("#marketplace").addEventListener("click", async (e) => {

	// Buy Buttons
	if (e.target.className.includes("buyBtn")) {
		const index = e.target.id
		notification("⌛ Waiting for payment approval...")
		try {
			await approve(products[index].price)
		} catch (error) {
			notification(`⚠️ ${error}.`)
		}
		notification(`⌛ Awaiting payment for "${products[index].name}"...`)
		try {
			await contract.methods
				.buyProduct(index)
				.send({ from: kit.defaultAccount })
			notification(`🎉 You successfully bought "${products[index].name}".`)
			getProducts()
			getBalance()
		} catch (error) {
			notification(`⚠️ ${error}.`)
		}
	}

	// Modify Buttons
	else if (e.target.className.includes("modifyBtn")) {
		modifyIndex = Number(e.target.id)
		modifyPriceEvent()
	}
})
