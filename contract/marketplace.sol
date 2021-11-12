// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

// Token Interface
interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);
  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
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
        uint price;
        uint sold;
		uint likes;
    }

    // Properties
    uint internal productsLength = 0;
  	uint internal fee ;	
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;
	address internal adminAddress ;
	

	mapping (uint => Product) internal products;
	mapping (address =>  mapping (uint => bool)) internal likedProduct;
    mapping (address =>  uint[]) public myProducts;

    modifier hasLiked(uint _index) {
        require(likedProduct[msg.sender][_index] != true, "You have already liked this product");
        _;
    }

	  modifier onlyProductOwner(uint _index) {
        require(products[_index].owner == msg.sender, "Only the owner can modify this price");
        _;
    }


	  modifier onlyOwner() {
        require(msg.sender == adminAddress, "Only the owner can modify this price");
        _;
    }

	constructor(){
		adminAddress = msg.sender;
		fee = 0;
	}


    // Write Product
	function writeProduct(
		string memory _name,
		string memory _image,
		string memory _description,
		string memory _location,
		uint _price
	) public {
		uint _sold = 0;
		uint _likes = 0;
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
	function modifyPrice(uint _index, uint _price) onlyProductOwner(_index) public {

		// charge user for modiying fee
		if(fee> 0){
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
    function getProductsLength() public view returns (uint) {
        return (productsLength);
    }

    // Read Product
	function readProduct(uint _index) public view returns (
		address payable,
		string memory,
		string memory,
		string memory,
		string memory,
		uint,
		uint
	) {
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

	// Buy Product
	function buyProduct(uint _index) public payable  {
		require(
		  IERC20Token(cUsdTokenAddress).transferFrom(
			msg.sender,
			products[_index].owner,
			products[_index].price
		  ),
		  "Transfer failed."
		);
		products[_index].sold++;
		     // save the product sold
        myProducts[msg.sender].push(_index);
	}
	

    function likeProduct(uint _index) hasLiked(_index) public  {
        products[_index].likes++;
    }


	function revokeOwnership(address _address) onlyOwner() public  {
       adminAddress = _address;
    }

	function setFee(uint _fee) onlyOwner() public {
		fee = _fee;
	}
}
