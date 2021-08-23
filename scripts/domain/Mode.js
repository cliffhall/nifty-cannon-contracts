/**
 * Domain Enum: Mode
 * @author Cliff Hall <cliff@futurescale.com>
 */
const NODE = (typeof module !== 'undefined' && typeof module.exports !== 'undefined');
class Mode {}

Mode.AIRDROP = 0;
Mode.WILLCALL = 1;
Mode.TICKET = 2;

Mode.Modes = [Mode.AIRDROP, Mode.WILLCALL, Mode.TICKET];

// Export
if (NODE) {
    module.exports = Mode;
} else {
    window.Mode = Mode;
}