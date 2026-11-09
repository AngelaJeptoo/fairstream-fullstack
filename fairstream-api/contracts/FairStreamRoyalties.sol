// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Platform funds royalty allocations once per period; artists pull their balance with claim().
contract FairStreamRoyalties {
    address public owner;
    mapping(address => uint256) public pending;
    event Funded(address indexed artist, uint256 amount);
    event Claimed(address indexed artist, uint256 amount);

    constructor() { owner = msg.sender; }

    function fund(address[] calldata artists, uint256[] calldata amounts) external payable {
        require(msg.sender == owner, "owner only");
        require(artists.length == amounts.length, "length mismatch");
        uint256 sum;
        for (uint256 i = 0; i < artists.length; i++) {
            pending[artists[i]] += amounts[i];
            sum += amounts[i];
            emit Funded(artists[i], amounts[i]);
        }
        require(sum == msg.value, "value mismatch");
    }

    function claim() external {
        uint256 amt = pending[msg.sender];
        require(amt > 0, "nothing to claim");
        pending[msg.sender] = 0;
        (bool ok, ) = msg.sender.call{value: amt}("");
        require(ok, "transfer failed");
        emit Claimed(msg.sender, amt);
    }
}
