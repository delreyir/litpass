// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ILitPassMin {
    function hasPass(address user) external view returns (bool);
}

/**
 * @title ReferralTracker
 * @notice Lightweight on-chain referrals: a user with a LitPass can bind their
 *         referrer one time. Counts are public so leaderboards can be built
 *         off-chain or by reading events.
 */
contract ReferralTracker {
    error PassRequired();
    error AlreadyBound();
    error SelfReferral();
    error ReferrerNeedsPass();

    event Referred(address indexed referrer, address indexed user, uint64 timestamp);

    ILitPassMin public immutable litPass;

    /// @notice user => referrer. address(0) means none.
    mapping(address => address) public referrerOf;

    /// @notice referrer => count of referrals.
    mapping(address => uint32) public referralsOf;

    constructor(ILitPassMin _litPass) {
        litPass = _litPass;
    }

    /**
     * @notice Bind a referrer for msg.sender. Both wallets must have a passport.
     *         Cannot be changed once set.
     */
    function bindReferrer(address referrer) external {
        if (!litPass.hasPass(msg.sender)) revert PassRequired();
        if (!litPass.hasPass(referrer)) revert ReferrerNeedsPass();
        if (referrer == msg.sender) revert SelfReferral();
        if (referrerOf[msg.sender] != address(0)) revert AlreadyBound();

        referrerOf[msg.sender] = referrer;
        unchecked { referralsOf[referrer] += 1; }
        emit Referred(referrer, msg.sender, uint64(block.timestamp));
    }
}
