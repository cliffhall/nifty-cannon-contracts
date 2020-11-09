/**
 * Schema Enum: Mode
 *
 * NOTE: This is the CommonJS version specifically for use with Node.
 *
 * @author Cliff Hall <cliff@futurescale.com>
 */
class Mode {}

Mode.AirDrop = 0;
Mode.WillCall = 1;

Mode.Modes = [Mode.AirDrop, Mode.WillCall];

module.exports = Mode;