/**
 * Domain Entity: Ticket
 * @author Cliff Hall <cliff@futurescale.com>
 */
const NODE = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');
const eip55 = require("eip55");

class Ticket {

    constructor (ticketId, sender, tokenContract, tokenIds) {
        this.ticketId = ticketId;
        this.sender = sender;
        this.tokenContract = tokenContract;
        this.tokenIds = tokenIds;
    }

    /**
     * Get a new Ticket instance from a database representation
     * @param o
     * @returns {Ticket}
     */
    static fromObject(o) {
        const {ticketId, sender, tokenContract, tokenIds} = o;
        return new Ticket(ticketId, sender, tokenContract, tokenIds) ;
    }

    /**
     * Get a database representation of this Ticket instance
     * @returns {object}
     */
    toObject() {
        return JSON.parse(JSON.stringify(this));
    }

    /**
     * Get a string representation of this Ticket instance
     * @returns {string}
     */
    toString() {
        const {ticketId, sender, recipient, tokenContract, tokenIds} = this;
        return [
            ticketId, sender, recipient, tokenContract, tokenIds
        ].join(', ');
    }

    /**
     * Is this Ticket instance's ticketId field valid?
     * @returns {boolean}
     */
    ticketIdIsValid() {
        let valid = false;
        let {ticketId} = this;
        try {
            valid = (
                typeof ticketId === "number"
            );
        } catch (e) {}
        return valid;
    }

    /**
     * Is this Ticket instance's sender field valid?
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
     * Is this Ticket instance's tokenContract field valid?
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
     * Is this Ticket instance's tokenIds field valid?
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
     * Is this Ticket instance valid?
     * @returns {boolean}
     */
    isValid() {
        return (
            this.ticketIdIsValid() &&
            this.senderIsValid() &&
            this.tokenContractIsValid() &&
            this.tokenIdsIsValid()
        );
    };

    /**
     * Clone this Ticket
     * @returns {Ticket}
     */
    clone () {
       return Ticket.fromObject(this.toObject());
    }

}

// Export
if (NODE) {
    module.exports = Ticket;
} else {
    window.Ticket = Ticket;
}