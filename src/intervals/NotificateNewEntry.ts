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

import { chats, feeds_subscribers, PrismaClient } from "@prisma/client";
import { getFeedsWithItems } from "utils/Feeds";
import { getSubscribers } from "utils/Subscribers";
import { getChatById } from "utils/Chats";
import SendMessage from "libraries/telegram/resources/SendMessage";
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
        this.interval = setTimeout(this.run, 1 * 60 * 1000); // 1 minute
        Log.save(`[${this.interval}] Notificating...`);
        const feeds = await getFeedsWithItems();
        feeds.forEach((feed: Record<string, any>) => {
            this.notifyFeedSubscribers(feed);
        });
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

            try {
                await this.sendMessages(feed, subscriber);

            } catch (err: any) {
                Log.error(err, true);
            }
        });
    };

    /**
     * Sends the messages, if applicable.
     *
     * @author Marcos Leandro
     * @since  2025-09-09
     *
     * @param feed
     * @param subscriber
     */
    private sendMessages = async (feed: Record<string, any>, subscriber: feeds_subscribers): Promise<void> => {

        feed.feeds_items.forEach((item: Record<string, any>, idx: number) => {
            if (item.id <= (subscriber?.last_notification_item_id || 0)) {
                return;
            }

            /* We're adding a timeout to avoid API flooding. */
            setTimeout(() => {
                this.sendMessage(feed, item, subscriber).then(() => {
                    await this.updateSubscriber(item, subscriber);
                }).catch();
            }, idx * 1000);
        });
    }

    /**
     * Send the message, if applicable.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     *
     * @param feed
     * @param item
     * @param subscriber
     */
    private sendMessage = async (feed: Record<string, any>, item: Record<string, any>, subscriber: feeds_subscribers): Promise<void> => {

        let message = `<b>${this.parseContent(feed.title)}</b>\n\n`;
        message += `<b>${this.parseContent(item.title)}</b>\n\n`;
        message += `${this.parseContent(item.description)}\n\n`;
        message += `${item.link}`;

        const chat: chats|null = await getChatById(subscriber.chat_id);
        if (!chat) {
            return Promise.reject();
        }

        const sendMessage = new SendMessage();
        const response = await sendMessage
            .setChatId(parseInt(chat!.chat_id.toString()))
            .setText(message)
            .setOptions({ parse_mode: "HTML" })
            .post().catch(err => {
                Log.save(`Error while sending message: ${item.id} `, err.message, true, "error");
                return Promise.reject(err);
            });

        try {

            const result = await response.json();
            if (result.ok) {
                return Promise.resolve();
            }

            Log.save(`Error while sending message: ${item.id} :\n` + JSON.stringify(result), sendMessage.getPayload(), true, "error");
            return Promise.reject(JSON.stringify(result));

        } catch (err: any) {
            Log.save(`Error while sending message: ${item.id} `, err.message, true, "error");
            return Promise.reject(err.message);
        }
    };

    /**
     * Updates the last notification item id.
     *
     * @author Marcos Leandro
     * @since  2025-02-25
     *
     * @param item
     * @param subscriber
     */
    private updateSubscriber = async (item: Record<string, any>, subscriber: feeds_subscribers): Promise<void> => {
        const prisma = new PrismaClient();
        await prisma.feeds_subscribers.update({
            data: { last_notification_item_id: item.id },
            where: { id: subscriber.id }
        });

        prisma.$disconnect();
    };

    /**
     * Parses the content, escaping characters if needed.
     *
     * @author Marcos Leandro
     * @since  2025-10-07
     *
     * @param message
     *
     * @return string
     */
    private parseContent(message: string) {
        return message
            .replace(/–/g, "-")
            .replace(/ /g, " ")
            .replace(/<\/?p>\s*/g, "")
            .replace(/<strong>\s*/g, "<b>")
            .replace(/<\/strong>\s*/g, "</b>")
            .replace(/<?br[\s\/]+>\s+/g, "\n")
            .replace(/<\/?[^>]+(>|$)/g, "")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("&", "&amp;")
            .trim();
    }
}
