/**
 * Domain Entity: Volley
 * @author Cliff Hall <cliff@futurescale.com>
 */
const NODE = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');
const Mode = require("./Mode");
const eip55 = require("eip55");

class Volley {

    constructor (mode, sender, recipient, tokenContract, tokenIds, amounts) {
        this.mode = mode;
        this.sender = sender;
        this.recipient = recipient;
        this.tokenContract = tokenContract;
        this.tokenIds = tokenIds;
        this.amounts = amounts || []; // ERC-1125 use
    }

    /**
     * Get a new Volley instance from a database representation
     * @param o
     * @returns {Volley}
     */
    static fromObject(o) {
        const {mode, sender, recipient, tokenContract, tokenIds, amounts} = o;
        return new Volley(mode, sender, recipient, tokenContract, tokenIds, amounts) ;
    }

    /**
     * Get a database representation of this Volley instance
     * @returns {object}
     */
    toObject() {
        return JSON.parse(this.toString());
    }

    /**
     * Get a string representation of this Volley instance
     * @returns {string}
     */
    toString() {
        return JSON.stringify(this);
    }

    /**
     * Is this Volley instance's mode field valid?
     * @returns {boolean}
     */
    modeIsValid() {
        let valid = false;
        let {mode} = this;
        try {
            valid = (
                Mode.Modes.includes(mode)
            );
        } catch (e) {}
        return valid;
    }

    /**
     * Is this Volley instance's sender field valid?
     * Must be a eip55 compliant Ethereum address
     * @returns {boolean}
     */
    senderIsValid() {
        let valid = false;
        let {sender} = this;
        try {
            valid = (
                eip55.verify(sender)
            );
        } catch (e) {}
        return valid;
    }

    /**
     * Is this Volley instance's recipient field valid?
     * Must be a eip55 compliant Ethereum address
     * @returns {boolean}
     */
    recipientIsValid() {
        let valid = false;
        let {recipient} = this;
        try {
            valid = (
                eip55.verify(recipient)
            );
        } catch (e) {}
        return valid;
    }

    /**
     * Is this Volley instance's tokenContract field valid?
     * Must be a eip55 compliant Ethereum address
     * @returns {boolean}
     */
    tokenContractIsValid() {
        let valid = false;
        let {tokenContract} = this;
        try {
            valid = (
                eip55.verify(tokenContract)
            );
        } catch (e) {}
        return valid;
    }

    /**
     * Is this Volley instance's tokenIds field valid?
     * Must be an array of at least one number
     * @returns {boolean}
     */
    tokenIdsIsValid() {
        let valid = false;
        let {tokenIds} = this;
        try {
            valid = (
                Array.isArray(tokenIds) &&
                tokenIds.length &&
                tokenIds.reduce((valid, tokenId) => valid === valid && typeof tokenId === "number", true)
            )
        } catch (e) {}
        return valid;
    }

    /**
     * Is this Volley instance's amounts field valid?
     * - Can be an empty array
     * - all elements must be number
     * - If any elements are present,
     *   - none can be zero
     *   - must be same as number of elements as tokenIds
     * @returns {boolean}
     */
    amountsIsValid() {
        let valid = false;
        let {amounts, tokenIds} = this;
        try {
            valid = (
                Array.isArray(tokenIds) &&
                amounts.reduce((valid, tokenId) => valid === valid && typeof tokenId === "number", true) &&
                (amounts.length === 0 || amounts.length === tokenIds.length)
            )
        } catch (e) {}
        return valid;
    }


    /**
     * Is this Volley instance valid?
     * @returns {boolean}
     */
    isValid() {
        return (
            this.modeIsValid() &&
            this.senderIsValid() &&
            this.recipientIsValid() &&
            this.tokenContractIsValid() &&
            this.tokenIdsIsValid() &&
            this.amountsIsValid()
        );
    };

    /**
     * Clone this Volley
     * @returns {Volley}
     */
    clone () {
       return Volley.fromObject(this.toObject());
    }

}

// Export
if (NODE) {
    module.exports = Volley;
} else {
    window.Volley = Volley;
}