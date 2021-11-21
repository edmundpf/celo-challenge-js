// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

// Token Interface
interface IERC20Token {
	function transfer(address, uint256) external returns (bool);
	function approve(address, uint256) external returns (bool);
	function transferFrom(
		address,
		address,
		uint256
	) external returns (bool);
	function totalSupply() external view returns (uint256);
	function balanceOf(address) external view returns (uint256);
	function allowance(address, address) external view returns (uint256);
	event Transfer(address indexed from, address indexed to, uint256 value);
	event Approval(
		address indexed owner,
		address indexed spender,
		uint256 value
	);
}

// Marketplace Contract
contract Marketplace {
	// Product Struct
	struct Product {
		address payable owner;
		string name;
		string image;
		string description;
		string location;
		uint256 price;
		uint256 sold;
		uint256 likes;
	}

	// Properties
	uint256 internal fee;
	uint256 internal productsLength = 0;
	address internal cUsdTokenAddress =
		0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
	address internal adminAddress;

	// Mappings
	mapping(uint256 => Product) internal products;
	mapping(address => mapping(uint256 => bool)) internal likedProduct;
	mapping(address => uint256[]) public myProducts;

	// Constructor
	constructor() {
		adminAddress = msg.sender;
		fee = 0;
	}

	// Only Owner
	modifier onlyOwner() {
		require(
			msg.sender == adminAddress,
			"Only the owner can modify this price"
		);
		_;
	}

	// Only Product Owner
	modifier onlyProductOwner(uint256 _index) {
		require(
			products[_index].owner == msg.sender,
			"Only the owner can modify this price"
		);
		_;
	}

	// Has Liked
	modifier hasLiked(uint256 _index) {
		require(
			likedProduct[msg.sender][_index] != true,
			"You have already liked this product"
		);
		_;
	}

	// Write Product
	function writeProduct(
		string memory _name,
		string memory _image,
		string memory _description,
		string memory _location,
		uint256 _price
	) public {
		uint256 _sold = 0;
		uint256 _likes = 0;
		products[productsLength] = Product(
			payable(msg.sender),
			_name,
			_image,
			_description,
			_location,
			_price,
			_sold,
			_likes
		);
		productsLength++;
	}

	// Modify Price
	function modifyPrice(uint256 _index, uint256 _price)
		public
		onlyProductOwner(_index)
	{
		// Charge User for modifying fee
		if (fee > 0) {
			require(
				IERC20Token(cUsdTokenAddress).transferFrom(
					msg.sender,
					adminAddress,
					fee
				),
				"Transfer failed."
			);
		}
		products[_index].price = _price;
	}

	// Get Products Length
	function getProductsLength() public view returns (uint256) {
		return (productsLength);
	}

	// Read Product
	function readProduct(uint256 _index)
		public
		view
		returns (
			address payable,
			string memory,
			string memory,
			string memory,
			string memory,
			uint256,
			uint256
		)
	{
		return (
			products[_index].owner,
			products[_index].name,
			products[_index].image,
			products[_index].description,
			products[_index].location,
			products[_index].price,
			products[_index].sold
		);
	}

	// Read Product Likes Info

	function readProductLikesInfo(uint256 _index)
		public
		view
		returns (
			uint256,
			bool
		)
	{
		return (
			products[_index].likes,
			likedProduct[msg.sender][_index]
		);
	}

	// Buy Product
	function buyProduct(uint256 _index) public payable {
		require(
			IERC20Token(cUsdTokenAddress).transferFrom(
				msg.sender,
				products[_index].owner,
				products[_index].price
			),
			"Transfer failed."
		);
		products[_index].sold++;

		// Save sold product
		myProducts[msg.sender].push(_index);
	}

	// Revoke Ownership
	function revokeOwnership(address _address) public onlyOwner {
		adminAddress = _address;
	}

	// Like Product
	function likeProduct(uint256 _index) public hasLiked(_index) {
		likedProduct[msg.sender][_index] = true;
		products[_index].likes++;
	}

	// Set Fee
	function setFee(uint256 _fee) public onlyOwner {
		fee = _fee;
	}
}
