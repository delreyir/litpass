// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title Usernames
 * @notice Optional human-readable usernames for LitPass profiles.
 *         Globally unique. 3-20 chars. ASCII a-z, 0-9, and underscore only.
 *         Stored lowercase; case-insensitive uniqueness.
 *         One username per wallet. A wallet can release its username with
 *         `clear()` and claim a new one.
 */
contract Usernames {
    // --- Errors --------------------------------------------------------------
    error InvalidLength();
    error InvalidChar();
    error AlreadyTaken();
    error AlreadyHasName();
    error NoName();

    // --- Events --------------------------------------------------------------
    event NameSet(address indexed owner, string name);
    event NameCleared(address indexed owner, string name);

    // --- Storage -------------------------------------------------------------
    mapping(address => string) public usernameOf;
    mapping(bytes32 => address) public ownerOfHash;

    // --- Write ---------------------------------------------------------------
    /**
     * @notice Claim a username for msg.sender. Reverts if the name is taken or
     *         the caller already has a name. Use `clear()` first to rename.
     */
    function setUsername(string calldata name) external {
        if (bytes(usernameOf[msg.sender]).length != 0) revert AlreadyHasName();

        string memory normalized = _normalize(name);
        bytes32 h = keccak256(bytes(normalized));
        if (ownerOfHash[h] != address(0)) revert AlreadyTaken();

        usernameOf[msg.sender] = normalized;
        ownerOfHash[h] = msg.sender;
        emit NameSet(msg.sender, normalized);
    }

    /**
     * @notice Release the caller's username so they (or others) can claim a new one.
     */
    function clear() external {
        string memory n = usernameOf[msg.sender];
        if (bytes(n).length == 0) revert NoName();
        delete usernameOf[msg.sender];
        delete ownerOfHash[keccak256(bytes(n))];
        emit NameCleared(msg.sender, n);
    }

    // --- Views ---------------------------------------------------------------
    function ownerOf(string calldata name) external view returns (address) {
        return ownerOfHash[keccak256(bytes(_normalize(name)))];
    }

    function isAvailable(string calldata name) external view returns (bool) {
        bytes memory raw = bytes(name);
        if (raw.length < 3 || raw.length > 20) return false;
        bytes memory n;
        try this.__externalNormalize(name) returns (string memory nn) {
            n = bytes(nn);
        } catch {
            return false;
        }
        return ownerOfHash[keccak256(n)] == address(0);
    }

    /// @dev Internal-as-external trampoline used by `isAvailable` so it can
    ///      try/catch the validation logic without reverting.
    function __externalNormalize(string calldata name) external pure returns (string memory) {
        return _normalize(name);
    }

    // --- Internal ------------------------------------------------------------
    function _normalize(string calldata input) internal pure returns (string memory) {
        bytes memory b = bytes(input);
        uint256 len = b.length;
        if (len < 3 || len > 20) revert InvalidLength();

        bytes memory out = new bytes(len);
        for (uint256 i = 0; i < len; i++) {
            bytes1 c = b[i];
            // a-z
            if (c >= 0x61 && c <= 0x7A) {
                out[i] = c;
                continue;
            }
            // A-Z -> a-z
            if (c >= 0x41 && c <= 0x5A) {
                out[i] = bytes1(uint8(c) + 32);
                continue;
            }
            // 0-9
            if (c >= 0x30 && c <= 0x39) {
                out[i] = c;
                continue;
            }
            // _
            if (c == 0x5F) {
                out[i] = c;
                continue;
            }
            revert InvalidChar();
        }
        return string(out);
    }
}
