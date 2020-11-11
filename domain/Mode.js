/**
 * Schema Enum: Mode
 *
 * NOTE: This is the CommonJS version specifically for use with Node.
 *
 * @author Cliff Hall <cliff@futurescale.com>
 */
class Mode {}

Mode.AIRDROP = 0;
Mode.WILLCALL = 1;

Mode.Modes = [Mode.AIRDROP, Mode.WILLCALL];

module.exports = Mode;