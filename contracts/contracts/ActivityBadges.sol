// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";
import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

interface ILitPassHasPass {
    function hasPass(address user) external view returns (bool);
}

/**
 * @title ActivityBadges
 * @notice Soulbound ERC-1155 badges minted when a user proves on-chain activity
 *         on LitVM (tx count, contracts deployed, wallet age, etc.).
 *
 *         Verification model: a backend reads chain history for the caller,
 *         signs an EIP-712 attestation ("you have value V for badge B"), and
 *         the user submits that signature here to mint the badge.
 *
 *         The trusted signer is set by the contract owner. Anyone can verify
 *         signed claims on-chain - no extra trust needed beyond knowing who
 *         the signer is.
 */
contract ActivityBadges is ERC1155, Ownable, EIP712 {
    using Strings for uint256;

    // --- Errors --------------------------------------------------------------
    error NoPassport();
    error AlreadyClaimed();
    error UnknownBadge();
    error InsufficientValue();
    error ClaimExpired();
    error BadSignature();
    error NonceUsed();
    error SoulboundNonTransferable();
    error ZeroAddress();

    // --- Events --------------------------------------------------------------
    event BadgeDefined(uint256 indexed id, string name, ActivityType activity, uint256 threshold);
    event BadgeClaimed(address indexed user, uint256 indexed id, uint256 measuredValue);
    event SignerUpdated(address indexed newSigner);

    // --- Types --------------------------------------------------------------
    enum ActivityType {
        TxCount,            // total transactions sent
        ContractsDeployed,  // number of contracts deployed
        UniqueContracts,    // unique contracts interacted with
        WalletAgeDays,      // days since first transaction
        ActiveDays          // unique days with at least one transaction
    }

    struct Badge {
        string name;
        string description;
        string color;
        ActivityType activity;
        uint256 threshold;
        bool exists;
    }

    // EIP-712 typed data: keccak("Claim(address user,uint256 badgeId,uint256 measuredValue,uint256 nonce,uint256 expiresAt)")
    bytes32 private constant CLAIM_TYPEHASH =
        keccak256("Claim(address user,uint256 badgeId,uint256 measuredValue,uint256 nonce,uint256 expiresAt)");

    // --- Storage ------------------------------------------------------------
    ILitPassHasPass public immutable litPass;
    address public signer;

    mapping(uint256 => Badge) public badges;
    uint256 public badgeCount;
    mapping(bytes32 => bool) public usedNonces;

    // --- Constructor --------------------------------------------------------
    constructor(address initialOwner, ILitPassHasPass _litPass, address _signer)
        ERC1155("")
        Ownable(initialOwner)
        EIP712("LitPass.ActivityBadges", "1")
    {
        if (initialOwner == address(0)) revert ZeroAddress();
        if (address(_litPass) == address(0)) revert ZeroAddress();
        if (_signer == address(0)) revert ZeroAddress();
        litPass = _litPass;
        signer = _signer;
        emit SignerUpdated(_signer);
        _seedDefaultBadges();
    }

    // --- Admin --------------------------------------------------------------
    function setSigner(address newSigner) external onlyOwner {
        if (newSigner == address(0)) revert ZeroAddress();
        signer = newSigner;
        emit SignerUpdated(newSigner);
    }

    function defineBadge(
        string memory name,
        string memory description,
        string memory color,
        ActivityType activity,
        uint256 threshold
    ) public onlyOwner returns (uint256 id) {
        unchecked { id = ++badgeCount; }
        badges[id] = Badge({
            name: name,
            description: description,
            color: color,
            activity: activity,
            threshold: threshold,
            exists: true
        });
        emit BadgeDefined(id, name, activity, threshold);
    }

    function _seedDefaultBadges() internal {
        // Transactor - TX count milestones (reachable, not bot-only)
        defineBadge("Newcomer",  "10+ transactions on LitVM.",   "#22d3ee", ActivityType.TxCount, 10);
        defineBadge("Regular",   "20+ transactions on LitVM.",   "#0891b2", ActivityType.TxCount, 20);
        defineBadge("Power User","50+ transactions on LitVM.",   "#67e8f9", ActivityType.TxCount, 50);
        defineBadge("Heavy",     "100+ transactions on LitVM.",  "#a78bfa", ActivityType.TxCount, 100);

        // Builder - contracts deployed
        defineBadge("Builder",      "Deployed 1+ contract.",     "#fbbf24", ActivityType.ContractsDeployed, 1);
        defineBadge("Architect",    "Deployed 3+ contracts.",    "#f97316", ActivityType.ContractsDeployed, 3);
        defineBadge("Shipwright",   "Deployed 10+ contracts.",   "#ef4444", ActivityType.ContractsDeployed, 10);

        // Explorer - unique contracts touched
        defineBadge("Wanderer",   "Touched 5+ contracts.",       "#10b981", ActivityType.UniqueContracts, 5);
        defineBadge("Pathfinder", "Touched 15+ contracts.",      "#14b8a6", ActivityType.UniqueContracts, 15);
        defineBadge("Cartographer","Touched 50+ contracts.",     "#06b6d4", ActivityType.UniqueContracts, 50);

        // Wallet age - days since first tx
        defineBadge("Fresh",   "Wallet 3+ days old.",   "#e11d48", ActivityType.WalletAgeDays, 3);
        defineBadge("Settled", "Wallet 14+ days old.",  "#fb7185", ActivityType.WalletAgeDays, 14);
        defineBadge("OG",      "Wallet 45+ days old.",  "#f43f5e", ActivityType.WalletAgeDays, 45);

        // Active days
        defineBadge("Dedicated",  "3+ unique active days.",   "#a855f7", ActivityType.ActiveDays, 3);
        defineBadge("Committed",  "7+ unique active days.",   "#7c3aed", ActivityType.ActiveDays, 7);
        defineBadge("Loyalist",   "30+ unique active days.",  "#6d28d9", ActivityType.ActiveDays, 30);
    }

    // --- Claim --------------------------------------------------------------
    function claim(
        uint256 badgeId,
        uint256 measuredValue,
        uint256 nonce,
        uint256 expiresAt,
        bytes calldata signature
    ) external {
        Badge memory b = badges[badgeId];
        if (!b.exists) revert UnknownBadge();
        if (!litPass.hasPass(msg.sender)) revert NoPassport();
        if (balanceOf(msg.sender, badgeId) > 0) revert AlreadyClaimed();
        if (measuredValue < b.threshold) revert InsufficientValue();
        if (block.timestamp > expiresAt) revert ClaimExpired();

        bytes32 nonceKey = keccak256(abi.encodePacked(msg.sender, badgeId, nonce));
        if (usedNonces[nonceKey]) revert NonceUsed();
        usedNonces[nonceKey] = true;

        bytes32 structHash = keccak256(
            abi.encode(CLAIM_TYPEHASH, msg.sender, badgeId, measuredValue, nonce, expiresAt)
        );
        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = ECDSA.recover(digest, signature);
        if (recovered == address(0) || recovered != signer) revert BadSignature();

        _mint(msg.sender, badgeId, 1, "");
        emit BadgeClaimed(msg.sender, badgeId, measuredValue);
    }

    // --- Soulbound ----------------------------------------------------------
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override
    {
        if (from != address(0) && to != address(0)) revert SoulboundNonTransferable();
        super._update(from, to, ids, values);
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundNonTransferable();
    }

    // --- Metadata -----------------------------------------------------------
    function uri(uint256 id) public view override returns (string memory) {
        Badge memory b = badges[id];
        if (!b.exists) revert UnknownBadge();
        string memory svg = _svg(b);
        string memory metric = _activityLabel(b.activity);
        string memory json = string(
            abi.encodePacked(
                '{"name":"', b.name,
                '","description":"', b.description,
                '","attributes":[',
                    '{"trait_type":"Activity","value":"', metric, '"},',
                    '{"trait_type":"Threshold","value":', b.threshold.toString(), '},',
                    '{"trait_type":"Family","value":"Activity"}',
                '],',
                '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _activityLabel(ActivityType a) internal pure returns (string memory) {
        if (a == ActivityType.TxCount)           return "txCount";
        if (a == ActivityType.ContractsDeployed) return "contractsDeployed";
        if (a == ActivityType.UniqueContracts)   return "uniqueContracts";
        if (a == ActivityType.WalletAgeDays)     return "walletAgeDays";
        return "activeDays";
    }

    function _svg(Badge memory b) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
                '<defs><radialGradient id="g" cx="0.5" cy="0.4" r="0.6">',
                '<stop offset="0" stop-color="', b.color, '" stop-opacity="0.9"/>',
                '<stop offset="1" stop-color="#0b1020" stop-opacity="1"/></radialGradient></defs>',
                '<rect width="400" height="400" rx="24" fill="#0b1020"/>',
                '<rect x="20" y="20" width="360" height="360" rx="20" fill="url(#g)" stroke="', b.color, '" stroke-opacity="0.5"/>',
                '<text x="200" y="180" fill="#ffffff" font-family="sans-serif" font-size="34" font-weight="800" text-anchor="middle">', b.name, '</text>',
                '<text x="200" y="220" fill="', b.color, '" font-family="monospace" font-size="14" text-anchor="middle">ACTIVITY  ',  _activityLabel(b.activity), '</text>',
                '<text x="200" y="340" fill="#9aa4bf" font-family="monospace" font-size="14" text-anchor="middle">', b.description, '</text>',
                '</svg>'
            )
        );
    }

    // --- Helpers (off-chain readability) -----------------------------------
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
