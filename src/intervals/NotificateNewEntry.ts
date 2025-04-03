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

import { getFeedsWithItems } from "utils/Feeds";
import { getSubscribers } from "utils/Subscribers";
import { getChatById } from "utils/Chats";
import SendMessage from "libraries/telegram/resources/SendMessage";
import { chats, feeds_subscribers, PrismaClient } from "@prisma/client";
import Iinterval from "interfaces/Iinterval";
import Log from "helpers/Log";

export default class NotifcateNewEntry implements Iinterval {

    /**
     * Current interval.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     */
    private interval: NodeJS.Timeout | null = null;

    /**
     * The constructor.
     *
     * @author Marcos Leandro
     * @since  2023-06-07
     */
    public constructor() {

        const run = () => {
            this.run();
        };

        run();
    }

    /**
     * Destroys the interval.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     */
    public destroy(): void {
        if (this.interval) {
            clearTimeout(this.interval);
        }
    }

    /**
     * Interval routines.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     */
    private readonly run = async (): Promise<void> => {

        try {

            const feeds = await getFeedsWithItems();
            if (feeds.length === 0) {
                return;
            }

            feeds.forEach((feed: Record<string, any>) => {
                this.notifyFeedSubscribers(feed);
            });

        } catch (err: any) {
            Log.save(err.message, err.stack)

        } finally {
            this.interval = setTimeout(this.run, 10 * 60 * 1000); // 10 minutes
        }
    }

    /**
     * Notifies the subscribers of a feed.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     *
     * @param feed
     */
    private readonly notifyFeedSubscribers = async (feed: Record<string, any>): Promise<void> => {
        const subscribers = await getSubscribers(feed);
        subscribers.forEach(async subscriber => {
            await this.sendMessage(feed, subscriber).then(_ => this.updateSubscriber(feed, subscriber));
        });
    };

    /**
     * Send the message, if applicable.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     *
     * @param feed
     * @param subscriber
     */
    private sendMessage = async (feed: Record<string, any>, subscriber: feeds_subscribers): Promise<void> => {

        if (feed.feeds_items[0].id === subscriber.last_notification_item_id) {
            return;
        }

        let message = `<b>${feed.title}</b>\n\n`;
        message += `<b>${feed.feeds_items[0].title}</b>\n`;
        message += `${feed.feeds_items[0].description}\n\n`;
        message += `${feed.feeds_items[0].link}`;

        const chat: chats|null = await getChatById(subscriber.chat_id);
        if (!chat) {
            return;
        }

        const sendMessage = new SendMessage();
        await sendMessage
            .setChatId(parseInt(chat!.chat_id.toString()))
            .setText(message)
            .setOptions({ parse_mode: "HTML" })
            .post();
    };

    /**
     * Updates the last notification item id.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     *
     * @param prisma
     * @param feed
     * @param subscriber
     */
    private updateSubscriber = async (feed: Record<string, any>, subscriber: feeds_subscribers): Promise<void> => {
        const prisma = new PrismaClient();
        await prisma.feeds_subscribers.update({
            data: { last_notification_item_id: feed.feeds_items[0].id },
            where: { id: subscriber.id }
        });

        prisma.$disconnect();
    };
}
