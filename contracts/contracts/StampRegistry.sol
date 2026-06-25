// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface ILitPass {
    function hasPass(address user) external view returns (bool);
}

/**
 * @title StampRegistry
 * @notice Open registry where authorized issuers (dApps) can grant stamps to
 *         users who hold a LitPass. A stamp is a tiny piece of evidence ("you
 *         used WheelX", "you bridged from BTC", etc.) tied to a wallet.
 * @dev    Stamps are append-only; one user can hold at most one stamp per
 *         (issuer, stampKey). Anyone can read; only issuers can write.
 */
contract StampRegistry is Ownable {
    // --- Errors --------------------------------------------------------------
    error NotIssuer();
    error AlreadyHolder();
    error PassRequired();
    error ZeroAddress();
    error UnknownStamp();

    // --- Events --------------------------------------------------------------
    event IssuerAdded(address indexed issuer, string name);
    event IssuerRemoved(address indexed issuer);
    event StampDefined(bytes32 indexed stampId, address indexed issuer, string name);
    event StampIssued(bytes32 indexed stampId, address indexed to, address indexed issuer, uint64 timestamp);
    event StampRevoked(bytes32 indexed stampId, address indexed from, address indexed issuer);

    // --- Storage -------------------------------------------------------------
    struct StampMeta {
        address issuer;
        string name;
        string description;
        string imageURI;
        bool exists;
    }

    ILitPass public immutable litPass;

    /// @notice issuer => human-readable label
    mapping(address => string) public issuers;
    mapping(address => bool) public isIssuer;

    /// @notice stampId => metadata. stampId = keccak256(issuer, keyString)
    mapping(bytes32 => StampMeta) public stamps;

    /// @notice user holds a given stamp
    mapping(bytes32 => mapping(address => uint64)) public holdersAt; // 0 = no, else timestamp

    /// @notice per-user list of stamps (append-only, may contain revoked).
    mapping(address => bytes32[]) private _userStamps;

    constructor(address initialOwner, ILitPass _litPass) Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        if (address(_litPass) == address(0)) revert ZeroAddress();
        litPass = _litPass;
    }

    // --- Admin: issuer management -------------------------------------------
    function addIssuer(address issuer, string calldata name) external onlyOwner {
        if (issuer == address(0)) revert ZeroAddress();
        isIssuer[issuer] = true;
        issuers[issuer] = name;
        emit IssuerAdded(issuer, name);
    }

    function removeIssuer(address issuer) external onlyOwner {
        isIssuer[issuer] = false;
        emit IssuerRemoved(issuer);
    }

    // --- Stamp definition ---------------------------------------------------
    /**
     * @notice Define a new stamp under the caller (must be an authorized issuer).
     * @return stampId Unique id derived from issuer + key.
     */
    function defineStamp(
        string calldata key,
        string calldata name,
        string calldata description,
        string calldata imageURI
    ) external returns (bytes32 stampId) {
        if (!isIssuer[msg.sender]) revert NotIssuer();
        stampId = keccak256(abi.encodePacked(msg.sender, key));
        stamps[stampId] = StampMeta({
            issuer: msg.sender,
            name: name,
            description: description,
            imageURI: imageURI,
            exists: true
        });
        emit StampDefined(stampId, msg.sender, name);
    }

    // --- Issue / revoke -----------------------------------------------------
    function issue(bytes32 stampId, address to) external {
        StampMeta memory meta = stamps[stampId];
        if (!meta.exists) revert UnknownStamp();
        if (meta.issuer != msg.sender) revert NotIssuer();
        if (!litPass.hasPass(to)) revert PassRequired();
        if (holdersAt[stampId][to] != 0) revert AlreadyHolder();

        uint64 nowTs = uint64(block.timestamp);
        holdersAt[stampId][to] = nowTs;
        _userStamps[to].push(stampId);
        emit StampIssued(stampId, to, msg.sender, nowTs);
    }

    function revoke(bytes32 stampId, address from) external {
        StampMeta memory meta = stamps[stampId];
        if (!meta.exists) revert UnknownStamp();
        if (meta.issuer != msg.sender) revert NotIssuer();
        if (holdersAt[stampId][from] == 0) return;

        delete holdersAt[stampId][from];
        emit StampRevoked(stampId, from, msg.sender);
    }

    // --- Views --------------------------------------------------------------
    function holds(bytes32 stampId, address user) external view returns (bool) {
        return holdersAt[stampId][user] != 0;
    }

    function userStampCount(address user) external view returns (uint256) {
        return _userStamps[user].length;
    }

    function userStampAt(address user, uint256 index) external view returns (bytes32) {
        return _userStamps[user][index];
    }

    /**
     * @notice Return all stampIds a user has ever been issued (including revoked).
     *         Use `holds(stampId, user)` to filter live stamps.
     */
    function userStamps(address user) external view returns (bytes32[] memory) {
        return _userStamps[user];
    }

    function stampIdOf(address issuer, string calldata key) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(issuer, key));
    }
}
