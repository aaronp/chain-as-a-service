// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

contract AtomicSwap {
    event SwapExecuted(
        address indexed partyA,
        address indexed partyB,
        address tokenA,
        uint256 amountA,
        address tokenB,
        uint256 amountB
    );

    function swap(
        address tokenA,
        uint256 amountA,
        address partyB,
        address tokenB,
        uint256 amountB
    ) external {
        address partyA = msg.sender;

        require(amountA > 0 && amountB > 0, "Amounts must be > 0");

        // Transfer Token A from A to B
        require(
            IERC20(tokenA).transferFrom(partyA, partyB, amountA),
            "TokenA transfer failed"
        );

        // Transfer Token B from B to A
        require(
            IERC20(tokenB).transferFrom(partyB, partyA, amountB),
            "TokenB transfer failed"
        );

        emit SwapExecuted(partyA, partyB, tokenA, amountA, tokenB, amountB);
    }
}
