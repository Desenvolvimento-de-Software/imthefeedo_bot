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

import Action from "./Action";
import Context from "contexts/Context";
import Log from "helpers/Log";
import { createAndGetChat } from "utils/Chats";

export default class SaveChat extends Action {

    /**
     * The constructor.
     *
     * @author Marcos Leandro
     * @since  2023-06-02
     *
     * @param context
     */
    public constructor(context: Context) {
        super(context, "sync");
    }

    /**
     * Runs the action.
     *
     * @author Marcos Leandro
     * @since  2023-06-06
     */
    public async run(): Promise<void> {

        try {

            const contextChat = this.context.getChat();
            if (!contextChat) {
                throw new Error("Chat not found in the context.");
            }

            await createAndGetChat(contextChat);

        } catch (err: any) {
            Log.save("SaveUserAndChat :: " + err.message, err.stack);
        }
    }
}
