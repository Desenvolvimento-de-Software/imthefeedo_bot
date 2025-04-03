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

import { BotCommand } from "libraries/telegram/types/BotCommand";
import { createAndGetChat } from "utils/Chats";
import { addSubscriber, getSubscriptionByUrl, getSubscriptions, isChatSubscribed } from "utils/Subscribers";
import { createAndGetFeed } from "utils/Feeds";
import { chats, PrismaClient } from "@prisma/client";
import Command from "./Command";
import Context from "contexts/Context";
import CommandContext from "contexts/Command";
import ICommand from "../interfaces/ICommand";

export default class Feed extends Command implements ICommand {

    /**
     * Commands list.
     *
     * @author Marcos Leandro
     * @since  2024-05-03
     *
     * @var {BotCommand[]}
     */
    public readonly commands: BotCommand[] = [
        { command: "list", description: "Lista os feeds RSS cadastrados." },
        { command: "add", description: "Adiciona um novo feed RSS." },
        { command: "remove", description: "Remove um feed RSS." }
    ];

    /**
     * Command context.
     *
     * @author Marcos Leandro
     * @since  2025-04-02
     */
    private command?: CommandContext;

    /**
     * Chat object.
     *
     * @author Marcos Leandro
     * @since  2025-04-02
     */
    private chat?: chats;

    /**
     * The constructor.
     *
     * @author Marcos Leandro
     * @since 1.0.0
     */
    public constructor() {
        super();
        this.setParams(["add", "list", "remove"]);
    }

    /**
     * Executes the command.
     *
     * @author Marcos Leandro
     * @since  2023-06-07
     *
     * @param {CommandContext} command
     * @param {Context}        context
     */
    public async run(command: CommandContext, context: Context): Promise<void> {

        this.command = command;
        this.context = context;
        this.chat = await createAndGetChat(this.context.getChat()!);

        if (!this.chat) {
            return;
        }

        if (!await this.context.getUser()?.isAdmin()) {
            return await this.adminOnlyAction();
        }

        switch (this.command.getCommand()) {
            case "add":
                return await this.add();

            case "remove":
                return await this.remove();

            default:
                return await this.list();
        }
    }

    /**
     * Adds a new feed.
     *
     * @author Marcos Leandro
     * @since  2025-04-02
     */
    public async add(): Promise<void> {

        try {

            const params = this.command?.getParams() ?? [];
            if (params.length < 1) {
                throw new Error("empty URL");
            }

            const linkUrl = new URL(params[0]);
            if(!linkUrl) {
                throw new Error("Invalid URL");
            }

            const feed = await createAndGetFeed(linkUrl.toString());
            const isSubscribed = await isChatSubscribed(this.chat!.id, feed.id);
            if (isSubscribed) {
                this.context?.getMessage()?.reply("Este feed já está cadastrado.");
                return;
            }

            await addSubscriber(this.chat!, feed);

        } catch (error: any) {
            const message = "É necessário fornecer uma URL válida para cadastrar um feed.";
            this.context?.getMessage()?.reply(message).catch((err: any) => {
                this.context?.getChat()?.sendMessage(message)
            });

            return;
        }

        this.context!.getMessage()?.delete();
        return this.list();
    }

    /**
     * Lists the registered feeds.
     *
     * @author Marcos Leandro
     * @since  2025-04-02
     */
    public async list(): Promise<void> {

        this.context!.getMessage()?.delete();

        const subscriptions = await getSubscriptions(this.chat!.id);
        if (subscriptions.length < 1) {
            this.context?.getChat()?.sendMessage("Não há feeds cadastrados.");
            return;
        }

        let message = subscriptions.length === 1 ? "Existe 1 feed cadastrado.\n\n" : `Existem ${subscriptions.length} feeds cadastrados.\n\n`;
        subscriptions.forEach((subscription) => {
            message += ` • <a href="${subscription.feeds.link}">${subscription.feeds.title}</a>\n`;
        });

        this.context!.getChat()?.sendMessage(message, { parse_mode: "HTML" });
    }

    /**
     * Removes the feed from chat.
     *
     * @author Marcos Leandro
     * @since  2025-04-02
     */
    public async remove(): Promise<void> {

        console.log("ad");
        const prisma = new PrismaClient();

        try {

            const params = this.command?.getParams() ?? [];
            if (params.length < 1) {
                this.context?.getMessage()?.reply("É necessário fornecer a URL do feed para removê-lo.");
                return;
            }

            const linkUrl = new URL(params[0]);
            if(!linkUrl) {
                throw new Error("Invalid URL");
            }

            const feed = await getSubscriptionByUrl(this.chat!.id, linkUrl.toString());
            if (!feed) {
                this.context?.getMessage()?.reply("Este feed não está cadastrado.");
                return;
            }

            await prisma.feeds_subscribers.update({
                data: { status: false},
                where: { id: feed.id }
            });

            this.context!.getMessage()?.delete();
            return this.list();

        } catch (error: any) {
            const message = "É necessário fornecer uma URL válida para remover um feed.";
            this.context?.getMessage()?.reply(message).catch((err: any) => {
                this.context?.getChat()?.sendMessage(message)
            });

        } finally {
            prisma.$disconnect();
        }

        return;
    }
}
