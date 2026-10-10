// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title EcoCarbonCredit
 * @notice ERC-1155 token representing verified forest carbon credits.
 *
 *  Token accounting
 *  ─────────────────
 *  • One token ID per verified project batch.
 *  • 1 token unit  ≡  0.001 tCO₂e  (milli-credit).
 *  • So 1 tonne CO₂e  ≡  1 000 token units.
 *
 *  Roles
 *  ──────
 *  DEFAULT_ADMIN_ROLE — can grant / revoke roles.
 *  MINTER_ROLE        — can call mint() (back-end server wallet only).
 *
 *  URI convention
 *  ───────────────
 *  Each token ID stores a IPFS CID set at mint time.
 *  uri(tokenId) → "ipfs://<cid>"
 */
contract EcoCarbonCredit is ERC1155, ERC1155Supply, AccessControl {
    // ─── Roles ───────────────────────────────────────────────────────────────
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    // ─── Storage ─────────────────────────────────────────────────────────────
    /// @notice IPFS CID associated with each token ID (set at mint, immutable).
    mapping(uint256 => string) private _tokenCIDs;

    // ─── Custom errors ────────────────────────────────────────────────────────
    error ZeroAmount();
    error ZeroAddress();
    error TokenAlreadyMinted(uint256 tokenId);

    // ─── Events ───────────────────────────────────────────────────────────────
    /**
     * @notice Emitted when carbon credits are permanently retired.
     * @param retiree    Address that initiated the retirement.
     * @param tokenId    Token ID of the credit batch.
     * @param amount     Units retired (milli-credits, 1 unit = 0.001 tCO₂e).
     * @param beneficiary Name or address on whose behalf credits are retired.
     * @param reason     Free-text retirement reason.
     */
    event CarbonRetired(
        address indexed retiree,
        uint256 indexed tokenId,
        uint256 amount,
        string beneficiary,
        string reason
    );

    // ─── Constructor ──────────────────────────────────────────────────────────
    /**
     * @param admin  Address that receives DEFAULT_ADMIN_ROLE and MINTER_ROLE.
     *               Typically a multisig or the deployer during testing.
     */
    constructor(address admin) ERC1155("") {
        if (admin == address(0)) revert ZeroAddress();
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    // ─── Minting ──────────────────────────────────────────────────────────────
    /**
     * @notice Mints a new batch of carbon credits for a verified project.
     * @dev    Each tokenId can only be minted once (no re-minting / topping up).
     *         This enforces the one-batch-per-project invariant.
     * @param to      Recipient address (project landowner or treasury).
     * @param tokenId Unique ID derived from the verified project's DB ID.
     * @param amount  Units to mint (milli-credits).
     * @param cid     IPFS CID of the MRV report JSON.
     */
    function mint(
        address to,
        uint256 tokenId,
        uint256 amount,
        string calldata cid
    ) external onlyRole(MINTER_ROLE) {
        if (to == address(0)) revert ZeroAddress();
        if (amount == 0) revert ZeroAmount();
        // Prevent re-minting the same project batch
        if (exists(tokenId)) revert TokenAlreadyMinted(tokenId);

        _tokenCIDs[tokenId] = cid;
        _mint(to, tokenId, amount, "");
    }

    // ─── Retiring ─────────────────────────────────────────────────────────────
    /**
     * @notice Permanently burns carbon credits, retiring them from circulation.
     * @dev    The caller must own at least `amount` of `tokenId`.
     *         Burning reduces totalSupply via ERC1155Supply.
     * @param tokenId     Token ID to retire.
     * @param amount      Units to retire (milli-credits).
     * @param beneficiary Name / address on behalf of which the retirement is made.
     * @param reason      Free-text reason (stored in event logs).
     */
    function retire(
        uint256 tokenId,
        uint256 amount,
        string calldata beneficiary,
        string calldata reason
    ) external {
        if (amount == 0) revert ZeroAmount();
        // ERC1155._burn handles balance check and reverts on underflow
        _burn(msg.sender, tokenId, amount);
        emit CarbonRetired(msg.sender, tokenId, amount, beneficiary, reason);
    }

    // ─── URI override ─────────────────────────────────────────────────────────
    /**
     * @notice Returns "ipfs://<cid>" for the given tokenId.
     *         Falls back to the base URI if no CID was recorded.
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        string memory cid = _tokenCIDs[tokenId];
        if (bytes(cid).length > 0) {
            return string(abi.encodePacked("ipfs://", cid));
        }
        return super.uri(tokenId);
    }

    /// @notice Returns the IPFS CID stored for a token ID.
    function tokenCID(uint256 tokenId) external view returns (string memory) {
        return _tokenCIDs[tokenId];
    }

    // ─── Required overrides ───────────────────────────────────────────────────
    /// @dev ERC1155 + ERC1155Supply both override _update; resolve ambiguity.
    function _update(
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory values
    ) internal override(ERC1155, ERC1155Supply) {
        super._update(from, to, ids, values);
    }

    /// @dev ERC1155 + AccessControl both implement supportsInterface.
    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
