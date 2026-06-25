// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";
import {Base64} from "@openzeppelin/contracts/utils/Base64.sol";

interface ILitPassFull {
    struct Pass {
        uint256 tokenId;
        uint64 mintedAt;
        uint64 lastCheckIn;
        uint32 currentStreak;
        uint32 longestStreak;
        uint32 totalCheckIns;
    }
    function getPass(address user) external view returns (Pass memory);
    function hasPass(address user) external view returns (bool);
}

/**
 * @title AchievementBadges
 * @notice ERC-1155 soulbound badges minted by the user once they hit certain
 *         milestones on their LitPass (streak length, total check-ins, etc.).
 * @dev    Each user can hold at most one of each badge id. Non-transferable.
 */
contract AchievementBadges is ERC1155, Ownable {
    using Strings for uint256;

    // --- Errors --------------------------------------------------------------
    error NoPassport();
    error AlreadyClaimed();
    error NotEligible();
    error UnknownBadge();
    error SoulboundNonTransferable();
    error ZeroAddress();

    // --- Events --------------------------------------------------------------
    event BadgeDefined(uint256 indexed id, string name, MetricType metric, uint32 threshold);
    event BadgeClaimed(address indexed user, uint256 indexed id);

    // --- Types --------------------------------------------------------------
    enum MetricType { CurrentStreak, LongestStreak, TotalCheckIns }

    struct Badge {
        string name;
        string description;
        string color;       // hex like "#22d3ee"
        MetricType metric;
        uint32 threshold;
        bool exists;
    }

    // --- Storage ------------------------------------------------------------
    ILitPassFull public immutable litPass;
    mapping(uint256 => Badge) public badges;
    uint256 public badgeCount;

    constructor(address initialOwner, ILitPassFull _litPass) ERC1155("") Ownable(initialOwner) {
        if (initialOwner == address(0)) revert ZeroAddress();
        if (address(_litPass) == address(0)) revert ZeroAddress();
        litPass = _litPass;
        _seedDefaultBadges();
    }

    // --- Admin --------------------------------------------------------------
    function defineBadge(
        string memory name,
        string memory description,
        string memory color,
        MetricType metric,
        uint32 threshold
    ) public onlyOwner returns (uint256 id) {
        unchecked { id = ++badgeCount; }
        badges[id] = Badge({
            name: name,
            description: description,
            color: color,
            metric: metric,
            threshold: threshold,
            exists: true
        });
        emit BadgeDefined(id, name, metric, threshold);
    }

    function _seedDefaultBadges() internal {
        // streak milestones
        defineBadge("Spark",      "3-day streak.",     "#fbbf24", MetricType.CurrentStreak,  3);
        defineBadge("Flame",      "7-day streak.",     "#f97316", MetricType.CurrentStreak,  7);
        defineBadge("Inferno",    "30-day streak.",    "#ef4444", MetricType.CurrentStreak,  30);
        defineBadge("Eternal",    "100-day streak.",   "#a855f7", MetricType.LongestStreak,  100);
        // volume milestones
        defineBadge("Voyager",    "10 check-ins.",     "#22d3ee", MetricType.TotalCheckIns,  10);
        defineBadge("Pathfinder", "50 check-ins.",     "#10b981", MetricType.TotalCheckIns,  50);
        defineBadge("Legend",     "365 check-ins.",    "#e11d48", MetricType.TotalCheckIns,  365);
    }

    // --- Claim --------------------------------------------------------------
    function claim(uint256 id) external {
        Badge memory b = badges[id];
        if (!b.exists) revert UnknownBadge();
        if (!litPass.hasPass(msg.sender)) revert NoPassport();
        if (balanceOf(msg.sender, id) > 0) revert AlreadyClaimed();
        if (!_isEligible(msg.sender, b)) revert NotEligible();

        _mint(msg.sender, id, 1, "");
        emit BadgeClaimed(msg.sender, id);
    }

    function isEligible(address user, uint256 id) external view returns (bool) {
        Badge memory b = badges[id];
        if (!b.exists) return false;
        return _isEligible(user, b);
    }

    function _isEligible(address user, Badge memory b) internal view returns (bool) {
        ILitPassFull.Pass memory p = litPass.getPass(user);
        if (b.metric == MetricType.CurrentStreak) return p.currentStreak >= b.threshold;
        if (b.metric == MetricType.LongestStreak) return p.longestStreak >= b.threshold;
        return p.totalCheckIns >= b.threshold;
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
        string memory metric = _metricLabel(b.metric);
        string memory json = string(
            abi.encodePacked(
                '{"name":"', b.name,
                '","description":"', b.description,
                '","attributes":[',
                    '{"trait_type":"Metric","value":"', metric, '"},',
                    '{"trait_type":"Threshold","value":', uint256(b.threshold).toString(), '}',
                '],',
                '"image":"data:image/svg+xml;base64,', Base64.encode(bytes(svg)), '"}'
            )
        );
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

    function _metricLabel(MetricType m) internal pure returns (string memory) {
        if (m == MetricType.CurrentStreak) return "currentStreak";
        if (m == MetricType.LongestStreak) return "longestStreak";
        return "totalCheckIns";
    }

    function _svg(Badge memory b) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">',
                '<defs><radialGradient id="g" cx="0.5" cy="0.5" r="0.6">',
                '<stop offset="0" stop-color="', b.color, '" stop-opacity="0.9"/>',
                '<stop offset="1" stop-color="#0b1020" stop-opacity="1"/></radialGradient></defs>',
                '<rect width="400" height="400" rx="24" fill="#0b1020"/>',
                '<circle cx="200" cy="180" r="120" fill="url(#g)"/>',
                '<circle cx="200" cy="180" r="120" fill="none" stroke="', b.color, '" stroke-opacity="0.6" stroke-width="2"/>',
                '<text x="200" y="190" fill="#ffffff" font-family="sans-serif" font-size="32" font-weight="800" text-anchor="middle">', b.name, '</text>',
                '<text x="200" y="350" fill="#9aa4bf" font-family="monospace" font-size="14" text-anchor="middle">', b.description, '</text>',
                '</svg>'
            )
        );
    }
}
