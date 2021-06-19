// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.2;

/**
 * @dev Interface of the ERC20 standard as defined in the EIP.
 */
interface IERC20 {
    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function transfer(address recipient, uint256 amount)
        external
        returns (bool);

    function allowance(address owner, address spender)
        external
        view
        returns (uint256);

    function approve(address spender, uint256 amount) external returns (bool);

    function transferFrom(
        address sender,
        address recipient,
        uint256 amount
    ) external returns (bool);

    function permit(
        address target,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;

    function transferWithPermit(
        address target,
        address to,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (bool);

    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(
        address indexed owner,
        address indexed spender,
        uint256 value
    );
}

/**
 * @dev Interface of the ERC2612 standard as defined in the EIP.
 *
 * Adds the {permit} method, which can be used to change one's
 * {IERC20-allowance} without having to send a transaction, by signing a
 * message. This allows users to spend tokens without having to hold Ether.
 *
 * See https://eips.ethereum.org/EIPS/eip-2612.
 */
interface IERC2612 {
    /**
     * @dev Returns the current ERC2612 nonce for `owner`. This value must be
     * included whenever a signature is generated for {permit}.
     *
     * Every successful call to {permit} increases ``owner``'s nonce by one. This
     * prevents a signature from being used multiple times.
     */
    function nonces(address owner) external view returns (uint256);
}

/// @dev Wrapped ERC-20 v10 (AnyswapV3ERC20) is an ERC-20 ERC-20 wrapper. You can `deposit` ERC-20 and obtain an AnyswapV3ERC20 balance which can then be operated as an ERC-20 token. You can
/// `withdraw` ERC-20 from AnyswapV3ERC20, which will then burn AnyswapV3ERC20 token in your wallet. The amount of AnyswapV3ERC20 token in any wallet is always identical to the
/// balance of ERC-20 deposited minus the ERC-20 withdrawn with that specific wallet.
interface IDelfyERC20 is IERC20, IERC2612 {
    /// @dev Sets `value` as allowance of `spender` account over caller account's AnyswapV3ERC20 token,
    /// after which a call is executed to an ERC677-compliant contract with the `data` parameter.
    /// Emits {Approval} event.
    /// Returns boolean value indicating whether operation succeeded.
    /// For more information on approveAndCall format, see https://github.com/ethereum/EIPs/issues/677.
    function approveAndCall(
        address spender,
        uint256 value,
        bytes calldata data
    ) external returns (bool);

    /// @dev Moves `value` AnyswapV3ERC20 token from caller's account to account (`to`),
    /// after which a call is executed to an ERC677-compliant contract with the `data` parameter.
    /// A transfer to `address(0)` triggers an ERC-20 withdraw matching the sent AnyswapV3ERC20 token in favor of caller.
    /// Emits {Transfer} event.
    /// Returns boolean value indicating whether operation succeeded.
    /// Requirements:
    ///   - caller account must have at least `value` AnyswapV3ERC20 token.
    /// For more information on transferAndCall format, see https://github.com/ethereum/EIPs/issues/677.
    function transferAndCall(
        address to,
        uint256 value,
        bytes calldata data
    ) external returns (bool);
}

interface ITransferReceiver {
    function onTokenTransfer(
        address,
        uint256,
        bytes calldata
    ) external returns (bool);
}

interface IApprovalReceiver {
    function onTokenApproval(
        address,
        uint256,
        bytes calldata
    ) external returns (bool);
}

library Address {
    function isContract(address account) internal view returns (bool) {
        bytes32 codehash;
        bytes32 accountHash =
            0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470;
        // solhint-disable-next-line no-inline-assembly
        assembly {
            codehash := extcodehash(account)
        }
        return (codehash != 0x0 && codehash != accountHash);
    }
}

library SafeERC20 {
    using Address for address;

    function safeTransfer(
        IERC20 token,
        address to,
        uint256 value
    ) internal {
        callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transfer.selector, to, value)
        );
    }

    function safeTransferFrom(
        IERC20 token,
        address from,
        address to,
        uint256 value
    ) internal {
        callOptionalReturn(
            token,
            abi.encodeWithSelector(token.transferFrom.selector, from, to, value)
        );
    }

    function safeApprove(
        IERC20 token,
        address spender,
        uint256 value
    ) internal {
        require(
            (value == 0) || (token.allowance(address(this), spender) == 0),
            "SafeERC20: approve from non-zero to non-zero allowance"
        );
        callOptionalReturn(
            token,
            abi.encodeWithSelector(token.approve.selector, spender, value)
        );
    }

    function callOptionalReturn(IERC20 token, bytes memory data) private {
        require(address(token).isContract(), "SafeERC20: call to non-contract");

        // solhint-disable-next-line avoid-low-level-calls
        (bool success, bytes memory returndata) = address(token).call(data);
        require(success, "SafeERC20: low-level call failed");

        if (returndata.length > 0) {
            // Return data is optional
            // solhint-disable-next-line max-line-length
            require(
                abi.decode(returndata, (bool)),
                "SafeERC20: ERC20 operation did not succeed"
            );
        }
    }
}

contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes memory) {
        this; // silence state mutability warning without generating bytecode - see https://github.com/ethereum/solidity/issues/2691
        return msg.data;
    }
}

contract Pausable is Context {
    /**
     * @dev Emitted when the pause is triggered by `account`.
     */
    event Paused(address account);

    /**
     * @dev Emitted when the pause is lifted by `account`.
     */
    event Unpaused(address account);

    bool private _paused;

    /**
     * @dev Initializes the contract in unpaused state.
     */
    constructor() {
        _paused = false;
    }

    /**
     * @dev Returns true if the contract is paused, and false otherwise.
     */
    function paused() public view virtual returns (bool) {
        return _paused;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is not paused.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    modifier whenNotPaused() {
        require(!paused(), "Pausable: paused");
        _;
    }

    /**
     * @dev Modifier to make a function callable only when the contract is paused.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    modifier whenPaused() {
        require(paused(), "Pausable: not paused");
        _;
    }

    /**
     * @dev Triggers stopped state.
     *
     * Requirements:
     *
     * - The contract must not be paused.
     */
    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    /**
     * @dev Returns to normal state.
     *
     * Requirements:
     *
     * - The contract must be paused.
     */
    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

contract DelfyERC is Pausable, IDelfyERC20 {
    using SafeERC20 for IERC20;

    /// @dev Records amount of AnyswapV3ERC20 token owned by account.
    mapping(address => uint256) public override balanceOf;

    mapping(address => bool) public isMinter;
    mapping(address => bool) public isPendingMinter;
    mapping(address => uint256) public delayMinter;

    mapping(address => uint256) public override nonces;

    mapping(address => mapping(address => uint256)) public override allowance;

    string public constant name = "Delfy";
    string public constant symbol = "Delfy";
    uint8 public constant decimals = 18;

    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256(
            "EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"
        );
    bytes32 public constant PERMIT_TYPEHASH =
        keccak256(
            "Permit(address owner,address spender,uint256 value,uint256 nonce,uint256 deadline)"
        );
    bytes32 public constant TRANSFER_TYPEHASH =
        keccak256(
            "Transfer(address owner,address to,uint256 value,uint256 nonce,uint256 deadline)"
        );
    bytes32 public immutable DOMAIN_SEPARATOR;

    uint256 private _totalSupply;
    address public owner;

    // configurable delay for timelock functions
    uint256 public constant delay = 172_800;

    // set of minters, can be this bridge or other bridges

    address[] public minters;

    // uint public pendingDelay;
    // uint public delayDelay;

    uint256 public changeOwnerDelay;
    address public pendingOwner;

    modifier onlyAuth() {
        require(isMinter[msg.sender], "DelfyERC20: FORBIDDEN");
        _;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "DelfyERC20: FORBIDDEN");
        _;
    }
    event ChangeOwner(address sender, address newOwner);
    event RejectPendingOwner(address sender, address newOwner);
    event AcceptPendingOwner(address sender, address newOwner);

    function changeOwner(address _owner) external onlyOwner {
        pendingOwner = _owner;
        changeOwnerDelay = block.timestamp + delay;
        emit ChangeOwner(msg.sender, _owner);
    }

    function rejectPendingOwner() external onlyOwner {
        if (pendingOwner != address(0)) {
            pendingOwner = address(0);
            changeOwnerDelay = 0;
        }
        emit RejectPendingOwner(msg.sender, pendingOwner);
    }

    function acceptPendingOwner() external onlyOwner {
        if (changeOwnerDelay > 0 && pendingOwner != address(0)) {
            require(
                block.timestamp > changeOwnerDelay,
                "DelfyERC20: owner apply too early"
            );
            owner = pendingOwner;
            changeOwnerDelay = 0;
            pendingOwner = address(0);
        }
        emit AcceptPendingOwner(msg.sender, owner);
    }

    event SetMinter(address sender, address _minter);
    event ApplyMinter(address sender, address _minter);
    event RevokeMinter(address sender, address _minter);
    event RejectMinter(address sender, address _minter);

    function setMinter(address _minter) external onlyOwner {
        isPendingMinter[_minter] = true;
        delayMinter[_minter] = block.timestamp + delay;
        emit SetMinter(msg.sender, _minter);
    }

    function applyMinter(address _pendingMinter) external onlyOwner {
        require(
            isPendingMinter[_pendingMinter],
            "DelfyERC20: Not pending minter"
        );
        require(
            block.timestamp >= delayMinter[_pendingMinter],
            "DelfyERC20: apply minter too early"
        );
        isMinter[_pendingMinter] = true;
        isPendingMinter[_pendingMinter] = false;
        minters.push(_pendingMinter);
        emit ApplyMinter(msg.sender, _pendingMinter);
    }

    // No time delay revoke minter emergency function
    function revokeMinter(address _minter) external onlyOwner {
        isMinter[_minter] = false;
        emit RevokeMinter(msg.sender, _minter);
    }

    function rejectMinter(address _pendingMinter) external onlyOwner {
        isPendingMinter[_pendingMinter] = false;
        emit RejectMinter(msg.sender, _pendingMinter);
    }

    function getAllMinters() external view returns (address[] memory) {
        return minters;
    }

    function mint(address to, uint256 amount)
        external
        onlyAuth
        whenNotPaused
        returns (bool)
    {
        _mint(to, amount);
        return true;
    }

    function burn(address from, uint256 amount)
        external
        onlyAuth
        returns (bool)
    {
        require(from != address(0), "DelfyERC20: address(0x0)");
        _burn(from, amount);
        return true;
    }

    function Swapin(
        bytes32 txhash,
        address account,
        uint256 amount
    ) public onlyAuth whenNotPaused returns (bool) {
        _mint(account, amount);
        emit LogSwapin(txhash, account, amount);
        return true;
    }

    function Swapout(uint256 amount, address bindaddr)
        public
        whenNotPaused
        returns (bool)
    {
        require(bindaddr != address(0), "DelfyERC20: address(0x0)");
        _burn(msg.sender, amount);
        emit LogSwapout(msg.sender, bindaddr, amount);
        return true;
    }

    function pause() external onlyOwner {
        super._pause();
    }

    function unpause() external onlyOwner {
        super._unpause();
    }

    event LogSwapin(
        bytes32 indexed txhash,
        address indexed account,
        uint256 amount
    );
    event LogSwapout(
        address indexed account,
        address indexed bindaddr,
        uint256 amount
    );
    event LogAddAuth(address indexed auth, uint256 timestamp);

    constructor(address stakingContract) {
        owner = msg.sender;
        uint256 chainId = block.chainid;
        isMinter[msg.sender] = true;
        isMinter[stakingContract] = true;
        minters.push(msg.sender);
        minters.push(stakingContract);
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes(name)),
                keccak256(bytes("1")),
                chainId,
                address(this)
            )
        );
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function _mint(address account, uint256 amount) internal {
        require(account != address(0), "DelfyERC20: mint to the zero address");

        _totalSupply += amount;
        balanceOf[account] += amount;
        emit Transfer(address(0), account, amount);
    }

    function _burn(address account, uint256 amount) internal {
        require(
            account != address(0),
            "DelfyERC20: burn from the zero address"
        );

        balanceOf[account] -= amount;
        _totalSupply -= amount;
        emit Transfer(account, address(0), amount);
    }

    function approve(address spender, uint256 value)
        external
        override
        returns (bool)
    {
        // _approve(msg.sender, spender, value);
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);

        return true;
    }

    function approveAndCall(
        address spender,
        uint256 value,
        bytes calldata data
    ) external override returns (bool) {
        // _approve(msg.sender, spender, value);
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);

        IApprovalReceiver(spender).onTokenApproval(msg.sender, value, data);
        return true;
    }

    function permit(
        address source,
        address spender,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override {
        require(block.timestamp <= deadline, "DelfyERC20: Expired permit");

        bytes32 hashStruct =
            keccak256(
                abi.encode(
                    PERMIT_TYPEHASH,
                    source,
                    spender,
                    value,
                    nonces[source]++,
                    deadline
                )
            );

        require(
            verifyEIP712(source, hashStruct, v, r, s) ||
                verifyPersonalSign(source, hashStruct, v, r, s)
        );

        // _approve(owner, spender, value);
        allowance[source][spender] = value;
        emit Approval(source, spender, value);
    }

    function transferWithPermit(
        address source,
        address to,
        uint256 value,
        uint256 deadline,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external override returns (bool) {
        require(block.timestamp <= deadline, "DelfyERC20: Expired permit");

        bytes32 hashStruct =
            keccak256(
                abi.encode(
                    TRANSFER_TYPEHASH,
                    source,
                    to,
                    value,
                    nonces[source]++,
                    deadline
                )
            );

        require(
            verifyEIP712(source, hashStruct, v, r, s) ||
                verifyPersonalSign(source, hashStruct, v, r, s),
            "Invalid signature"
        );

        require(to != address(0) || to != address(this));

        uint256 balance = balanceOf[source];
        require(
            balance >= value,
            "DelfyERC20: transfer amount exceeds balance"
        );

        balanceOf[source] = balance - value;
        balanceOf[to] += value;
        emit Transfer(source, to, value);

        return true;
    }

    function verifyEIP712(
        address source,
        bytes32 hashStruct,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (bool) {
        bytes32 hash =
            keccak256(
                abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, hashStruct)
            );
        address signer = ecrecover(hash, v, r, s);
        return (signer != address(0) && signer == source);
    }

    function verifyPersonalSign(
        address source,
        bytes32 hashStruct,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) internal view returns (bool) {
        bytes32 hash = prefixed(hashStruct);
        address signer = ecrecover(hash, v, r, s);
        return (signer != address(0) && signer == source);
    }

    // Builds a prefixed hash to mimic the behavior of eth_sign.
    function prefixed(bytes32 hash) internal view returns (bytes32) {
        return
            keccak256(
                abi.encodePacked(
                    "\x19Ethereum Signed Message:\n32",
                    DOMAIN_SEPARATOR,
                    hash
                )
            );
    }

    /// @dev Moves `value` AnyswapV3ERC20 token from caller's account to account (`to`).
    /// A transfer to `address(0)` triggers an ETH withdraw matching the sent AnyswapV3ERC20 token in favor of caller.
    /// Emits {Transfer} event.
    /// Returns boolean value indicating whether operation succeeded.
    /// Requirements:
    ///   - caller account must have at least `value` AnyswapV3ERC20 token.
    function transfer(address to, uint256 value)
        external
        override
        returns (bool)
    {
        require(to != address(0) || to != address(this));
        uint256 balance = balanceOf[msg.sender];
        require(
            balance >= value,
            "DelfyERC20: transfer amount exceeds balance"
        );

        balanceOf[msg.sender] = balance - value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);

        return true;
    }

    /// @dev Moves `value` AnyswapV3ERC20 token from account (`from`) to account (`to`) using allowance mechanism.
    /// `value` is then deducted from caller account's allowance, unless set to `type(uint256).max`.
    /// A transfer to `address(0)` triggers an ETH withdraw matching the sent AnyswapV3ERC20 token in favor of caller.
    /// Emits {Approval} event to reflect reduced allowance `value` for caller account to spend from account (`from`),
    /// unless allowance is set to `type(uint256).max`
    /// Emits {Transfer} event.
    /// Returns boolean value indicating whether operation succeeded.
    /// Requirements:
    ///   - `from` account must have at least `value` balance of AnyswapV3ERC20 token.
    ///   - `from` account must have approved caller to spend at least `value` of AnyswapV3ERC20 token, unless `from` and caller are the same account.
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) external override returns (bool) {
        require(to != address(0) || to != address(this));
        if (from != msg.sender) {
            // _decreaseAllowance(from, msg.sender, value);
            uint256 allowed = allowance[from][msg.sender];
            if (allowed != type(uint256).max) {
                require(
                    allowed >= value,
                    "DelfyERC20: request exceeds allowance"
                );
                uint256 reduced = allowed - value;
                allowance[from][msg.sender] = reduced;
                emit Approval(from, msg.sender, reduced);
            }
        }

        uint256 balance = balanceOf[from];
        require(
            balance >= value,
            "DelfyERC20: transfer amount exceeds balance"
        );

        balanceOf[from] = balance - value;
        balanceOf[to] += value;
        emit Transfer(from, to, value);

        return true;
    }

    /// @dev Moves `value` AnyswapV3ERC20 token from caller's account to account (`to`),
    /// after which a call is executed to an ERC677-compliant contract with the `data` parameter.
    /// A transfer to `address(0)` triggers an ETH withdraw matching the sent AnyswapV3ERC20 token in favor of caller.
    /// Emits {Transfer} event.
    /// Returns boolean value indicating whether operation succeeded.
    /// Requirements:
    ///   - caller account must have at least `value` AnyswapV3ERC20 token.
    /// For more information on transferAndCall format, see https://github.com/ethereum/EIPs/issues/677.
    function transferAndCall(
        address to,
        uint256 value,
        bytes calldata data
    ) external override returns (bool) {
        require(
            to != address(0) || to != address(this),
            "Delfy: invalid addresss"
        );

        uint256 balance = balanceOf[msg.sender];
        require(
            balance >= value,
            "DelfyERC20: transfer amount exceeds balance"
        );

        balanceOf[msg.sender] = balance - value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);

        ITransferReceiver(to).onTokenTransfer(msg.sender, value, data);
        return true;
    }
}
