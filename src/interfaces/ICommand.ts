/**
 * Ada Lovelace Telegram Bot
 *
 * This file is part of Ada Lovelace Telegram Bot.
 * You are free to modify and share this project or its files.
 *
 * @package  mslovelace_bot
 * @author   Marcos Leandro <mleandrojr@yggdrasill.com.br>
 * @license  GPLv3 <http://www.gnu.org/licenses/gpl-3.0.en.html>
 */

import CommandContext from "contexts/Command";
import Context from "contexts/Context";

export default interface ICommand {

    /**
     * Executes the command.
     *
     * @author Marcos Leandro
     * @since  2023-06-07
     *
     * @param context
     * @param commandContext
     */
    run(command: CommandContext, context: Context): Promise<void>;
}
