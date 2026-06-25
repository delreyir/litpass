// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

/**
 * @title LitPass
 * @notice Soulbound passport NFT for LitVM. One pass per wallet. Tracks daily
 *         check-ins and streaks fully on-chain. Non-transferable.
 * @dev    Token IDs start at 1 and are equal to mint order. Token URI is
 *         generated on-chain (no IPFS dependency).
 */
contract LitPass is ERC721, Ownable {
    using Strings for uint256;

    // --- Errors --------------------------------------------------------------
    error AlreadyMinted();
    error NoPassport();
    error AlreadyCheckedInToday();
    error SoulboundNonTransferable();
    error ZeroAddress();

    // --- Events --------------------------------------------------------------
    event PassportMinted(address indexed owner, uint256 indexed tokenId, uint64 timestamp);
    event CheckedIn(address indexed owner, uint256 indexed tokenId, uint32 newStreak, uint32 totalCheckIns, uint64 timestamp);

    // --- Storage -------------------------------------------------------------
    struct Pass {
        uint256 tokenId;
        uint64 mintedAt;
        uint64 lastCheckIn;     // unix timestamp of last check-in
        uint32 currentStreak;   // current consecutive day streak
        uint32 longestStreak;   // best streak ever
        uint32 totalCheckIns;   // lifetime check-ins
    }

    /// @notice tokenId of a given owner. 0 means no passport.
    mapping(address => uint256) public passOf;

    /// @notice passport state by tokenId.
    mapping(uint256 => Pass) public passes;

    uint256 public totalSupply;

    /// @notice Length of one "day" in seconds. 1 day on mainnet, configurable
    ///         to a shorter value on testnet for easier testing/demos.
    uint32 public dayLength;

    // --- Constructor ---------------------------------------------------------
    constructor(address initialOwner, uint32 dayLengthSeconds)
        ERC721("LitPass", "LITPASS")
        Ownable(initialOwner)
    {
        if (initialOwner == address(0)) revert ZeroAddress();
        dayLength = dayLengthSeconds == 0 ? 1 days : dayLengthSeconds;
    }

    // --- Admin ---------------------------------------------------------------
    function setDayLength(uint32 newDayLength) external onlyOwner {
        require(newDayLength > 0, "zero");
        dayLength = newDayLength;
    }

    // --- Mint ----------------------------------------------------------------
    /**
     * @notice Mint your LitPass. One per wallet, soulbound.
     */
    function mint() external returns (uint256 tokenId) {
        if (passOf[msg.sender] != 0) revert AlreadyMinted();

        unchecked {
            tokenId = ++totalSupply;
        }
        passOf[msg.sender] = tokenId;
        passes[tokenId] = Pass({
            tokenId: tokenId,
            mintedAt: uint64(block.timestamp),
            lastCheckIn: 0,
            currentStreak: 0,
            longestStreak: 0,
            totalCheckIns: 0
        });

        _safeMint(msg.sender, tokenId);
        emit PassportMinted(msg.sender, tokenId, uint64(block.timestamp));
    }

    // --- Daily check-in ------------------------------------------------------
    /**
     * @notice Check in for today. Increments streak if done within 2*dayLength
     *         of the last check-in, otherwise resets to 1. Cannot check in
     *         twice within the same dayLength window.
     */
    function checkIn() external returns (uint32 newStreak) {
        uint256 tokenId = passOf[msg.sender];
        if (tokenId == 0) revert NoPassport();

        Pass storage p = passes[tokenId];

        uint64 nowTs = uint64(block.timestamp);
        uint64 last = p.lastCheckIn;

        if (last != 0) {
            uint64 elapsed = nowTs - last;
            // Less than a full day since last check-in: blocked.
            if (elapsed < dayLength) revert AlreadyCheckedInToday();
            // Between 1 and 2 day lengths: streak extends.
            // More than 2 day lengths: streak resets to 1 (you missed a day).
            if (elapsed <= 2 * dayLength) {
                unchecked { p.currentStreak += 1; }
            } else {
                p.currentStreak = 1;
            }
        } else {
            p.currentStreak = 1;
        }

        if (p.currentStreak > p.longestStreak) {
            p.longestStreak = p.currentStreak;
        }

        unchecked { p.totalCheckIns += 1; }
        p.lastCheckIn = nowTs;

        newStreak = p.currentStreak;
        emit CheckedIn(msg.sender, tokenId, newStreak, p.totalCheckIns, nowTs);
    }

    // --- Views ---------------------------------------------------------------
    function hasPass(address user) external view returns (bool) {
        return passOf[user] != 0;
    }

    function canCheckIn(address user) external view returns (bool) {
        uint256 tokenId = passOf[user];
        if (tokenId == 0) return false;
        uint64 last = passes[tokenId].lastCheckIn;
        if (last == 0) return true;
        return uint64(block.timestamp) >= last + dayLength;
    }

    function nextCheckInAt(address user) external view returns (uint64) {
        uint256 tokenId = passOf[user];
        if (tokenId == 0) return 0;
        uint64 last = passes[tokenId].lastCheckIn;
        if (last == 0) return uint64(block.timestamp);
        return last + dayLength;
    }

    function getPass(address user) external view returns (Pass memory) {
        uint256 tokenId = passOf[user];
        if (tokenId == 0) return Pass(0, 0, 0, 0, 0, 0);
        return passes[tokenId];
    }

    // --- Soulbound enforcement -----------------------------------------------
    function _update(address to, uint256 tokenId, address auth)
        internal
        override
        returns (address from)
    {
        from = _ownerOf(tokenId);
        // Allow only minting (from == address(0)) and burning (to == address(0)).
        if (from != address(0) && to != address(0)) {
            revert SoulboundNonTransferable();
        }
        return super._update(to, tokenId, auth);
    }

    function approve(address, uint256) public pure override {
        revert SoulboundNonTransferable();
    }

    function setApprovalForAll(address, bool) public pure override {
        revert SoulboundNonTransferable();
    }

    // --- On-chain metadata ---------------------------------------------------
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        Pass memory p = passes[tokenId];

        string memory svg = _svg(tokenId, p);
        string memory json = string(
            abi.encodePacked(
                '{"name":"LitPass #', tokenId.toString(),
                '","description":"Soulbound passport for LitVM. Tracks daily check-ins, streaks and stamps.",',
                '"attributes":[',
                    '{"trait_type":"Current Streak","value":', uint256(p.currentStreak).toString(), '},',
                    '{"trait_type":"Longest Streak","value":', uint256(p.longestStreak).toString(), '},',
                    '{"trait_type":"Total Check-Ins","value":', uint256(p.totalCheckIns).toString(), '}',
                '],',
                '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
            )
        );

        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _svg(uint256 tokenId, Pass memory p) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600">',
                '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">',
                '<stop offset="0" stop-color="#0b1020"/><stop offset="1" stop-color="#1b2a4a"/></linearGradient></defs>',
                '<rect width="400" height="600" rx="24" fill="url(#g)"/>',
                '<text x="24" y="56" fill="#c0c8d8" font-family="monospace" font-size="14">LITVM PASSPORT</text>',
                '<text x="24" y="120" fill="#ffffff" font-family="sans-serif" font-size="40" font-weight="700">LitPass</text>',
                '<text x="24" y="156" fill="#9aa4bf" font-family="monospace" font-size="14">#', tokenId.toString(), '</text>',
                '<text x="24" y="420" fill="#7c8aa8" font-family="monospace" font-size="12">CURRENT STREAK</text>',
                '<text x="24" y="460" fill="#ffffff" font-family="sans-serif" font-size="44" font-weight="700">', uint256(p.currentStreak).toString(), '</text>',
                '<text x="200" y="420" fill="#7c8aa8" font-family="monospace" font-size="12">CHECK-INS</text>',
                '<text x="200" y="460" fill="#ffffff" font-family="sans-serif" font-size="44" font-weight="700">', uint256(p.totalCheckIns).toString(), '</text>',
                '<text x="24" y="560" fill="#6c7896" font-family="monospace" font-size="11">SOULBOUND  -  LITVM</text>',
                '</svg>'
            )
        );
    }

    // --- Internal helpers ----------------------------------------------------
    function _dayOf(uint64 ts) internal view returns (uint64) {
        return ts / dayLength;
    }
}
