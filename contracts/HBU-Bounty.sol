// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title HBU Bounty Contract
 * @dev Manages bounty payments for successful lead referrals in the HBU Asset Recovery platform
 */
contract HBUBounty is Ownable, ReentrancyGuard {
    // Bounty configuration
    uint256 public minBountyAmount = 50 * 10**18; // 50 tokens
    uint256 public maxBountyAmount = 500 * 10**18; // 500 tokens
    uint256 public bountyPercentage = 5; // 5% of claim amount

    // Payment token (USDC, USDT, etc.)
    IERC20 public paymentToken;

    // Bounty tracking
    struct Bounty {
        address referrer;
        uint256 amount;
        uint256 claimAmount;
        string leadId;
        bool paid;
        uint256 timestamp;
    }

    mapping(bytes32 => Bounty) public bounties;
    mapping(address => uint256) public totalEarned;
    mapping(address => uint256) public pendingBounties;

    // Events
    event BountyCreated(
        bytes32 indexed bountyId,
        address indexed referrer,
        uint256 amount,
        string leadId
    );
    
    event BountyPaid(
        bytes32 indexed bountyId,
        address indexed referrer,
        uint256 amount
    );
    
    event ConfigUpdated(
        uint256 minAmount,
        uint256 maxAmount,
        uint256 percentage
    );

    /**
     * @dev Constructor
     * @param _paymentToken Address of the ERC20 token used for payments
     */
    constructor(address _paymentToken) {
        paymentToken = IERC20(_paymentToken);
    }

    /**
     * @dev Create a new bounty for a successful referral
     * @param referrer Address of the referrer
     * @param claimAmount Amount of the asset recovery claim
     * @param leadId Unique identifier for the lead
     */
    function createBounty(
        address referrer,
        uint256 claimAmount,
        string memory leadId
    ) external onlyOwner returns (bytes32) {
        require(referrer != address(0), "Invalid referrer address");
        require(claimAmount > 0, "Invalid claim amount");

        // Calculate bounty amount
        uint256 bountyAmount = calculateBounty(claimAmount);

        // Generate unique bounty ID
        bytes32 bountyId = keccak256(
            abi.encodePacked(referrer, leadId, block.timestamp)
        );

        // Create bounty
        bounties[bountyId] = Bounty({
            referrer: referrer,
            amount: bountyAmount,
            claimAmount: claimAmount,
            leadId: leadId,
            paid: false,
            timestamp: block.timestamp
        });

        pendingBounties[referrer] += bountyAmount;

        emit BountyCreated(bountyId, referrer, bountyAmount, leadId);

        return bountyId;
    }

    /**
     * @dev Pay out a bounty to the referrer
     * @param bountyId ID of the bounty to pay
     */
    function payBounty(bytes32 bountyId) external onlyOwner nonReentrant {
        Bounty storage bounty = bounties[bountyId];
        require(bounty.amount > 0, "Bounty does not exist");
        require(!bounty.paid, "Bounty already paid");

        // Mark as paid
        bounty.paid = true;

        // Update tracking
        pendingBounties[bounty.referrer] -= bounty.amount;
        totalEarned[bounty.referrer] += bounty.amount;

        // Transfer tokens
        require(
            paymentToken.transfer(bounty.referrer, bounty.amount),
            "Payment transfer failed"
        );

        emit BountyPaid(bountyId, bounty.referrer, bounty.amount);
    }

    /**
     * @dev Calculate bounty amount based on claim amount
     * @param claimAmount The asset recovery claim amount
     */
    function calculateBounty(uint256 claimAmount) public view returns (uint256) {
        uint256 calculated = (claimAmount * bountyPercentage) / 100;
        
        if (calculated < minBountyAmount) {
            return minBountyAmount;
        }
        if (calculated > maxBountyAmount) {
            return maxBountyAmount;
        }
        return calculated;
    }

    /**
     * @dev Update bounty configuration
     * @param _minAmount New minimum bounty amount
     * @param _maxAmount New maximum bounty amount
     * @param _percentage New bounty percentage
     */
    function updateConfig(
        uint256 _minAmount,
        uint256 _maxAmount,
        uint256 _percentage
    ) external onlyOwner {
        require(_minAmount < _maxAmount, "Invalid min/max amounts");
        require(_percentage > 0 && _percentage <= 100, "Invalid percentage");

        minBountyAmount = _minAmount;
        maxBountyAmount = _maxAmount;
        bountyPercentage = _percentage;

        emit ConfigUpdated(_minAmount, _maxAmount, _percentage);
    }

    /**
     * @dev Withdraw tokens from contract (emergency only)
     * @param amount Amount to withdraw
     */
    function withdrawTokens(uint256 amount) external onlyOwner {
        require(
            paymentToken.transfer(owner(), amount),
            "Withdrawal failed"
        );
    }

    /**
     * @dev Get referrer statistics
     * @param referrer Address of the referrer
     */
    function getReferrerStats(address referrer)
        external
        view
        returns (uint256 earned, uint256 pending)
    {
        return (totalEarned[referrer], pendingBounties[referrer]);
    }
}
